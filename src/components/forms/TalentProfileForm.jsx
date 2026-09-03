import React, { useState, useEffect, useContext } from 'react';
import Icon from '../shared/Icon';
import PortalSelect from '../shared/PortalSelect';
import SearchableMultiSelect from '../shared/SearchableMultiSelect';
import { TALENT_OPTIONS } from '../../constants/talentOptions';
import { VEHICLE_MAKES, VEHICLE_COLORS } from '../../constants/vehicleOptions';
import { CITY_OPTIONS } from '../../constants/locations';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { AppContext } from '../../context/AppContext';

/* ─── Utility: Calculate age_range from birth_date ─── */
function calcAgeRange(birthDate) {
  if (!birthDate) return '';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (age < 0) return '';
  if (age <= 12) return '0-12';
  if (age <= 19) return '13-19';
  if (age <= 29) return '20-29';
  if (age <= 39) return '30-39';
  if (age <= 49) return '40-49';
  if (age <= 59) return '50-59';
  if (age <= 69) return '60-69';
  return '70+';
}

/* ─── Reusable UI Primitives (Dark Glassmorphism) ─── */

const inputCls = (err) =>
  `w-full h-10 px-3 text-sm text-white font-medium tracking-normal bg-black/20 border rounded-lg outline-none transition-all
   placeholder-slate-500 focus:bg-black/30 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10
   ${err ? 'border-red-500/40' : 'border-white/10'}`;

const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-white/40 uppercase tracking-wider">{label}</label>
    {children}
    {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
  </div>
);

const Block = ({ title, icon, children }) => (
  <div className="glass-panel !rounded-[14px] p-6 lift mb-5">
    <h3 className="text-sm font-semibold text-white tracking-wide border-b border-white/10 pb-4 mb-6 flex items-center gap-2.5">
      {icon && <div className="w-8 h-8 bg-white/10 rounded-[10px] flex items-center justify-center"><Icon name={icon} size={15} color="#818cf8" /></div>}
      {title}
    </h3>
    {children}
  </div>
);

const Toggle = ({ label, name, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <span className="text-sm font-semibold text-slate-300">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
        ${checked ? 'bg-indigo-500' : 'bg-white/10'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
        ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);


/* ═══════════════════════════════════════════════════════
   Main Form Component
═══════════════════════════════════════════════════════ */

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR + 1 - 1900 + 1 }, (_, i) => String(CURRENT_YEAR + 1 - i));

export default function TalentProfileForm({
  initialData = {}, privateData = {},
  skillOptions = [], langOptions = [], ethOptions = [],
  vehicles = [], onVehicleAdded,
  onSubmit, isSubmitting, errorMsg, hideCancel, onCancel
}) {
  const { refreshProfile, mediaItems, profile: authProfile } = useAuth();
  const { showToast } = useContext(AppContext);
  const [form, setForm] = useState({
    // ── Identity ──
    first_name: '', last_name: '', gender: '', birth_date: '', age_range: '',
    union_status: 'Non-union', union_number: '', agent_name: '',
    image_url: '', status: '', role: '',
    // ── Physical ──
    height_ft: '', height_in: '', weight_lbs: '',
    hair_color: '', hair_length: '', eye_color: '',
    physical_disability: '', ethnicity: '',
    // ── Wardrobe / Sizes ──
    shoe_size: '', shirt_size: '', pant_size: '', hat_size: '',
    waist_size_in: '', neck_size_in: '', sleeve_size_in: '', inseam_size_in: '',
    // ── Location / Contact ──
    city: '', province: '', contact_email: '', contact_phone: '',
    // ── Experience / Bio ──
    experience_driving: false, experience_bartending: false, experience_serving: false,
    transportation: '', description: '', recent_credit: '',
    // ── Relations (junction tables) ──
    skills: [], languages: []
  });

  const [priv, setPriv] = useState({ phone: '', street_address: '', unit_number: '', postal_code: '' });
  const [validationErrors, setValidationErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);

  // ── Add Vehicle local state (separate from profile form) ──
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ make: '', model: '', year: '', color: '' });
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [addVehicleError, setAddVehicleError] = useState('');

  // ── Delete Vehicle local state ──
  const [deletingVehicleId, setDeletingVehicleId] = useState(null);
  const [deleteVehicleError, setDeleteVehicleError] = useState('');
  const [vehicleDeleteConfirm, setVehicleDeleteConfirm] = useState(null);

  // ── Delete Media local state ──
  const [deleteMediaConfirm, setDeleteMediaConfirm] = useState(null);

  // ── Edit Vehicle local state ──
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [editVehicle, setEditVehicle] = useState({ make: '', model: '', year: '', color: '' });
  const [updatingVehicle, setUpdatingVehicle] = useState(false);
  const [editVehicleError, setEditVehicleError] = useState('');

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setForm(prev => {
        const merged = { ...prev, ...initialData };
        if (merged.birth_date) merged.age_range = calcAgeRange(merged.birth_date);
        setInitialSnapshot({ ...merged });
        setIsDirty(false);
        return merged;
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (privateData && Object.keys(privateData).length > 0) {
      setPriv(prev => ({ ...prev, ...privateData }));
    }
  }, [privateData]);

  // ── Unified state setter ──
  const set = (key, val) => {
    setForm(p => {
      const next = { ...p, [key]: val };
      if (key === 'birth_date') next.age_range = calcAgeRange(val);
      setIsDirty(true);
      return next;
    });
  };

  // ── Generic handleChange for inputs with name attribute ──
  const handleChange = (e) => {
    set(e.target.name, e.target.value);
    setIsDirty(true);
  };

  // ── Discard changes ──
  const handleDiscard = () => {
    if (initialSnapshot) {
      setForm(initialSnapshot);
      setIsDirty(false);
    }
  };

  // ── Add Vehicle handler ──
  const handleAddVehicle = async () => {
    setAddVehicleError('');

    if (!newVehicle.make.trim()) { setAddVehicleError('Make is required'); return; }
    if (!newVehicle.model.trim()) { setAddVehicleError('Model is required'); return; }
    if (newVehicle.year) {
      const y = parseInt(newVehicle.year, 10);
      if (isNaN(y) || y < 1900 || y > 2100) { setAddVehicleError('Year must be between 1900 and 2100'); return; }
    }

    const profileId = authProfile?.id;
    if (!profileId) { setAddVehicleError('Profile not found. Save your profile first.'); return; }

    setAddingVehicle(true);
    try {
      const row = {
        profile_id: profileId,
        make: newVehicle.make.trim(),
        model: newVehicle.model.trim(),
        year: newVehicle.year ? parseInt(newVehicle.year, 10) : null,
        color: newVehicle.color.trim() || null,
      };

      const { error } = await supabase.from('talent_vehicles').insert(row);
      if (error) throw error;

      setNewVehicle({ make: '', model: '', year: '', color: '' });
      setShowAddVehicle(false);
      if (onVehicleAdded) await onVehicleAdded();
    } catch (err) {
      console.error('Failed to add vehicle:', err);
      setAddVehicleError(err.message || 'Failed to add vehicle.');
    } finally {
      setAddingVehicle(false);
    }
  };

  // ── Edit Vehicle handlers ──
  const handleEditClick = (v) => {
    if (showAddVehicle) return;
    if (editingVehicleId && editingVehicleId !== v.id) return;
    setEditingVehicleId(v.id);
    setEditVehicle({
      make: v.make || '',
      model: v.model || '',
      year: v.year ? String(v.year) : '',
      color: v.color || '',
    });
    setEditVehicleError('');
  };

  const handleCancelEditVehicle = () => {
    setEditingVehicleId(null);
    setEditVehicle({ make: '', model: '', year: '', color: '' });
    setEditVehicleError('');
  };

  const handleUpdateVehicle = async () => {
    setEditVehicleError('');

    if (!editVehicle.make.trim()) { setEditVehicleError('Make is required'); return; }
    if (!editVehicle.model.trim()) { setEditVehicleError('Model is required'); return; }
    if (editVehicle.year) {
      const y = parseInt(editVehicle.year, 10);
      if (isNaN(y) || y < 1900 || y > 2100) { setEditVehicleError('Year must be between 1900 and 2100'); return; }
    }

    setUpdatingVehicle(true);
    try {
      const { data, error } = await supabase
        .from('talent_vehicles')
        .update({
          make: editVehicle.make.trim(),
          model: editVehicle.model.trim(),
          year: editVehicle.year ? parseInt(editVehicle.year, 10) : null,
          color: editVehicle.color || null
        })
        .eq('id', editingVehicleId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Vehicle was not updated.');
      }

      if (onVehicleAdded) await onVehicleAdded();
      handleCancelEditVehicle();
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      setEditVehicleError(err.message || 'Failed to update vehicle.');
    } finally {
      setUpdatingVehicle(false);
    }
  };

  // ── Delete Vehicle handler ──
  const handleDeleteVehicle = async (vehicleId) => {
    setDeletingVehicleId(vehicleId);
    setDeleteVehicleError('');

    try {
      const { data, error } = await supabase
        .from('talent_vehicles')
        .delete()
        .eq('id', vehicleId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Vehicle was not deleted.');
      }

      if (onVehicleAdded) await onVehicleAdded();
      return true;
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
      setDeleteVehicleError(err.message || 'Failed to delete vehicle.');
      return false;
    } finally {
      setDeletingVehicleId(null);
    }
  };

  // ── Browser navigation warning ──
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  /* ─── Media Gallery Handlers ─── */
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Validate quotas
    const currentImages = (mediaItems || []).filter(m => m.type === 'image').length;
    const currentVideos = (mediaItems || []).filter(m => m.type === 'video').length;
    const newImages = files.filter(f => f.type.startsWith('image/')).length;
    const newVideos = files.filter(f => f.type.startsWith('video/')).length;

    if (currentImages + newImages > 5) {
      showToast?.(`Maximum 5 photos allowed. You have ${currentImages}, trying to add ${newImages}.`);
      return;
    }
    if (currentVideos + newVideos > 2) {
      showToast?.(`Maximum 2 videos allowed. You have ${currentVideos}, trying to add ${newVideos}.`);
      return;
    }

    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast?.(`${file.name} exceeds ${isVideo ? '50MB' : '5MB'} limit.`);
        return;
      }
    }

    setMediaUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');
      const profileId = authProfile?.id;
      if (!profileId) throw new Error('Profile not found. Save your profile first.');

      const isGalleryEmpty = !(mediaItems || []).length;

      const uploadResults = await Promise.all(files.map(async (file, idx) => {
        const fileExt = file.name.split('.').pop().toLowerCase();
        const safeBase = (form.first_name || 'media')
          .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '_').slice(0, 15);
        const storagePath = `portfolio/${session.user.id}/${Date.now()}_${idx}_${safeBase}.${fileExt}`;

        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        const bucketId = mediaType === 'image' ? 'talent-images' : 'talent-videos';

        const { error: upErr } = await supabase.storage.from(bucketId).upload(storagePath, file, { upsert: false });
        if (upErr) throw upErr;

        // Public URL only for images; video stays null (resolved at runtime via signed URLs)
        let mediaUrl = null;
        if (mediaType === 'image') {
          const { data: { publicUrl } } = supabase.storage.from(bucketId).getPublicUrl(storagePath);
          mediaUrl = publicUrl;
        }

        const isPrimary = isGalleryEmpty && idx === 0 && mediaType === 'image';

        const { error: dbErr } = await supabase.from('media').insert({
          profile_id: profileId,
          url: mediaUrl,
          storage_path: storagePath,
          type: mediaType,
          provider: 'supabase',
          bucket_id: bucketId,
          status: 'ready',
          access_level: mediaType === 'image' ? 'public' : 'private',
          ai_usage_scope: mediaType === 'image' ? 'profile_search' : 'none',
          mime_type: file.type || null,
          original_filename: file.name || null,
          file_size_bytes: file.size || null,
          is_primary: isPrimary,
          display_order: (mediaItems?.length || 0) + idx,
        });
        if (dbErr) throw dbErr;

        // If this is the first-ever primary, sync to profiles.image_url
        if (isPrimary) {
          await supabase.from('profiles').update({ image_url: mediaUrl }).eq('id', profileId);
          set('image_url', mediaUrl);
        }
        return mediaUrl;
      }));

      await refreshProfile();
      showToast?.(`${uploadResults.length} file${uploadResults.length > 1 ? 's' : ''} uploaded!`);
    } catch (err) {
      console.error('Media upload error:', err);
      showToast?.('Upload failed: ' + err.message);
    } finally {
      setMediaUploading(false);
      // Reset the file input so the same file can be re-selected
      e.target.value = '';
    }
  };

  const handleDeleteMedia = async (item) => {
    try {
      const profileId = authProfile?.id;
      // 1. Delete DB record
      const { error: delErr } = await supabase.rpc('soft_delete_media', {
        p_media_id: item.id,
      });

      if (delErr) throw delErr;

      // 2. Removed direct storage deletion (handled by backend via soft_delete_media)

      // 3. If deleted item was primary, promote next
      if (item.is_primary && profileId) {
        const { data: remaining } = await supabase.from('media')
          .select('*').eq('profile_id', profileId)
          .order('display_order', { ascending: true }).limit(1);

        if (remaining?.length) {
          await supabase.from('media').update({ is_primary: true }).eq('id', remaining[0].id);
          await supabase.from('profiles').update({ image_url: remaining[0].url }).eq('id', profileId);
          set('image_url', remaining[0].url);
        } else {
          await supabase.from('profiles').update({ image_url: null }).eq('id', profileId);
          set('image_url', '');
        }
      }

      await refreshProfile();
      showToast?.('Media deleted.');
    } catch (err) {
      console.error('Delete media error:', err);
      showToast?.('Delete failed: ' + err.message);
    }
  };

  const handleSetPrimary = async (item) => {
    if (item.is_primary) return;
    try {
      const profileId = authProfile?.id;
      if (!profileId) return;

      // 1. Unset all
      await supabase.from('media').update({ is_primary: false }).eq('profile_id', profileId);
      // 2. Set target
      await supabase.from('media').update({ is_primary: true }).eq('id', item.id);
      // 3. Sync profiles.image_url
      await supabase.from('profiles').update({ image_url: item.url }).eq('id', profileId);
      set('image_url', item.url);

      await refreshProfile();
      showToast?.('Primary photo updated!');
    } catch (err) {
      console.error('Set primary error:', err);
      showToast?.('Failed to set primary: ' + err.message);
    }
  };

  const validate = () => {
    const e = {};
    const latinOnly = /^[a-zA-Z\s\-']+$/;
    if (!form.first_name?.trim()) e.first_name = 'First name required';
    else if (!latinOnly.test(form.first_name)) e.first_name = 'Latin characters only (A-Z, spaces, hyphens)';
    if (!form.last_name?.trim()) e.last_name = 'Last name required';
    else if (!latinOnly.test(form.last_name)) e.last_name = 'Latin characters only (A-Z, spaces, hyphens)';
    if (!form.birth_date) e.birth_date = 'Date of birth required';
    if (!priv.phone?.trim()) e.phone = 'Phone number required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;
    const errs = validate();
    if (Object.keys(errs).length) { setValidationErrors(errs); return; }
    setValidationErrors({});
    try {
      await onSubmit(form, priv);
      await refreshProfile();
      setIsSaved(true);
      setIsDirty(false);
      setInitialSnapshot({ ...form });
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      // parent handles
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <form id="talent-form" onSubmit={handleSubmit} className="flex-1 py-2 space-y-0">

        {errorMsg && <div className="p-4 mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl mx-1">{errorMsg}</div>}

        {/* ── Block 0: Media Gallery ── */}
        <Block title="Media Gallery" icon="grid">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Existing media items */}
            {(mediaItems || []).map((item) => (
              <div key={item.id} className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200
                ${item.is_primary ? 'border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.15)]' : 'border-white/10 hover:border-white/20'}`}>
                {/* Thumbnail */}
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={item.url} alt="Media" className="w-full h-full object-cover object-top" />
                )}

                {/* Primary badge */}
                {item.is_primary && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg backdrop-blur-sm">
                    <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Primary
                  </div>
                )}

                {/* Video badge */}
                {item.type === 'video' && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full backdrop-blur-sm">
                    Video
                  </div>
                )}

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2">
                  {/* Top-right delete */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDeleteMediaConfirm(item)}
                      className="w-7 h-7 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center transition-colors backdrop-blur-sm"
                      title="Delete"
                    >
                      <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                  {/* Bottom set-primary */}
                  {!item.is_primary && item.type === 'image' && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(item)}
                      className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-white/15 hover:bg-amber-500/80 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider transition-colors backdrop-blur-sm"
                    >
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      Set Primary
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add Media Card */}
            <label className={`aspect-square rounded-xl border-2 border-dashed border-white/15 hover:border-indigo-400/40
              flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200
              bg-white/[0.03] hover:bg-indigo-500/[0.06] group ${mediaUploading ? 'pointer-events-none opacity-60' : ''}`}>
              {mediaUploading ? (
                <svg className="animate-spin h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                    <svg width="20" height="20" fill="none" stroke="currentColor" className="text-slate-400 group-hover:text-indigo-400 transition-colors" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 4v16m8-8H4"/></svg>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-300 uppercase tracking-wider transition-colors">Add Media</span>
                </>
              )}
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaUpload} disabled={mediaUploading} />
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-3">Max 5 photos (5MB each) · 2 videos (50MB each). First photo becomes your profile avatar.</p>
        </Block>

        {/* ── Block 1: Identity ── */}
        <Block title="Identity" icon="user">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field label={<>First Name <span className="text-red-400">*</span></>} error={validationErrors.first_name}>
              <input required name="first_name" className={inputCls(validationErrors.first_name)} placeholder="First" value={form.first_name || ''} onChange={handleChange} />
            </Field>
            <Field label={<>Last Name <span className="text-red-400">*</span></>} error={validationErrors.last_name}>
              <input required name="last_name" className={inputCls(validationErrors.last_name)} placeholder="Last" value={form.last_name || ''} onChange={handleChange} />
            </Field>
            <PortalSelect label="Gender" value={form.gender} onChange={v => set('gender', v)} options={TALENT_OPTIONS.GENDER} />
            <Field label={<>Date of Birth <span className="text-red-400">*</span></>} error={validationErrors.birth_date}>
              <input required name="birth_date" type="date" className={inputCls(validationErrors.birth_date)} value={form.birth_date || ''} onChange={handleChange} />
            </Field>
            <Field label="Age Range (auto)">
              <div className={`${inputCls()} flex items-center bg-white/5 cursor-not-allowed text-slate-400`}>
                {form.age_range || '—'}
              </div>
            </Field>
            <PortalSelect label="Union Status" value={form.union_status} onChange={v => set('union_status', v)} options={TALENT_OPTIONS.UNION} />
            <Field label="Union Number">
              <input name="union_number" className={inputCls()} placeholder="Optional..." value={form.union_number || ''} onChange={handleChange} />
            </Field>
            <Field label="Agent Name">
              <input name="agent_name" className={inputCls()} placeholder="e.g. John Smith Agency" value={form.agent_name || ''} onChange={handleChange} />
            </Field>
          </div>
        </Block>

        {/* ── Block 2: Appearance & Ethnicity ── */}
        <Block title="Appearance & Ethnicity" icon="user">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            <Field label="Height (ft)">
              <input name="height_ft" className={inputCls()} type="number" min="0" placeholder="ft" value={form.height_ft || ''} onChange={handleChange} />
            </Field>
            <Field label="Height (in)">
              <input name="height_in" className={inputCls()} type="number" min="0" max="11" placeholder="in" value={form.height_in || ''} onChange={handleChange} />
            </Field>
            <Field label="Weight (lbs)">
              <input name="weight_lbs" className={inputCls()} type="number" min="0" placeholder="lbs" value={form.weight_lbs || ''} onChange={handleChange} />
            </Field>
            <PortalSelect label="Hair Color" value={form.hair_color} onChange={v => set('hair_color', v)} options={TALENT_OPTIONS.HAIR_COLOR} />
            <PortalSelect label="Hair Length" value={form.hair_length} onChange={v => set('hair_length', v)} options={TALENT_OPTIONS.HAIR_LENGTH} />
            <PortalSelect label="Eye Color" value={form.eye_color} onChange={v => set('eye_color', v)} options={TALENT_OPTIONS.EYE_COLOR} />
            <PortalSelect label="Ethnicity" value={form.ethnicity} onChange={v => set('ethnicity', v)} options={ethOptions && ethOptions.length > 0 ? ethOptions : TALENT_OPTIONS.ETHNICITY} />
          </div>
          <div className="mt-5">
            <Field label="Physical Disability (if applicable)">
              <input name="physical_disability" className={inputCls()} placeholder="Describe any physical disability..." value={form.physical_disability || ''} onChange={handleChange} />
            </Field>
          </div>
        </Block>

        {/* ── Block 3: Measurements ── */}
        <Block title="Measurements" icon="settings">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            <PortalSelect label="Shoe Size" value={form.shoe_size} onChange={v => set('shoe_size', v)} options={TALENT_OPTIONS.SHOE_SIZE} />
            <PortalSelect label="Shirt Size" value={form.shirt_size} onChange={v => set('shirt_size', v)} options={TALENT_OPTIONS.SHIRT_SIZE} />
            <PortalSelect label="Pant Size" value={form.pant_size} onChange={v => set('pant_size', v)} options={TALENT_OPTIONS.PANT_SIZE} />
            <PortalSelect label="Hat Size" value={form.hat_size} onChange={v => set('hat_size', v)} options={TALENT_OPTIONS.HAT_SIZE} />
            <Field label="Waist (in)">
              <input name="waist_size_in" className={inputCls()} type="number" min="0" placeholder="e.g. 32" value={form.waist_size_in || ''} onChange={handleChange} />
            </Field>
            <Field label="Neck (in)">
              <input name="neck_size_in" className={inputCls()} type="number" min="0" placeholder="e.g. 15" value={form.neck_size_in || ''} onChange={handleChange} />
            </Field>
            <Field label="Sleeve (in)">
              <input name="sleeve_size_in" className={inputCls()} type="number" min="0" placeholder="e.g. 34" value={form.sleeve_size_in || ''} onChange={handleChange} />
            </Field>
            <Field label="Inseam (in)">
              <input name="inseam_size_in" className={inputCls()} type="number" min="0" placeholder="e.g. 30" value={form.inseam_size_in || ''} onChange={handleChange} />
            </Field>
          </div>
        </Block>

        {/* ── Block 4: Professional & Location ── */}
        <Block title="Professional & Location" icon="folder">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PortalSelect label="City" value={form.city} onChange={v => set('city', v)} options={CITY_OPTIONS} placeholder="Select your city" />
            <PortalSelect label="Province" value={form.province} onChange={v => set('province', v)} options={TALENT_OPTIONS.PROVINCES} />
            <PortalSelect label="Transportation" value={form.transportation} onChange={v => set('transportation', v)} options={TALENT_OPTIONS.TRANSPORTATION} />
            <Field label="Contact Email">
              <input name="contact_email" type="email" className={inputCls()} placeholder="email@example.com" value={form.contact_email || ''} onChange={handleChange} />
            </Field>
            <Field label="Contact Phone">
              <input name="contact_phone" type="tel" className={inputCls()} placeholder="(416) 555-0199" value={form.contact_phone || ''} onChange={handleChange} />
            </Field>
            <Field label="Recent Credit">
              <input name="recent_credit" className={inputCls()} placeholder="e.g. 'Suits' Season 9" value={form.recent_credit || ''} onChange={handleChange} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-1 mt-4 max-w-xl">
            <Toggle label="Can Drive" name="experience_driving" checked={!!form.experience_driving} onChange={v => set('experience_driving', v)} />
            <Toggle label="Bartending Exp." name="experience_bartending" checked={!!form.experience_bartending} onChange={v => set('experience_bartending', v)} />
            <Toggle label="Serving Exp." name="experience_serving" checked={!!form.experience_serving} onChange={v => set('experience_serving', v)} />
          </div>
          <div className="mt-5">
            <Field label="Description / Bio">
              <textarea name="description" rows={4} className={`${inputCls()} h-auto py-3 resize-none`} placeholder="Summarize your experience and professional highlights..." value={form.description || ''} onChange={handleChange} />
            </Field>
          </div>
        </Block>

        {/* ── Block 4b: Vehicles ── */}
        <Block title="Vehicles" icon="folder">
          {vehicles.length === 0 && !showAddVehicle && (
            <p className="text-sm text-slate-500 italic">No vehicles on file.</p>
          )}
          {deleteVehicleError && (
            <p className="text-xs text-red-400 font-semibold mb-2">{deleteVehicleError}</p>
          )}
          {vehicles.length > 0 && (
            <div className="space-y-3">
              {vehicles.map(v => (
                editingVehicleId === v.id ? (
                  <div key={v.id} className="flex flex-col gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                    {editVehicleError && <p className="text-xs text-red-400 font-semibold">{editVehicleError}</p>}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <PortalSelect label={<>Make <span className="text-red-400">*</span></>} value={editVehicle.make} onChange={val => setEditVehicle(p => ({ ...p, make: val }))} options={VEHICLE_MAKES} placeholder="Select make" />
                      <Field label={<>Model <span className="text-red-400">*</span></>}>
                        <input className={inputCls()} placeholder="e.g. Camry" value={editVehicle.model} onChange={e => setEditVehicle(p => ({ ...p, model: e.target.value }))} />
                      </Field>
                      <PortalSelect label="Year" value={editVehicle.year} onChange={val => setEditVehicle(p => ({ ...p, year: val }))} options={YEAR_OPTIONS} placeholder="Select year" />
                      <PortalSelect label="Color" value={editVehicle.color} onChange={val => setEditVehicle(p => ({ ...p, color: val }))} options={VEHICLE_COLORS} placeholder="Select color" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleUpdateVehicle} disabled={updatingVehicle}
                        className="btn-primary h-8 px-4 !rounded-lg text-xs font-bold flex items-center gap-1.5">
                        {updatingVehicle ? 'Saving…' : 'Save'}
                      </button>
                      <button type="button" disabled={updatingVehicle}
                        onClick={handleCancelEditVehicle}
                        className="h-8 px-4 border border-white/10 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={v.id} className="flex items-center gap-4 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Make</span>
                        <p className="text-sm text-white font-medium">{v.make}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Model</span>
                        <p className="text-sm text-white font-medium">{v.model}</p>
                      </div>
                      {v.year && (
                        <div>
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Year</span>
                          <p className="text-sm text-white font-medium">{v.year}</p>
                        </div>
                      )}
                      {v.color && (
                        <div>
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Color</span>
                          <p className="text-sm text-white font-medium">{v.color}</p>
                        </div>
                      )}
                    </div>
                    {typeof onVehicleAdded === 'function' && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleEditClick(v)}
                          disabled={showAddVehicle || (editingVehicleId !== null && editingVehicleId !== v.id)}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setVehicleDeleteConfirm(v)}
                          className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          )}

          {/* Add Vehicle inline form */}
          {typeof onVehicleAdded === 'function' && (
            showAddVehicle ? (
              <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                {addVehicleError && <p className="text-xs text-red-400 font-semibold">{addVehicleError}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <PortalSelect label={<>Make <span className="text-red-400">*</span></>} value={newVehicle.make} onChange={v => setNewVehicle(p => ({ ...p, make: v }))} options={VEHICLE_MAKES} placeholder="Select make" />
                  <Field label={<>Model <span className="text-red-400">*</span></>}>
                    <input className={inputCls()} placeholder="e.g. Camry" value={newVehicle.model} onChange={e => setNewVehicle(p => ({ ...p, model: e.target.value }))} />
                  </Field>
                  <PortalSelect label="Year" value={newVehicle.year} onChange={v => setNewVehicle(p => ({ ...p, year: v }))} options={YEAR_OPTIONS} placeholder="Select year" />
                  <PortalSelect label="Color" value={newVehicle.color} onChange={v => setNewVehicle(p => ({ ...p, color: v }))} options={VEHICLE_COLORS} placeholder="Select color" />
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleAddVehicle} disabled={addingVehicle}
                    className="btn-primary h-8 px-4 !rounded-lg text-xs font-bold flex items-center gap-1.5">
                    {addingVehicle ? 'Saving…' : 'Save Vehicle'}
                  </button>
                  <button type="button" disabled={addingVehicle}
                    onClick={() => { setShowAddVehicle(false); setNewVehicle({ make: '', model: '', year: '', color: '' }); setAddVehicleError(''); }}
                    className="h-8 px-4 border border-white/10 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setShowAddVehicle(true)}
                disabled={editingVehicleId !== null}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 4v16m8-8H4"/></svg>
                Add Vehicle
              </button>
            )
          )}
        </Block>

        {/* ── Block 5: Skills & Languages ── */}
        <Block title="Skills & Languages" icon="folder">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-[300px]">
            <div className="relative z-[100]">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Skills</label>
              <SearchableMultiSelect
                options={skillOptions}
                selectedIds={form.skills || []}
                onChange={v => set('skills', v)}
                placeholder="Select skills..."
              />
            </div>
            <div className="relative z-[90]">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Languages</label>
              <SearchableMultiSelect
                options={langOptions}
                selectedIds={form.languages || []}
                onChange={v => set('languages', v)}
                placeholder="Select languages..."
              />
            </div>
          </div>
        </Block>

        {/* ── Block 6: Private Information ── */}
        <Block title="Private Information" icon="lock">
          <p className="text-xs text-slate-500 -mt-3 mb-5 font-medium">This information is securely stored and only visible to you and authorized agents.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Field label={<>Phone <span className="text-red-400">*</span></>} error={validationErrors.phone}>
              <input required name="phone" className={inputCls(validationErrors.phone)} type="tel" placeholder="(416) 555-0123" value={priv.phone || ''} onChange={e => { setPriv(p => ({ ...p, phone: e.target.value })); setIsDirty(true); }} />
            </Field>
            <Field label="Street Address">
              <input name="street_address" className={inputCls()} placeholder="123 Main Street" value={priv.street_address || ''} onChange={e => { setPriv(p => ({ ...p, street_address: e.target.value })); setIsDirty(true); }} />
            </Field>
            <Field label="Unit Number">
              <input name="unit_number" className={inputCls()} placeholder="Apt 4B" value={priv.unit_number || ''} onChange={e => { setPriv(p => ({ ...p, unit_number: e.target.value })); setIsDirty(true); }} />
            </Field>
            <Field label="Postal Code">
              <input name="postal_code" className={inputCls()} placeholder="M5V 2T6" value={priv.postal_code || ''} onChange={e => { setPriv(p => ({ ...p, postal_code: e.target.value })); setIsDirty(true); }} />
            </Field>
          </div>
        </Block>

        {/* ── Vehicle Delete Confirmation Modal ── */}
        {vehicleDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass-panel !rounded-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Delete Vehicle?
                </h3>
                <p className="text-sm text-white/40 mb-2">
                  This action cannot be undone.
                </p>
                <p className="text-sm font-semibold text-white/80 mb-6">
                  {vehicleDeleteConfirm.make} {vehicleDeleteConfirm.model}{vehicleDeleteConfirm.year ? ` ${vehicleDeleteConfirm.year}` : ''}
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setVehicleDeleteConfirm(null)}
                    disabled={deletingVehicleId === vehicleDeleteConfirm.id}
                    className="flex-1 h-11 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await handleDeleteVehicle(vehicleDeleteConfirm.id);
                      if (success) setVehicleDeleteConfirm(null);
                    }}
                    disabled={deletingVehicleId === vehicleDeleteConfirm.id}
                    className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {deletingVehicleId === vehicleDeleteConfirm.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Media Delete Confirmation Modal ── */}
        {deleteMediaConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass-panel !rounded-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Delete {deleteMediaConfirm.type === 'image' ? 'Photo' : deleteMediaConfirm.type === 'video' ? 'Video' : 'Audio'}?
                </h3>
                <p className="text-sm text-white/40 mb-6">
                  This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setDeleteMediaConfirm(null)}
                    className="flex-1 h-11 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleDeleteMedia(deleteMediaConfirm);
                      setDeleteMediaConfirm(null);
                    }}
                    className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </form>

      {/* ── Sticky Footer: only visible when there are unsaved changes ── */}
      {isDirty && (
        <div className="sticky bottom-0 z-10 flex items-center gap-3 px-6 py-3
          border-t border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-amber-400">
            <svg width="14" height="14" fill="none" stroke="currentColor"
              strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <span className="text-xs font-semibold">You have unsaved changes</span>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isSubmitting}
            className="h-9 px-4 border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:bg-white/5 transition-colors disabled:opacity-50">
            Discard Changes
          </button>
          <button
            type="submit"
            form="talent-form"
            disabled={isSubmitting || uploading}
            className="btn-primary h-9 px-5 !rounded-xl text-xs font-bold flex items-center gap-2 min-w-[130px] justify-center">
            {isSubmitting || uploading ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : 'Save Profile'}
          </button>
        </div>
      )}
    </div>
  );
}

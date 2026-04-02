import React, { useState, useEffect } from 'react';
import Icon from '../shared/Icon';
import { TALENT_OPTIONS } from '../../constants/talentOptions';
import { supabase } from '../../services/supabaseClient';

/* ─── Reusable UI Primitives ─── */

const inputCls = (err) =>
  `w-full h-10 px-3 text-[13px] text-slate-800 bg-slate-50 border rounded-lg outline-none transition-all
   focus:bg-white focus:border-navy-400 focus:ring-4 focus:ring-navy-900/10
   ${err ? 'border-red-300' : 'border-slate-200'}`;

const Field = ({ label, error, children, span }) => (
  <div className={`flex flex-col gap-1.5 ${span || ''}`}>
    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
    {children}
    {error && <p className="text-[10px] text-red-500 font-semibold">{error}</p>}
  </div>
);

const Block = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl p-8 border border-gray-100 mb-6">
    <h3 className="text-[15px] font-extrabold text-navy-900 tracking-tight border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
      {icon && <Icon name={icon} size={16} color="#1e293b" />}
      {title}
    </h3>
    {children}
  </div>
);

const SelectField = ({ label, value, onChange, options, placeholder = 'Select...' }) => (
  <Field label={label}>
    <div className="relative">
      <select
        className={`${inputCls()} appearance-none pr-9`}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options?.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <Icon name="chevDown" size={14} color="#94a3b8" />
      </div>
    </div>
  </Field>
);

const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <span className="text-[13px] font-semibold text-slate-700">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
        ${checked ? 'bg-navy-900' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
        ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const SearchableMultiSelect = ({ label, selected = [], options = [], onToggle, placeholder }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()) && !selected.includes(o));

  return (
    <Field label={label}>
      <div className="flex flex-col gap-2">
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map(item => (
              <span key={item} className="px-2.5 py-1 bg-navy-900 text-white rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                {item}
                <button type="button" onClick={() => onToggle(item)} className="w-[14px] h-[14px] rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors">
                  <Icon name="close" size={8} color="white" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" size={14} color="currentColor" />
          </div>
          <input
            type="text"
            className={`${inputCls()} pl-9 font-medium placeholder:font-normal`}
            placeholder={placeholder || `Search and add...`}
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
          />
          {open && filtered.length > 0 && (
            <div className="absolute top-[calc(100%+6px)] left-0 w-full max-h-[200px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1">
              {filtered.map(item => (
                <button
                  key={item}
                  type="button"
                  className="w-full text-left px-4 py-2 text-[13px] text-slate-700 hover:bg-indigo-50 font-medium transition-colors"
                  onMouseDown={e => { e.preventDefault(); onToggle(item); setSearch(''); setOpen(false); }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Field>
  );
};


/* ─── Main Form Component ─── */

export default function TalentProfileForm({ initialData = {}, privateData = {}, onSubmit, isSubmitting, errorMsg, hideCancel, onCancel }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', gender: '', birth_date: '', age_range: '', union_status: 'Non-Union', union_number: '',
    height_ft: '', height_in: '', weight_lbs: '', hair_color: '', hair_length: '', eye_color: '', ethnicity: [], physical_disability: false,
    shoe_size: '', shirt_size: '', pant_size: '', waist_size_in: '', neck_size_in: '', sleeve_size_in: '', inseam_size_in: '', hat_size: '',
    languages: [], experience_driving: false, experience_bartending: false, experience_serving: false, transportation: '', description: '', skills: [],
    city: '', province: '', image_url: ''
  });

  const [priv, setPriv] = useState({ phone: '', street_address: '', postal_code: '' });
  const [validationErrors, setValidationErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setForm(prev => {
        const merged = { ...prev, ...initialData };
        if (typeof merged.ethnicity === 'string') merged.ethnicity = merged.ethnicity ? [merged.ethnicity] : [];
        if (!Array.isArray(merged.ethnicity)) merged.ethnicity = [];
        if (!Array.isArray(merged.skills)) merged.skills = [];
        if (!Array.isArray(merged.languages)) merged.languages = [];
        return merged;
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (privateData && Object.keys(privateData).length > 0) {
      setPriv(prev => ({ ...prev, ...privateData }));
    }
  }, [privateData]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const toggleArrayItem = (field, val) => {
    setForm(p => {
      const arr = Array.isArray(p[field]) ? p[field] : [];
      return { ...p, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  };

  /* ─── Photo Upload ─── */
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const filePath = `${session.user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      set('image_url', publicUrl);
    } catch (err) {
      console.error('Photo upload error:', err);
      alert('Photo upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.first_name?.trim()) e.first_name = 'First name required';
    if (!form.last_name?.trim()) e.last_name = 'Last name required';
    if (!form.birth_date) e.birth_date = 'Date of birth required';
    if (!priv.phone?.trim()) e.phone = 'Phone number required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return; // Prevent saving while photo is uploading
    const errs = validate();
    if (Object.keys(errs).length) { setValidationErrors(errs); return; }
    setValidationErrors({});
    console.log("DEBUG: Final image_url before save:", form.image_url);
    try {
      await onSubmit(form, priv);
    } catch (err) { /* handled by parent */ }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <form id="talent-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-2 space-y-0 scroll-smooth">

        {errorMsg && <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl mx-1">{errorMsg}</div>}

        {/* ── Block 0: Profile Photo ── */}
        <Block title="Profile Photo" icon="user">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
              {form.image_url ? (
                <img src={form.image_url} alt="Profile" className="w-full h-full object-cover object-top" />
              ) : (
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <svg className="animate-spin h-6 w-6 text-navy-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-[13px] font-bold rounded-lg transition-colors shadow-sm">
                <Icon name="plus" size={14} color="white" />
                {form.image_url ? 'Change Photo' : 'Upload Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
              <p className="text-[11px] text-slate-400">JPG, PNG or WebP. Max 5MB.</p>
            </div>
          </div>
        </Block>

        {/* ── Block 1: Identity ── */}
        <Block title="Identity" icon="user">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field label={<>First Name <span className="text-red-500">*</span></>} error={validationErrors.first_name}>
              <input required className={inputCls(validationErrors.first_name)} placeholder="First" value={form.first_name || ''} onChange={e => set('first_name', e.target.value)} />
            </Field>
            <Field label={<>Last Name <span className="text-red-500">*</span></>} error={validationErrors.last_name}>
              <input required className={inputCls(validationErrors.last_name)} placeholder="Last" value={form.last_name || ''} onChange={e => set('last_name', e.target.value)} />
            </Field>
            <SelectField label="Gender" value={form.gender} onChange={v => set('gender', v)} options={TALENT_OPTIONS.GENDER} />
            <Field label={<>Date of Birth <span className="text-red-500">*</span></>} error={validationErrors.birth_date}>
              <input required type="date" className={inputCls(validationErrors.birth_date)} value={form.birth_date || ''} onChange={e => set('birth_date', e.target.value)} />
            </Field>
            <SelectField label="Age Range" value={form.age_range} onChange={v => set('age_range', v)} options={TALENT_OPTIONS.AGE_RANGE} />
            <SelectField label="Union Status" value={form.union_status} onChange={v => set('union_status', v)} options={TALENT_OPTIONS.UNION} />
            <Field label="Union Number">
              <input className={inputCls()} placeholder="Optional..." value={form.union_number || ''} onChange={e => set('union_number', e.target.value)} />
            </Field>
          </div>
        </Block>

        {/* ── Block 2: Physical Appearance ── */}
        <Block title="Physical Appearance" icon="user">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            <Field label="Height (ft)">
              <input className={inputCls()} type="number" min="0" placeholder="ft" value={form.height_ft || ''} onChange={e => set('height_ft', e.target.value)} />
            </Field>
            <Field label="Height (in)">
              <input className={inputCls()} type="number" min="0" max="11" placeholder="in" value={form.height_in || ''} onChange={e => set('height_in', e.target.value)} />
            </Field>
            <Field label="Weight (lbs)">
              <input className={inputCls()} type="number" min="0" placeholder="lbs" value={form.weight_lbs || ''} onChange={e => set('weight_lbs', e.target.value)} />
            </Field>
            <SelectField label="Hair Color" value={form.hair_color} onChange={v => set('hair_color', v)} options={TALENT_OPTIONS.HAIR_COLOR} />
            <SelectField label="Hair Length" value={form.hair_length} onChange={v => set('hair_length', v)} options={TALENT_OPTIONS.HAIR_LENGTH} />
            <SelectField label="Eye Color" value={form.eye_color} onChange={v => set('eye_color', v)} options={TALENT_OPTIONS.EYE_COLOR} />
          </div>
          <div className="mt-5">
            <SearchableMultiSelect
              label="Ethnicity"
              selected={form.ethnicity || []}
              options={TALENT_OPTIONS.ETHNICITY}
              onToggle={v => toggleArrayItem('ethnicity', v)}
              placeholder="Search ethnicities..."
            />
          </div>
          <div className="mt-5 max-w-xs">
            <Toggle label="Physical Disability" checked={!!form.physical_disability} onChange={v => set('physical_disability', v)} />
          </div>
        </Block>

        {/* ── Block 3: Measurements ── */}
        <Block title="Measurements" icon="settings">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            <SelectField label="Shoe Size" value={form.shoe_size} onChange={v => set('shoe_size', v)} options={TALENT_OPTIONS.SHOE_SIZE} />
            <SelectField label="Shirt Size" value={form.shirt_size} onChange={v => set('shirt_size', v)} options={TALENT_OPTIONS.SHIRT_SIZE} />
            <SelectField label="Pant Size" value={form.pant_size} onChange={v => set('pant_size', v)} options={TALENT_OPTIONS.PANT_SIZE} />
            <SelectField label="Hat Size" value={form.hat_size} onChange={v => set('hat_size', v)} options={TALENT_OPTIONS.HAT_SIZE} />
            <Field label="Waist (in)">
              <input className={inputCls()} type="number" min="0" placeholder="e.g. 32" value={form.waist_size_in || ''} onChange={e => set('waist_size_in', e.target.value)} />
            </Field>
            <Field label="Neck (in)">
              <input className={inputCls()} type="number" min="0" placeholder="e.g. 15" value={form.neck_size_in || ''} onChange={e => set('neck_size_in', e.target.value)} />
            </Field>
            <Field label="Sleeve (in)">
              <input className={inputCls()} type="number" min="0" placeholder="e.g. 34" value={form.sleeve_size_in || ''} onChange={e => set('sleeve_size_in', e.target.value)} />
            </Field>
            <Field label="Inseam (in)">
              <input className={inputCls()} type="number" min="0" placeholder="e.g. 30" value={form.inseam_size_in || ''} onChange={e => set('inseam_size_in', e.target.value)} />
            </Field>
          </div>
        </Block>

        {/* ── Block 4: Professional & Location ── */}
        <Block title="Professional & Location" icon="folder">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="City">
              <input className={inputCls()} placeholder="e.g. Toronto" value={form.city || ''} onChange={e => set('city', e.target.value)} />
            </Field>
            <SelectField label="Province" value={form.province} onChange={v => set('province', v)} options={TALENT_OPTIONS.PROVINCES} />
            <SelectField label="Transportation" value={form.transportation} onChange={v => set('transportation', v)} options={TALENT_OPTIONS.TRANSPORTATION} />
            <div /> {/* spacer */}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-1 mt-4 max-w-xl">
            <Toggle label="Can Drive" checked={!!form.experience_driving} onChange={v => set('experience_driving', v)} />
            <Toggle label="Bartending Exp." checked={!!form.experience_bartending} onChange={v => set('experience_bartending', v)} />
            <Toggle label="Serving Exp." checked={!!form.experience_serving} onChange={v => set('experience_serving', v)} />
          </div>
          <div className="mt-5">
            <Field label="Description / Bio">
              <textarea rows={4} className={`${inputCls()} h-auto py-3 resize-none`} placeholder="Summarize your experience and professional highlights..." value={form.description || ''} onChange={e => set('description', e.target.value)} />
            </Field>
          </div>
        </Block>

        {/* ── Block 5: Skills & Languages ── */}
        <Block title="Skills & Languages" icon="starFill">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SearchableMultiSelect
              label="Skills (Special)"
              selected={form.skills || []}
              options={TALENT_OPTIONS.SKILLS_LIST}
              onToggle={v => toggleArrayItem('skills', v)}
              placeholder="Search and add skills..."
            />
            <SearchableMultiSelect
              label="Languages"
              selected={form.languages || []}
              options={TALENT_OPTIONS.LANGUAGES_LIST}
              onToggle={v => toggleArrayItem('languages', v)}
              placeholder="Search and add languages..."
            />
          </div>
        </Block>

        {/* ── Block 6: Private Information ── */}
        <Block title="Private Information" icon="settings">
          <p className="text-xs text-slate-400 -mt-3 mb-5 font-medium">This information is securely stored and only visible to you and authorized agents.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Field label={<>Phone <span className="text-red-500">*</span></>} error={validationErrors.phone}>
              <input required className={inputCls(validationErrors.phone)} type="tel" placeholder="(416) 555-0123" value={priv.phone || ''} onChange={e => setPriv(p => ({ ...p, phone: e.target.value }))} />
            </Field>
            <Field label="Street Address">
              <input className={inputCls()} placeholder="123 Main Street" value={priv.street_address || ''} onChange={e => setPriv(p => ({ ...p, street_address: e.target.value }))} />
            </Field>
            <Field label="Postal Code">
              <input className={inputCls()} placeholder="M5V 2T6" value={priv.postal_code || ''} onChange={e => setPriv(p => ({ ...p, postal_code: e.target.value }))} />
            </Field>
          </div>
        </Block>

      </form>

      {/* ── Sticky Footer ── */}
      <div className="flex items-center gap-3 p-5 px-8 border-t border-slate-200 bg-white z-10 sticky bottom-0">
        {!hideCancel && (
          <button type="button" onClick={onCancel} disabled={isSubmitting}
            className="h-10 px-5 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
        )}
        <div className="flex-1" />
        <button type="submit" form="talent-form" disabled={isSubmitting || uploading}
          className="min-w-[160px] h-10 bg-navy-900 hover:bg-navy-800 rounded-xl text-[13px] font-bold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-navy-900/15">
          {isSubmitting || uploading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            'Save Profile'
          )}
        </button>
      </div>
    </div>
  );
}

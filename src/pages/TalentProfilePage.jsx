import React, { useState, useEffect, useContext } from 'react';
import TalentProfileForm from '../components/forms/TalentProfileForm';
import ProfileSummaryCard from '../components/talent/ProfileSummaryCard';
import { supabase } from '../services/supabaseClient';
import { AppContext } from '../context/AppContext';

export default function TalentProfilePage() {
  const { showToast } = useContext(AppContext);
  const [profile, setProfile] = useState(null);
  const [privateInfo, setPrivateInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  /* ── Parallel Dual-Table Fetch ── */
  useEffect(() => {
    async function loadData() {
      try {
        // FIXED: Using getSession() prevents the network deadlock caused by getUser()
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
          setIsLoading(false);
          return;
        }

        const [profileRes, privateRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('auth_id', user.id).single(),
          supabase.from('profile_private_info').select('*').eq('auth_id', user.id).single()
        ]);

        if (profileRes.error && profileRes.error.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileRes.error);
        }
        if (profileRes.data) {
          const clean = {};
          Object.keys(profileRes.data).forEach(k => {
            if (profileRes.data[k] !== null) clean[k] = profileRes.data[k];
          });
          setProfile(clean);
        }

        if (privateRes.error && privateRes.error.code !== 'PGRST116') {
          console.error('Private info fetch error:', privateRes.error);
        }
        if (privateRes.data) {
          setPrivateInfo(privateRes.data);
        }
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  /* ── Sequential Dual-Table Save ── */
  const handleSubmit = async (formData, privData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) throw new Error('Not authenticated');
      const authId = user.id;

      // ─ Pre-flight validation ─
      if (!formData.first_name?.trim() || !formData.last_name?.trim() || !formData.birth_date || !privData.phone?.trim()) {
        setSubmitError('First Name, Last Name, Date of Birth, Phone, and Profile Photo are strictly required.');
        setIsSubmitting(false);
        return;
      }

      // ─ Build profile payload ─
      const profilePayload = {
        ...formData,
        name: `${formData.first_name || ''} ${formData.last_name || ''}`.trim(),
        updated_at: new Date().toISOString()
      };

      // Sanitize: empty birth_date → null to prevent PG casting errors
      if (profilePayload.birth_date === '') profilePayload.birth_date = null;

      // Cast numeric fields to numbers
      const numFields = ['height_ft', 'height_in', 'weight_lbs', 'waist_size_in', 'neck_size_in', 'sleeve_size_in', 'inseam_size_in', 'rate', 'age', 'credits'];
      numFields.forEach(f => {
        if (profilePayload[f] !== undefined && profilePayload[f] !== '') {
          profilePayload[f] = parseFloat(profilePayload[f]);
        } else {
          delete profilePayload[f];
        }
      });

      // FIXED: Only skills and languages are JSONB arrays
      ['skills', 'languages'].forEach(f => {
        if (profilePayload[f] && !Array.isArray(profilePayload[f])) {
          profilePayload[f] = [];
        }
      });

      // FIXED: Ethnicity must be a string (text column in DB)
      if (Array.isArray(profilePayload.ethnicity)) {
        profilePayload.ethnicity = profilePayload.ethnicity.join(', ');
      }

      // ─ Build private payload ─
      const privatePayload = {
        phone: privData.phone || null,
        street_address: privData.street_address || null,
        postal_code: privData.postal_code || null
      };

      // ─ Atomic RPC call ─
      const { error: rpcError } = await supabase.rpc('update_talent_profile_full', {
        p_auth_id: authId,
        p_profile_data: profilePayload,
        p_private_data: privatePayload
      });

      if (rpcError) throw rpcError;

      // Refresh local state
      const [profileRes, privateRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('auth_id', authId).single(),
        supabase.from('profile_private_info').select('*').eq('auth_id', authId).single()
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (privateRes.data) setPrivateInfo(privateRes.data);

      showToast('Profile updated successfully!');
    } catch (error) {
      console.error('Save error:', error);
      setSubmitError(error.message || 'Failed to update profile.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Loading State ── */
  if (isLoading) {
    return (
      <div className="flex-1 w-full flex justify-center items-center bg-slate-50">
        <div className="animate-spin w-8 h-8 rounded-full border-[3px] border-navy-900 border-t-transparent"></div>
      </div>
    );
  }

  /* ── Map profile for summary card ── */
  const displayUser = {
    name: profile?.name || '',
    age: profile?.age || 0,
    location: profile?.city && profile?.province ? `${profile.city}, ${profile.province}` : (profile?.location || ''),
    rating: profile?.rating || 0,
    credits: profile?.credits || 0,
    submitted: 0,
    rate: profile?.rate || 0,
    union: profile?.union_status || '',
    status: profile?.status === 'available' ? 'Online Now' : '',
    skills: profile?.skills || [],
    languages: profile?.languages || [],
    heroImg: profile?.image_url || '',
    avatar: profile?.image_url || ''
  };

  /* ── Render ── */
  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto w-full bg-slate-50 pb-12">
      <div className="w-full px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Profile Management</h1>
          <p className="text-sm text-slate-500 mt-1.5 font-medium tracking-tight">Complete your professional profile to increase your visibility to casting directors.</p>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Left Column — Profile Summary */}
          <div className="col-span-3 sticky top-6 flex flex-col gap-4">
            <ProfileSummaryCard user={displayUser} />
          </div>

          {/* Right Column — Sectional Blocks */}
          <div className="col-span-9">
            <TalentProfileForm
              initialData={profile || {}}
              privateData={privateInfo || {}}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              errorMsg={submitError}
              hideCancel={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
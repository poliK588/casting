import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TalentProfileForm from '../components/forms/TalentProfileForm';
import ProfileCompletionBanner from '../components/talent/ProfileCompletionBanner';
import { supabase } from '../services/supabaseClient';
import { profileGuard } from '../utils/profileGuard';

export default function TalentProfilePage() {
  const { refreshProfile } = useOutletContext();
  const [formData, setFormData] = useState(null);
  const [privateData, setPrivateData] = useState(null);
  const [skillOptions, setSkillOptions] = useState([]);
  const [langOptions, setLangOptions] = useState([]);
  const [ethOptions, setEthOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mediaCount, setMediaCount] = useState(0);

  // ── Load Logic ──
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Main Payload + Joins
        const { data, error } = await supabase
          .from('profiles')
          .select('*, profile_private_info(*), user_skills(*), user_languages(*), user_ethnicities(*)')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Fetch profile error:", error);
        }

        if (data) {
          // Handle profile_private_info as array OR object (Supabase varies by FK shape)
          const pInfo = Array.isArray(data.profile_private_info)
            ? data.profile_private_info[0]
            : data.profile_private_info;

          // Flatten private info into explicit fields
          const priv = {
            phone: pInfo?.phone || '',
            street_address: pInfo?.street_address || '',
            unit_number: pInfo?.unit_number || '',
            postal_code: pInfo?.postal_code || ''
          };

          // Flatten relations
          const skills = data.user_skills?.map(s => s.skill_id) || [];
          const languages = data.user_languages?.map(l => l.language_id) || [];
          const ethnicity = data.user_ethnicities?.[0]?.ethnicity_id || null;

          // Full spread — everything from DB + flattened priv + relations
          setFormData({ ...data, ...priv, skills, languages, ethnicity });
          setPrivateData(priv);
        } else {
          setFormData({});
          setPrivateData({});
        }

        // Fetch Dicts for Multi-selects
        const [skillsRes, langsRes, ethsRes] = await Promise.all([
          supabase.from('skills').select('id, name'),
          supabase.from('languages').select('id, name'),
          supabase.from('ethnicities').select('id, name')
        ]);
        if (skillsRes.data) setSkillOptions(skillsRes.data.map(i => ({ value: i.id, label: i.name })));
        if (langsRes.data) setLangOptions(langsRes.data.map(i => ({ value: i.id, label: i.name })));
        if (ethsRes.data) setEthOptions(ethsRes.data.map(i => ({ value: i.id, label: i.name })));

      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // ── Media count for ProfileCompletionBanner ──
  useEffect(() => {
    const fetchMediaCount = async () => {
      if (!formData?.id) return;
      const { count } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', formData.id);
      setMediaCount(count || 0);
    };
    fetchMediaCount();
  }, [formData?.id]);

  // ── Save Logic ──
  const handleSave = async (formPayload, privPayload) => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Not authenticated. Please log in again.');

      // 1. Normalize public profile data (v3.0 — strict types, dynamic pass-through)
      const normalizedPub = profileGuard.normalize(formPayload, user.id);

      // 2. Normalize private data — fallback to formPayload if privPayload is empty
      const privSource = (privPayload && Object.values(privPayload).some(v => v))
        ? privPayload
        : formPayload;
      const privData = profileGuard.normalizePrivate(privSource, user.id);

      // 3. Validate
      const validation = profileGuard.validate(normalizedPub);
      if (!validation.valid) {
        let errMsg = 'Invalid profile data.';
        if (validation.error === 'NAME_REQUIRED') errMsg = 'Please provide either a First or Last name.';
        if (validation.error === 'MISSING_AUTH_ID') errMsg = 'Authentication ID missing. Try logging in again.';
        throw new Error(errMsg);
      }

      // 4. Get ethnicity DIRECTLY from form (normalize strips it from normalizedPub)
      const selectedEthnicity = formPayload.ethnicity;
      const pubData = normalizedPub; // already clean — ethnicity was stripped by normalize()

      // 5. Extract relation IDs from original form payload
      const skillsToSave = profileGuard.getRelationIds(formPayload, 'skills');
      const langsToSave = profileGuard.getRelationIds(formPayload, 'languages');

      // ── DEBUG: Verify payload before upsert ──
      console.log("DB_PAYLOAD_CHECK:", pubData);

      // 6. Upsert profile (clean — no relational data)
      const { data: profile, error: pubError } = await supabase
        .from('profiles')
        .upsert(pubData, { onConflict: 'auth_id' })
        .select()
        .maybeSingle();

      if (pubError || !profile) {
        throw new Error(pubError?.message || 'Supabase error updating profile.');
      }

      // 7. Upsert private info
      const privRes = await supabase.from('profile_private_info').upsert(privData, { onConflict: 'auth_id' });
      if (privRes.error) throw new Error(privRes.error.message || 'Supabase error updating private info.');

      // 8. SYNC SKILLS — DELETE + INSERT using profile.id
      const { error: skillDelErr } = await supabase.from('user_skills').delete().eq('user_id', profile.id);
      if (skillDelErr) { console.error('[RELATION_SYNC_FAILED]', skillDelErr); throw skillDelErr; }

      if (skillsToSave.length) {
        const skillRows = skillsToSave.map(skill_id => ({ user_id: profile.id, skill_id }));
        const { error: skillInsErr } = await supabase.from('user_skills').insert(skillRows);
        if (skillInsErr) { console.error('[RELATION_SYNC_FAILED]', skillInsErr); throw skillInsErr; }
      }

      // 9. SYNC LANGUAGES — DELETE + INSERT using profile.id
      const { error: langDelErr } = await supabase.from('user_languages').delete().eq('user_id', profile.id);
      if (langDelErr) { console.error('[RELATION_SYNC_FAILED]', langDelErr); throw langDelErr; }

      if (langsToSave.length) {
        const languageRows = langsToSave.map(language_id => ({ user_id: profile.id, language_id }));
        const { error: langInsErr } = await supabase.from('user_languages').insert(languageRows);
        if (langInsErr) { console.error('[RELATION_SYNC_FAILED]', langInsErr); throw langInsErr; }
      }

      // 10. SYNC ETHNICITY — DELETE + INSERT (single value) using profile.id
      const { error: ethDelErr } = await supabase.from('user_ethnicities').delete().eq('user_id', profile.id);
      if (ethDelErr) { console.error('[RELATION_SYNC_FAILED]', ethDelErr); throw ethDelErr; }

      if (selectedEthnicity) {
        const { error: ethInsErr } = await supabase.from('user_ethnicities').insert({ user_id: profile.id, ethnicity_id: selectedEthnicity });
        if (ethInsErr) { console.error('[RELATION_SYNC_FAILED]', ethInsErr); throw ethInsErr; }
      }

      // ── Refresh Layout ──
      if (refreshProfile) refreshProfile();

    } catch (err) {
      console.error('[SAVE_FAILED]', err);
      setErrorMsg(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="px-6 py-5 flex flex-col gap-5">

      {/* ── Page Title ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-[900] text-white tracking-tight">Edit Professional Profile</h1>
          <p className="text-[13px] text-slate-400 font-medium">Update your professional details and credits.</p>
        </div>
      </div>

      {/* ── Profile Completion Banner ── */}
      {formData && (
        <ProfileCompletionBanner
          user={{
            heroImg: formData.image_url || '',
            height_ft: formData.height_ft ?? null,
            height_in: formData.height_in ?? null,
            weight_lbs: formData.weight_lbs ?? null,
            skills: formData.skills || [],
            languages: formData.languages || [],
            union_status: formData.union_status || null,
            _raw: formData,
          }}
          mediaCount={mediaCount}
        />
      )}

      <TalentProfileForm
        initialData={formData}
        privateData={privateData}
        skillOptions={skillOptions}
        langOptions={langOptions}
        ethOptions={ethOptions}
        onSubmit={handleSave}
        isSubmitting={isSubmitting}
        errorMsg={errorMsg}
        hideCancel={true}
      />
    </div>
  );
}
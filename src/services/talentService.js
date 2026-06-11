import { supabase } from './supabaseClient';
import { compileSearchParams } from '../utils/queryCompiler';

export const getTalents = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      user_skills(skill_id, skills(name)),
      user_languages(language_id, languages(name)),
      user_ethnicities(ethnicity_id, ethnicities(name))
    `)
    .eq('role', 'talent');

  if (error) {
    console.error('Error fetching talents:', error);
    return [];
  }
  return data;
};

export const addTalent = async (talentData) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert([talentData], { onConflict: 'id' })
    .select();

  if (error) {
    console.error('Error adding talent:', error);
    throw error;
  }
  return data;
};

export const getAvailability = async (talentId, year, month) => {
  const paddedMonth = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  const paddedLastDay = String(lastDay).padStart(2, '0');
  const { data, error } = await supabase
    .from('talent_availability')
    .select('*')
    .eq('talent_id', talentId)
    .gte('date', `${year}-${paddedMonth}-01`)
    .lte('date', `${year}-${paddedMonth}-${paddedLastDay}`);
  if (error) { console.error('Error fetching availability:', error); return []; }
  return data;
};

export const saveAvailability = async (talentId, availabilityMap) => {
  const entries = Object.entries(availabilityMap);
  const toUpsert = entries
    .filter(([_, status]) => status !== 'free')
    .map(([date, status]) => ({ talent_id: talentId, date, status }));
  const toDelete = entries
    .filter(([_, status]) => status === 'free')
    .map(([date]) => date);

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from('talent_availability')
      .upsert(toUpsert, { onConflict: 'talent_id,date' });
    if (error) { console.error('Error saving availability:', error); throw error; }
  }
  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('talent_availability')
      .delete()
      .eq('talent_id', talentId)
      .in('date', toDelete);
    if (error) { console.error('Error deleting availability:', error); throw error; }
  }
};

export const calculateOverallStatus = (availabilityMap, year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const statuses = Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
    return availabilityMap[date] || 'free';
  });
  const hasAnyBusy = statuses.some(s => s === 'busy');
  const hasAnyPartial = statuses.some(s => s === 'partial');
  const allFree = statuses.every(s => s === 'free');

  if (allFree) return 'available';
  if (hasAnyBusy) return 'busy';
  if (hasAnyPartial) return 'partial';
  return 'available';
};

export const executeTalentSearch = async (searchState, abortSignal = null, mode = 'admin') => {
  const params = compileSearchParams(searchState, { mode });
  const options = abortSignal ? { signal: abortSignal } : {};
  
  const { data, error } = await supabase.rpc('search_talents', params, options);
  
  if (error) throw error;
  return data;
};

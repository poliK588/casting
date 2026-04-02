import { supabase } from './supabaseClient';

export const getTalents = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

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

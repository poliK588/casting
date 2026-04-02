import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
      console.error("Error fetching data:", error);
    } else if (data && data.length > 0) {
      console.log("COLUMNS_FOUND:" + Object.keys(data[0]).join(','));
    } else {
      console.log("TAB_EMPTY_TRY_INSERT_PROBE");
      const probeData = { name: 'Probe', first_name: 'Probe' };
      const { error: insError } = await supabase.from('profiles').insert([probeData]);
      if (insError) {
        console.error("PROBE_FAILED:" + insError.message);
      } else {
        console.log("PROBE_SUCCESS");
      }
    }
  } catch (err) {
    console.error("EXCEPT:", err);
  }
}

checkColumns();

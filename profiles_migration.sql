-- Migration to add 30+ extended profile fields for Talent Management
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS union_number TEXT,
ADD COLUMN IF NOT EXISTS height_in INT,
ADD COLUMN IF NOT EXISTS weight_lbs INT,
ADD COLUMN IF NOT EXISTS hair_color TEXT,
ADD COLUMN IF NOT EXISTS hair_length TEXT,
ADD COLUMN IF NOT EXISTS shoe_size TEXT,
ADD COLUMN IF NOT EXISTS shirt_size TEXT,
ADD COLUMN IF NOT EXISTS pant_size TEXT,
ADD COLUMN IF NOT EXISTS hat_size TEXT,
ADD COLUMN IF NOT EXISTS waist_size_in INT,
ADD COLUMN IF NOT EXISTS neck_size_in INT,
ADD COLUMN IF NOT EXISTS sleeve_size_in INT,
ADD COLUMN IF NOT EXISTS experience_driving TEXT,
ADD COLUMN IF NOT EXISTS transportation TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Note: height_ft, ethnicity, eye_color, union_status, skills, languages already exist in base schema.
-- Ensure height_ft is present if missing (was in some versions of code)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='height_ft') THEN
        ALTER TABLE profiles ADD COLUMN height_ft NUMERIC(3,1);
    END IF;
END $$;

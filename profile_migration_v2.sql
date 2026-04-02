-- Migration v2: Add missing profile columns + profile_private_info table

-- 1. Add missing columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS physical_disability BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS inseam_size_in INT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS experience_bartending BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS experience_serving BOOLEAN DEFAULT false;

-- 2. Convert experience_driving to boolean if it exists as text
-- (Safe: just add a bool column alongside)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS experience_driving_bool BOOLEAN DEFAULT false;

-- 3. Create profile_private_info table
CREATE TABLE IF NOT EXISTS profile_private_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  phone TEXT,
  street_address TEXT,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on profile_private_info
ALTER TABLE profile_private_info ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for profile_private_info
CREATE POLICY "Users can view own private info"
ON profile_private_info FOR SELECT
USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own private info"
ON profile_private_info FOR INSERT
WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update own private info"
ON profile_private_info FOR UPDATE
USING (auth.uid() = auth_id);

-- Profiles table setup
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INT,
    gender TEXT,
    location TEXT,
    union_status TEXT,
    status TEXT DEFAULT 'available',
    skills JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    rating NUMERIC(3, 1) DEFAULT 0.0,
    credits INT DEFAULT 0,
    rate INT DEFAULT 0,
    recent_credit TEXT,
    image_url TEXT,
    ethnicity TEXT,
    eye_color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auditions table setup
CREATE TABLE auditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    status TEXT NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    deadline_text TEXT,
    icon_emoji TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = auth_id);

-- Auditions Policies
CREATE POLICY "Auditions are viewable by owners or admins" 
ON auditions FOR SELECT 
USING (auth.uid() IN (SELECT auth_id FROM profiles WHERE id = profile_id));

CREATE POLICY "Users can insert their own auditions" 
ON auditions FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT auth_id FROM profiles WHERE id = profile_id));

CREATE POLICY "Users can update own auditions" 
ON auditions FOR UPDATE 
USING (auth.uid() IN (SELECT auth_id FROM profiles WHERE id = profile_id));

CREATE POLICY "Users can delete own auditions" 
ON auditions FOR DELETE 
USING (auth.uid() IN (SELECT auth_id FROM profiles WHERE id = profile_id));

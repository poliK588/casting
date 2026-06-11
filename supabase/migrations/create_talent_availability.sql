-- Availability system table
-- 'free' is the default state — only non-free days are stored
CREATE TABLE IF NOT EXISTS talent_availability (
  talent_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text CHECK (status IN ('busy', 'partial')) NOT NULL,
  PRIMARY KEY (talent_id, date)
);

-- Enable RLS
ALTER TABLE talent_availability ENABLE ROW LEVEL SECURITY;

-- Policy: users can read/write their own availability
CREATE POLICY "Users can manage own availability"
  ON talent_availability
  FOR ALL
  USING (talent_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (talent_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

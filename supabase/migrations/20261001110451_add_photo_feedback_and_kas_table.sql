/*
# Add photo to feedback + create kas_bulanan table

## Changes

### 1. feedback table — new column
- `photo_url` (text, default ''): URL to a photo uploaded by the user alongside their feedback.
  Used in Evaluasi Kepuasan to attach a photo proof/screenshot/image to each feedback entry.

### 2. New table: kas_bulanan
- Monthly savings/cash fund tracking for Dampingcare.
- `id` (uuid, primary key)
- `kas_id` (text): human-readable ID like KAS-202610-001
- `month` (text, not null): YYYY-MM format, the month this kas entry covers
- `date` (text, not null): the date of the transaction
- `type` (text): 'Masuk' (incoming/deposit) or 'Keluar' (outgoing/withdrawal)
- `amount` (numeric, default 0): the amount of money
- `description` (text): what this kas entry is about
- `payment_method` (text): how the money was transferred
- `person` (text): who handled the transaction
- `notes` (text): additional notes
- `created_at` (timestamptz)

### 3. Security
- kas_bulanan: RLS enabled, anon+authenticated CRUD (single-tenant, no auth screen)
- feedback: no policy changes needed (existing policies already allow all CRUD)
*/

-- Add photo_url to feedback
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'photo_url') THEN
    ALTER TABLE feedback ADD COLUMN photo_url text DEFAULT '';
  END IF;
END $$;

-- Create kas_bulanan table
CREATE TABLE IF NOT EXISTS kas_bulanan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kas_id text DEFAULT '',
  month text NOT NULL,
  date text NOT NULL,
  type text DEFAULT 'Masuk',
  amount numeric DEFAULT 0,
  description text DEFAULT '',
  payment_method text DEFAULT '',
  person text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kas_bulanan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kas_bulanan" ON kas_bulanan;
CREATE POLICY "anon_select_kas_bulanan" ON kas_bulanan FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_kas_bulanan" ON kas_bulanan;
CREATE POLICY "anon_insert_kas_bulanan" ON kas_bulanan FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_kas_bulanan" ON kas_bulanan;
CREATE POLICY "anon_update_kas_bulanan" ON kas_bulanan FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_kas_bulanan" ON kas_bulanan;
CREATE POLICY "anon_delete_kas_bulanan" ON kas_bulanan FOR DELETE TO anon, authenticated USING (true);

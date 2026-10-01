/*
# Create team_salaries table

## Changes

### 1. New table: team_salaries
- Monthly salary tracking per team member.
- `id` (uuid, primary key)
- `salary_id` (text): human-readable ID like GJI-202610-001
- `team_member_id` (uuid): reference to teams table member
- `team_member_name` (text): denormalized name for easy display
- `month` (text, not null): YYYY-MM format, the month this salary covers
- `date` (text, not null): the date salary was paid
- `amount` (numeric, default 0): the salary amount
- `payment_method` (text): how the salary was paid
- `status` (text): 'Dibayar' or 'Belum Dibayar'
- `notes` (text): additional notes
- `created_at` (timestamptz)

### 2. Security
- team_salaries: RLS enabled, anon+authenticated CRUD (single-tenant, no auth screen)
*/

CREATE TABLE IF NOT EXISTS team_salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_id text DEFAULT '',
  team_member_id uuid,
  team_member_name text DEFAULT '',
  month text NOT NULL,
  date text NOT NULL,
  amount numeric DEFAULT 0,
  payment_method text DEFAULT 'Cash',
  status text DEFAULT 'Dibayar',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_salaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_team_salaries" ON team_salaries;
CREATE POLICY "anon_select_team_salaries" ON team_salaries FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_team_salaries" ON team_salaries;
CREATE POLICY "anon_insert_team_salaries" ON team_salaries FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_team_salaries" ON team_salaries;
CREATE POLICY "anon_update_team_salaries" ON team_salaries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_team_salaries" ON team_salaries;
CREATE POLICY "anon_delete_team_salaries" ON team_salaries FOR DELETE TO anon, authenticated USING (true);

/*
# Create Dampingcare social media management tables

1. New Tables
- `teams`: Team members per city. Columns: id, name, whatsapp, city, role, status, created_at.
- `content_planner`: Content planning entries. Columns: id, date, platform, city, theme, content_type, pic, status, notes, created_at.
- `content_schedule`: Scheduled content entries. Columns: id, date, time, platform, content, city, pic, status, reference, notes, created_at.
- `captions`: Caption bank entries. Columns: id, title, platform, category, content, keywords, created_at.

2. Security
- All tables are single-tenant (no auth/login). RLS enabled on all.
- Policies allow anon + authenticated full CRUD since data is intentionally shared.
*/

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  whatsapp text DEFAULT '',
  city text NOT NULL,
  role text DEFAULT '',
  status text NOT NULL DEFAULT 'Aktif',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_teams" ON teams;
CREATE POLICY "anon_select_teams" ON teams FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_teams" ON teams;
CREATE POLICY "anon_insert_teams" ON teams FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_teams" ON teams;
CREATE POLICY "anon_update_teams" ON teams FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_teams" ON teams;
CREATE POLICY "anon_delete_teams" ON teams FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS content_planner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  platform text NOT NULL,
  city text DEFAULT '',
  theme text DEFAULT '',
  content_type text DEFAULT '',
  pic text DEFAULT '',
  status text NOT NULL DEFAULT 'Ide',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_planner ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_content_planner" ON content_planner;
CREATE POLICY "anon_select_content_planner" ON content_planner FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_content_planner" ON content_planner;
CREATE POLICY "anon_insert_content_planner" ON content_planner FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_content_planner" ON content_planner;
CREATE POLICY "anon_update_content_planner" ON content_planner FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_content_planner" ON content_planner;
CREATE POLICY "anon_delete_content_planner" ON content_planner FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS content_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  time text DEFAULT '',
  platform text NOT NULL,
  content text DEFAULT '',
  city text DEFAULT '',
  pic text DEFAULT '',
  status text NOT NULL DEFAULT 'Belum Dibuat',
  reference text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_content_schedule" ON content_schedule;
CREATE POLICY "anon_select_content_schedule" ON content_schedule FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_content_schedule" ON content_schedule;
CREATE POLICY "anon_insert_content_schedule" ON content_schedule FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_content_schedule" ON content_schedule;
CREATE POLICY "anon_update_content_schedule" ON content_schedule FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_content_schedule" ON content_schedule;
CREATE POLICY "anon_delete_content_schedule" ON content_schedule FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS captions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  platform text NOT NULL,
  category text DEFAULT '',
  content text NOT NULL DEFAULT '',
  keywords text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE captions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_captions" ON captions;
CREATE POLICY "anon_select_captions" ON captions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_captions" ON captions;
CREATE POLICY "anon_insert_captions" ON captions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_captions" ON captions;
CREATE POLICY "anon_update_captions" ON captions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_captions" ON captions;
CREATE POLICY "anon_delete_captions" ON captions FOR DELETE
  TO anon, authenticated USING (true);

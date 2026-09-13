/*
# Revert to single-tenant (no auth) RLS policies

## What this does
Removes owner-scoped RLS policies and restores public/shared access for anon + authenticated.
The app no longer has a login screen, so all data is shared (single-tenant).

## Tables modified
- teams, content_planner, content_schedule, captions

## Security changes
- Drops all owner-scoped policies (select_own_*, insert_own_*, etc.)
- Creates new anon + authenticated policies with USING (true) — data is intentionally shared.
- user_id columns remain (nullable, defaults to auth.uid()) but are no longer used for access control.
*/

-- teams
DROP POLICY IF EXISTS "select_own_teams" ON teams;
DROP POLICY IF EXISTS "insert_own_teams" ON teams;
DROP POLICY IF EXISTS "update_own_teams" ON teams;
DROP POLICY IF EXISTS "delete_own_teams" ON teams;

CREATE POLICY "anon_select_teams" ON teams FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_teams" ON teams FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_teams" ON teams FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_teams" ON teams FOR DELETE
  TO anon, authenticated USING (true);

-- content_planner
DROP POLICY IF EXISTS "select_own_content_planner" ON content_planner;
DROP POLICY IF EXISTS "insert_own_content_planner" ON content_planner;
DROP POLICY IF EXISTS "update_own_content_planner" ON content_planner;
DROP POLICY IF EXISTS "delete_own_content_planner" ON content_planner;

CREATE POLICY "anon_select_content_planner" ON content_planner FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_content_planner" ON content_planner FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_content_planner" ON content_planner FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_content_planner" ON content_planner FOR DELETE
  TO anon, authenticated USING (true);

-- content_schedule
DROP POLICY IF EXISTS "select_own_content_schedule" ON content_schedule;
DROP POLICY IF EXISTS "insert_own_content_schedule" ON content_schedule;
DROP POLICY IF EXISTS "update_own_content_schedule" ON content_schedule;
DROP POLICY IF EXISTS "delete_own_content_schedule" ON content_schedule;

CREATE POLICY "anon_select_content_schedule" ON content_schedule FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_content_schedule" ON content_schedule FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_content_schedule" ON content_schedule FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_content_schedule" ON content_schedule FOR DELETE
  TO anon, authenticated USING (true);

-- captions
DROP POLICY IF EXISTS "select_own_captions" ON captions;
DROP POLICY IF EXISTS "insert_own_captions" ON captions;
DROP POLICY IF EXISTS "update_own_captions" ON captions;
DROP POLICY IF EXISTS "delete_own_captions" ON captions;

CREATE POLICY "anon_select_captions" ON captions FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_captions" ON captions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_captions" ON captions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_captions" ON captions FOR DELETE
  TO anon, authenticated USING (true);

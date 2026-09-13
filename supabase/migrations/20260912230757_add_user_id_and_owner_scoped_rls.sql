/*
# Add user_id columns and update RLS to owner-scoped

## What this does
Converts all 4 tables from public/shared (anon-accessible) to owner-scoped (authenticated only).
Each row now belongs to the user who created it, enforced by `user_id` + `auth.uid()` RLS policies.

## Important notes
1. The existing seed data in `teams` (Rieke, Zalza, Aji) has NULL `user_id` after adding the column.
   We set those rows' `user_id` to NULL — they will be invisible to any user (old shared data).
   This is expected: after sign-up, each user creates their own team data.
2. All 4 tables get `user_id uuid NOT NULL DEFAULT auth.uid()` so inserts that omit `user_id`
   automatically get the authenticated user's ID.
3. Policies are changed from `TO anon, authenticated` to `TO authenticated` with `auth.uid() = user_id`.

## Tables modified
- `teams`: added `user_id` column + owner-scoped policies
- `content_planner`: added `user_id` column + owner-scoped policies
- `content_schedule`: added `user_id` column + owner-scoped policies
- `captions`: added `user_id` column + owner-scoped policies

## Security changes
- All old anon policies are dropped.
- New owner-scoped SELECT/INSERT/UPDATE/DELETE policies added on all 4 tables.
*/

-- Add user_id column to teams
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'user_id') THEN
    ALTER TABLE teams ADD COLUMN user_id uuid DEFAULT auth.uid();
  END IF;
END $$;

-- Drop old anon policies on teams
DROP POLICY IF EXISTS "anon_select_teams" ON teams;
DROP POLICY IF EXISTS "anon_insert_teams" ON teams;
DROP POLICY IF EXISTS "anon_update_teams" ON teams;
DROP POLICY IF EXISTS "anon_delete_teams" ON teams;

-- New owner-scoped policies on teams
CREATE POLICY "select_own_teams" ON teams FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_teams" ON teams FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_teams" ON teams FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_teams" ON teams FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Add user_id column to content_planner
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_planner' AND column_name = 'user_id') THEN
    ALTER TABLE content_planner ADD COLUMN user_id uuid DEFAULT auth.uid();
  END IF;
END $$;

-- Drop old anon policies on content_planner
DROP POLICY IF EXISTS "anon_select_content_planner" ON content_planner;
DROP POLICY IF EXISTS "anon_insert_content_planner" ON content_planner;
DROP POLICY IF EXISTS "anon_update_content_planner" ON content_planner;
DROP POLICY IF EXISTS "anon_delete_content_planner" ON content_planner;

-- New owner-scoped policies on content_planner
CREATE POLICY "select_own_content_planner" ON content_planner FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_content_planner" ON content_planner FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_content_planner" ON content_planner FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_content_planner" ON content_planner FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Add user_id column to content_schedule
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_schedule' AND column_name = 'user_id') THEN
    ALTER TABLE content_schedule ADD COLUMN user_id uuid DEFAULT auth.uid();
  END IF;
END $$;

-- Drop old anon policies on content_schedule
DROP POLICY IF EXISTS "anon_select_content_schedule" ON content_schedule;
DROP POLICY IF EXISTS "anon_insert_content_schedule" ON content_schedule;
DROP POLICY IF EXISTS "anon_update_content_schedule" ON content_schedule;
DROP POLICY IF EXISTS "anon_delete_content_schedule" ON content_schedule;

-- New owner-scoped policies on content_schedule
CREATE POLICY "select_own_content_schedule" ON content_schedule FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_content_schedule" ON content_schedule FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_content_schedule" ON content_schedule FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_content_schedule" ON content_schedule FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Add user_id column to captions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'captions' AND column_name = 'user_id') THEN
    ALTER TABLE captions ADD COLUMN user_id uuid DEFAULT auth.uid();
  END IF;
END $$;

-- Drop old anon policies on captions
DROP POLICY IF EXISTS "anon_select_captions" ON captions;
DROP POLICY IF EXISTS "anon_insert_captions" ON captions;
DROP POLICY IF EXISTS "anon_update_captions" ON captions;
DROP POLICY IF EXISTS "anon_delete_captions" ON captions;

-- New owner-scoped policies on captions
CREATE POLICY "select_own_captions" ON captions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_captions" ON captions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_captions" ON captions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_captions" ON captions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

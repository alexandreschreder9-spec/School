/*
# Add per-user auth + settings

## Overview
Moving from single-tenant (shared) to multi-user (each user owns their classes and has
their own settings).

## Changes to `classes`
- New column `user_id` (uuid, NOT NULL, DEFAULT auth.uid(), references auth.users).
- Replaced open anon policies with owner-scoped policies keyed on auth.uid().

## New Table: `settings`
- `id` (uuid, primary key)
- `user_id` (uuid, unique, NOT NULL, DEFAULT auth.uid(), references auth.users)
- `dark_mode` (boolean, default false)
- `show_end_of_class_countdown` (boolean, default true)
- `show_semester_countdown` (boolean, default true)
- `semester_end_date` (date, default '2026-05-17')
- `created_at`, `updated_at` timestamps
- RLS enabled, owner-scoped CRUD policies.

## Security
- RLS enabled on both tables. All policies TO authenticated with auth.uid() ownership.
- user_id defaults to auth.uid() so inserts omitting user_id succeed.
*/

-- 1. Add user_id to classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS user_id uuid;

UPDATE classes SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;

ALTER TABLE classes
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE classes
  DROP CONSTRAINT IF EXISTS classes_user_id_fkey;
ALTER TABLE classes
  ADD CONSTRAINT classes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "anon_select_classes" ON classes;
DROP POLICY IF EXISTS "anon_insert_classes" ON classes;
DROP POLICY IF EXISTS "anon_update_classes" ON classes;
DROP POLICY IF EXISTS "anon_delete_classes" ON classes;

CREATE POLICY "select_own_classes" ON classes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_classes" ON classes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_classes" ON classes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_classes" ON classes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 2. Settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  dark_mode boolean NOT NULL DEFAULT true,
  show_end_of_class_countdown boolean NOT NULL DEFAULT true,
  show_semester_countdown boolean NOT NULL DEFAULT false,
  semester_end_date date NOT NULL DEFAULT '2027-05-18',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON settings;
CREATE POLICY "select_own_settings" ON settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_settings" ON settings;
CREATE POLICY "insert_own_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_settings" ON settings;
CREATE POLICY "update_own_settings" ON settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_settings" ON settings;
CREATE POLICY "delete_own_settings" ON settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settings_touch_updated_at ON settings;
CREATE TRIGGER settings_touch_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

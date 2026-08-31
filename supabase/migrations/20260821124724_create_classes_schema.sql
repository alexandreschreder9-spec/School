/*
# Create classes schema (single-tenant, no auth)

## Overview
A class countdown/calendar app where the user tracks school classes.
Classes are either "fixed" (happen on specific weekdays at a set time) or
"rotating" (cycle through a list of subjects on a rotating schedule).
A corner button shows "today's core" — the rotating class active today.

## New Tables

### `classes`
- `id` (uuid, primary key)
- `name` (text, not null) — display name of the class
- `type` (text, not null) — 'fixed' or 'rotating'
- `start_time` (time, not null) — start time of the class
- `end_time` (time, not null) — end time of the class
- `weekday` (int) — for fixed classes, the day of week (0=Sun..6=Sat). Null for rotating.
- `color` (text) — hex/tailwind color label for the class card
- `rotation_subjects` (text[]) — for rotating classes, the ordered list of subject names
- `rotation_start_date` (date) — the anchor date the rotation begins counting from
- `rotation_period_days` (int) — how many days each subject lasts before rotating (default 1)
- `created_at` (timestamptz)

## Security
- Single-tenant app (no sign-in). RLS enabled.
- anon + authenticated CRUD allowed because data is intentionally shared/public.
*/

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('fixed', 'rotating')),
  start_time time NOT NULL,
  end_time time NOT NULL,
  weekday int,
  color text NOT NULL DEFAULT 'sky',
  rotation_subjects text[],
  rotation_start_date date,
  rotation_period_days int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_classes" ON classes;
CREATE POLICY "anon_select_classes" ON classes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_classes" ON classes;
CREATE POLICY "anon_insert_classes" ON classes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_classes" ON classes;
CREATE POLICY "anon_update_classes" ON classes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_classes" ON classes;
CREATE POLICY "anon_delete_classes" ON classes FOR DELETE
  TO anon, authenticated USING (true);

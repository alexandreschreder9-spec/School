-- Make dark mode the standard default and set semester end date to May 20, 2027.
ALTER TABLE settings ALTER COLUMN dark_mode SET DEFAULT true;
ALTER TABLE settings ALTER COLUMN semester_end_date SET DEFAULT '2027-05-20';

-- Update existing settings rows to the new defaults.
UPDATE settings SET dark_mode = true WHERE dark_mode = false;
UPDATE settings SET semester_end_date = '2027-05-20' WHERE semester_end_date <> '2027-05-20';

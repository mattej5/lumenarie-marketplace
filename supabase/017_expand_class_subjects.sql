-- Expand the subject field in classes table to support more subjects
-- This migration removes the constraint limiting subjects to only astronomy/earth-science/both
-- and allows any text value for greater flexibility

-- Drop the old check constraint
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_subject_check;

-- Change subject column to TEXT without specific constraints
-- (already TEXT, but we're ensuring it's unrestricted)
ALTER TABLE classes ALTER COLUMN subject TYPE TEXT;

-- Optionally add a comment to document expected values
COMMENT ON COLUMN classes.subject IS 'Subject taught in this class. Common values include: Math, Science, English, History, etc.';

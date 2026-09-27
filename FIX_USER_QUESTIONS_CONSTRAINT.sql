-- ============================================================================
-- FIX USER_QUESTIONS CHECK CONSTRAINT
-- ============================================================================
-- The user_questions table has a CHECK constraint that only allows certain
-- values for admin_status. We need to add 'rejected' and 'approved_for_kb'
-- to the allowed values, or drop the constraint and recreate it.

-- First, find out what constraint exists:
-- SELECT constraint_name FROM information_schema.table_constraints 
-- WHERE table_name = 'user_questions' AND constraint_type = 'CHECK';

-- Drop the old constraint if it exists
ALTER TABLE user_questions DROP CONSTRAINT IF EXISTS user_questions_admin_status_check;

-- Add a new constraint that allows all valid admin_status values
ALTER TABLE user_questions ADD CONSTRAINT user_questions_admin_status_check 
CHECK (admin_status IN ('pending', 'rejected', 'approved_for_kb', 'approved'));

-- ============================================================================
-- ALTERNATIVE: If the above doesn't work, use this instead:
-- ============================================================================
-- Drop the constraint by modifying the column
-- ALTER TABLE user_questions ALTER COLUMN admin_status DROP NOT NULL;
-- ALTER TABLE user_questions ALTER COLUMN admin_status SET NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check that the constraint was updated:
-- SELECT constraint_name, constraint_definition FROM information_schema.constraint_column_usage 
-- WHERE table_name = 'user_questions';

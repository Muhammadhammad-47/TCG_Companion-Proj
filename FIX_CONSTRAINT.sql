-- ============================================================================
-- FIX USER_QUESTIONS CHECK CONSTRAINT
-- ============================================================================
-- Run this immediately to fix the "rejected" and "approved_for_kb" errors

-- Drop the old constraint that's too restrictive
ALTER TABLE user_questions DROP CONSTRAINT IF EXISTS user_questions_admin_status_check;

-- Add the new constraint with all valid status values
ALTER TABLE user_questions ADD CONSTRAINT user_questions_admin_status_check 
CHECK (admin_status IN ('pending', 'rejected', 'approved_for_kb', 'approved', 'unhelpful'));

-- Verify it worked
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'user_questions' AND constraint_type = 'CHECK';

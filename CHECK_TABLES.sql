-- ============================================================================
-- Check what columns currently exist in each table
-- ============================================================================

-- Check store_bundles columns
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'store_bundles' 
ORDER BY ordinal_position;

-- Check redeem_codes columns
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'redeem_codes' 
ORDER BY ordinal_position;

-- Check profiles columns
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check user_questions columns
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_questions' 
ORDER BY ordinal_position;

-- ============================================================================
-- SUPABASE SCHEMA FIXES - Step by step, one statement at a time
-- ============================================================================
-- Run each statement separately in Supabase SQL Editor
-- If a statement fails, it means that column already exists (which is fine!)

-- STEP 1: Add missing columns to store_bundles table
-- Run this first:
ALTER TABLE store_bundles 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- STEP 2: Then run this:
ALTER TABLE store_bundles 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- STEP 3: Then run this:
ALTER TABLE store_bundles 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- STEP 4: Then run this:
ALTER TABLE store_bundles 
ADD COLUMN IF NOT EXISTS crystal_amount INTEGER;

-- STEP 5: Then run this:
ALTER TABLE store_bundles 
ADD COLUMN IF NOT EXISTS title TEXT;

-- STEP 6: Then run this:
ALTER TABLE store_bundles 
ADD COLUMN IF NOT EXISTS bundle_type TEXT DEFAULT 'one_time';

-- STEP 7: Then run this:
ALTER TABLE store_bundles 
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;

-- STEP 8: Add missing columns to redeem_codes
ALTER TABLE redeem_codes 
ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0;

-- STEP 9: Add missing columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- STEP 10: Add this to profiles:
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS registered_app TEXT DEFAULT 'companion_hub';

-- STEP 11: Add this to profiles:
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_active_app TEXT DEFAULT 'companion_hub';

-- STEP 12: Add missing columns to user_questions
ALTER TABLE user_questions 
ADD COLUMN IF NOT EXISTS matched_topic TEXT;

-- STEP 13: Add this to user_questions:
ALTER TABLE user_questions 
ADD COLUMN IF NOT EXISTS admin_approved_answer TEXT;

-- ============================================================================
-- VERIFICATION - Run this to confirm all columns exist
-- ============================================================================
-- After all steps above are complete, run this to verify:

SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'store_bundles' 
ORDER BY ordinal_position;

-- Should show these columns:
-- id, name, description, bundle_type, crystals_amount, price_usd, 
-- discount_percent, is_active, created_at, updated_at,
-- title, crystal_amount, display_order, expires_at, image_url

-- ============================================================================
-- COPY AND PASTE THESE INTO SUPABASE SQL EDITOR ONE AT A TIME
-- ============================================================================
-- Each statement stands alone. Paste one, run it, then paste the next.

-- Paste 1: Add title to store_bundles
ALTER TABLE store_bundles ADD COLUMN IF NOT EXISTS title TEXT;

-- Paste 2: Add crystal_amount to store_bundles  
ALTER TABLE store_bundles ADD COLUMN IF NOT EXISTS crystal_amount INTEGER;

-- Paste 3: Add discount_percent to store_bundles
ALTER TABLE store_bundles ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;

-- Paste 4: Add display_order to store_bundles
ALTER TABLE store_bundles ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Paste 5: Add expires_at to store_bundles
ALTER TABLE store_bundles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Paste 6: Add image_url to store_bundles
ALTER TABLE store_bundles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Paste 7: Add times_used to redeem_codes
ALTER TABLE redeem_codes ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0;

-- Paste 8: Add is_premium to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Paste 9: Add registered_app to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS registered_app TEXT DEFAULT 'companion_hub';

-- Paste 10: Add last_active_app to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_app TEXT DEFAULT 'companion_hub';

-- Paste 11: Add matched_topic to user_questions
ALTER TABLE user_questions ADD COLUMN IF NOT EXISTS matched_topic TEXT;

-- Paste 12: Add admin_approved_answer to user_questions
ALTER TABLE user_questions ADD COLUMN IF NOT EXISTS admin_approved_answer TEXT;

-- ============================================================================
-- VERIFICATION - Paste this last to check everything worked
-- ============================================================================
-- This will show you all columns in store_bundles
SELECT column_name FROM information_schema.columns WHERE table_name='store_bundles' ORDER BY ordinal_position;

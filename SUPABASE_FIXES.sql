-- ============================================================================
-- SUPABASE SCHEMA FIXES - Run these ALTER statements one at a time
-- ============================================================================
-- If you get errors about columns not existing, it means they're already there.
-- Copy and paste each ALTER statement individually into Supabase SQL Editor.

-- Add display_order to store_bundles
ALTER TABLE store_bundles ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add expires_at to store_bundles
ALTER TABLE store_bundles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add image_url to store_bundles
ALTER TABLE store_bundles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add crystal_amount to store_bundles (some code uses this instead of crystals_amount)
ALTER TABLE store_bundles ADD COLUMN IF NOT EXISTS crystal_amount INTEGER;

-- Add title to store_bundles (if code references it)
ALTER TABLE store_bundles ADD COLUMN IF NOT EXISTS title TEXT;

-- Add bundle_type to store_bundles if it doesn't exist
ALTER TABLE store_bundles ADD COLUMN IF NOT EXISTS bundle_type TEXT DEFAULT 'one_time';

-- Add discount_percent to store_bundles if it doesn't exist
ALTER TABLE store_bundles ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;

-- Add times_used to redeem_codes
ALTER TABLE redeem_codes ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0;

-- Add is_premium to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Add registered_app to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS registered_app TEXT DEFAULT 'companion_hub';

-- Add last_active_app to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_app TEXT DEFAULT 'companion_hub';

-- Add matched_topic to user_questions
ALTER TABLE user_questions ADD COLUMN IF NOT EXISTS matched_topic TEXT;

-- Add admin_approved_answer to user_questions
ALTER TABLE user_questions ADD COLUMN IF NOT EXISTS admin_approved_answer TEXT;

-- ============================================================================
-- VERIFY THE FIXES WORKED by checking one table
-- ============================================================================
-- Run this SELECT to verify store_bundles now has all columns:
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'store_bundles' ORDER BY ordinal_position;

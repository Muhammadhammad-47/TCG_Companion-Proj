-- ============================================================================
-- TCG COMPANION - COMPLETE SUPABASE SETUP - ALL-IN-ONE
-- ============================================================================
-- SAFE TO RUN MULTIPLE TIMES - Idempotent script
-- Creates all tables, adds columns, sets up RLS, creates policies
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE (User Accounts & Stats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_id TEXT DEFAULT 'chynaman',
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  registered_app TEXT DEFAULT 'companion_hub',
  last_active_app TEXT DEFAULT 'companion_hub',
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  crystals_collected INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. MATCHES TABLE (Game History & Match Results)
-- ============================================================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL,
  winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  winner_name TEXT NOT NULL,
  player_ids UUID[] NOT NULL,
  player_names TEXT[] NOT NULL,
  game_mode TEXT DEFAULT 'kontrola',
  crystals_awarded INTEGER DEFAULT 1,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. RULES_KNOWLEDGE TABLE (Official Game Rules & Knowledge Base)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rules_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  category TEXT DEFAULT 'Gameplay',
  keywords TEXT[] DEFAULT '{}',
  short_answer TEXT NOT NULL,
  details TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. USER_QUESTIONS TABLE (User Feedback & Question Inbox for Admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  question_text TEXT NOT NULL,
  ai_answer TEXT DEFAULT '',
  matched_topic TEXT,
  user_rating TEXT,
  user_suggested_answer TEXT,
  admin_status TEXT DEFAULT 'pending',
  admin_approved_answer TEXT,
  app_source TEXT DEFAULT 'companion_hub',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. KNOWLEDGE_DOCUMENTS TABLE (AI Breakdowns & Custom Docs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  content TEXT NOT NULL,
  char_count INTEGER DEFAULT 0,
  estimated_tokens INTEGER DEFAULT 0,
  is_master BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. STORE_BUNDLES TABLE (In-Game Purchase Packages)
-- ============================================================================
CREATE TABLE IF NOT EXISTS store_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  bundle_type TEXT DEFAULT 'one_time',
  crystals_amount INTEGER NOT NULL,
  crystal_amount INTEGER,
  price_usd DECIMAL(10, 2) NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. REDEEM_CODES TABLE (Promo Codes & Gift Cards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS redeem_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  crystal_amount INTEGER NOT NULL,
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. APP_SETTINGS TABLE (Global Configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  match_cost INTEGER DEFAULT 1,
  premium_modules JSONB DEFAULT '["kontrola"]'::jsonb,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ADD ALL MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS registered_app TEXT DEFAULT 'companion_hub';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS last_active_app TEXT DEFAULT 'companion_hub';

ALTER TABLE IF EXISTS user_questions ADD COLUMN IF NOT EXISTS matched_topic TEXT;
ALTER TABLE IF EXISTS user_questions ADD COLUMN IF NOT EXISTS admin_approved_answer TEXT;
ALTER TABLE IF EXISTS user_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop old admin_status constraint if it exists and recreate it with all valid values
ALTER TABLE IF EXISTS user_questions DROP CONSTRAINT IF EXISTS user_questions_admin_status_check;
ALTER TABLE user_questions ADD CONSTRAINT user_questions_admin_status_check 
CHECK (admin_status IN ('pending', 'rejected', 'approved_for_kb', 'approved', 'unhelpful'));

-- Drop old user_rating constraint if it exists and recreate it with all valid values
ALTER TABLE IF EXISTS user_questions DROP CONSTRAINT IF EXISTS user_questions_user_rating_check;
ALTER TABLE user_questions ADD CONSTRAINT user_questions_user_rating_check 
CHECK (user_rating IN ('helpful', 'unhelpful') OR user_rating IS NULL);

ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS crystal_amount INTEGER;
ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS bundle_type TEXT DEFAULT 'one_time';

ALTER TABLE IF EXISTS redeem_codes ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS app_settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS app_settings ADD COLUMN IF NOT EXISTS match_cost INTEGER DEFAULT 1;
ALTER TABLE IF EXISTS app_settings ADD COLUMN IF NOT EXISTS premium_modules JSONB DEFAULT '["kontrola"]'::jsonb;
ALTER TABLE IF EXISTS app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================================================
-- CREATE ALL INDEXES
-- ============================================================================
DROP INDEX IF EXISTS idx_profiles_username;
CREATE INDEX idx_profiles_username ON profiles(username);
DROP INDEX IF EXISTS idx_profiles_email;
CREATE INDEX idx_profiles_email ON profiles(email);
DROP INDEX IF EXISTS idx_profiles_crystals_collected;
CREATE INDEX idx_profiles_crystals_collected ON profiles(crystals_collected DESC);
DROP INDEX IF EXISTS idx_profiles_is_admin;
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);
DROP INDEX IF EXISTS idx_profiles_is_banned;
CREATE INDEX idx_profiles_is_banned ON profiles(is_banned);

DROP INDEX IF EXISTS idx_matches_room_code;
CREATE INDEX idx_matches_room_code ON matches(room_code);
DROP INDEX IF EXISTS idx_matches_winner_id;
CREATE INDEX idx_matches_winner_id ON matches(winner_id);
DROP INDEX IF EXISTS idx_matches_created_at;
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);

DROP INDEX IF EXISTS idx_rules_knowledge_is_active;
CREATE INDEX idx_rules_knowledge_is_active ON rules_knowledge(is_active);
DROP INDEX IF EXISTS idx_rules_knowledge_order_index;
CREATE INDEX idx_rules_knowledge_order_index ON rules_knowledge(order_index);
DROP INDEX IF EXISTS idx_rules_knowledge_category;
CREATE INDEX idx_rules_knowledge_category ON rules_knowledge(category);

DROP INDEX IF EXISTS idx_user_questions_admin_status;
CREATE INDEX idx_user_questions_admin_status ON user_questions(admin_status);
DROP INDEX IF EXISTS idx_user_questions_user_id;
CREATE INDEX idx_user_questions_user_id ON user_questions(user_id);
DROP INDEX IF EXISTS idx_user_questions_created_at;
CREATE INDEX idx_user_questions_created_at ON user_questions(created_at DESC);
DROP INDEX IF EXISTS idx_user_questions_user_rating;
CREATE INDEX idx_user_questions_user_rating ON user_questions(user_rating);

DROP INDEX IF EXISTS idx_knowledge_documents_is_active;
CREATE INDEX idx_knowledge_documents_is_active ON knowledge_documents(is_active);
DROP INDEX IF EXISTS idx_knowledge_documents_is_master;
CREATE INDEX idx_knowledge_documents_is_master ON knowledge_documents(is_master);

DROP INDEX IF EXISTS idx_store_bundles_is_active;
CREATE INDEX idx_store_bundles_is_active ON store_bundles(is_active);
DROP INDEX IF EXISTS idx_store_bundles_price;
CREATE INDEX idx_store_bundles_price ON store_bundles(price_usd);
DROP INDEX IF EXISTS idx_store_bundles_display_order;
CREATE INDEX idx_store_bundles_display_order ON store_bundles(display_order);

DROP INDEX IF EXISTS idx_redeem_codes_code;
CREATE INDEX idx_redeem_codes_code ON redeem_codes(code);
DROP INDEX IF EXISTS idx_redeem_codes_is_active;
CREATE INDEX idx_redeem_codes_is_active ON redeem_codes(is_active);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP ALL OLD POLICIES (clean slate)
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

DROP POLICY IF EXISTS "matches_select_all" ON matches;
DROP POLICY IF EXISTS "matches_insert_all" ON matches;

DROP POLICY IF EXISTS "user_questions_select_admin_only" ON user_questions;
DROP POLICY IF EXISTS "user_questions_insert_all" ON user_questions;
DROP POLICY IF EXISTS "user_questions_update_admin" ON user_questions;

DROP POLICY IF EXISTS "rules_knowledge_select_active" ON rules_knowledge;
DROP POLICY IF EXISTS "rules_knowledge_insert_admin" ON rules_knowledge;
DROP POLICY IF EXISTS "rules_knowledge_update_admin" ON rules_knowledge;
DROP POLICY IF EXISTS "rules_knowledge_delete_admin" ON rules_knowledge;

DROP POLICY IF EXISTS "knowledge_documents_select_all" ON knowledge_documents;
DROP POLICY IF EXISTS "knowledge_documents_insert_admin" ON knowledge_documents;
DROP POLICY IF EXISTS "knowledge_documents_update_admin" ON knowledge_documents;
DROP POLICY IF EXISTS "knowledge_documents_delete_admin" ON knowledge_documents;

DROP POLICY IF EXISTS "store_bundles_select_active" ON store_bundles;
DROP POLICY IF EXISTS "store_bundles_insert_admin" ON store_bundles;
DROP POLICY IF EXISTS "store_bundles_update_admin" ON store_bundles;
DROP POLICY IF EXISTS "store_bundles_delete_admin" ON store_bundles;

DROP POLICY IF EXISTS "redeem_codes_select_admin" ON redeem_codes;
DROP POLICY IF EXISTS "redeem_codes_insert_admin" ON redeem_codes;
DROP POLICY IF EXISTS "redeem_codes_update_admin" ON redeem_codes;
DROP POLICY IF EXISTS "redeem_codes_delete_admin" ON redeem_codes;

DROP POLICY IF EXISTS "app_settings_select_all" ON app_settings;
DROP POLICY IF EXISTS "app_settings_update_admin" ON app_settings;

-- ============================================================================
-- CREATE NEW RLS POLICIES
-- ============================================================================

-- PROFILES
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- MATCHES
CREATE POLICY "matches_select_all" ON matches FOR SELECT USING (true);
CREATE POLICY "matches_insert_all" ON matches FOR INSERT WITH CHECK (true);

-- USER_QUESTIONS
CREATE POLICY "user_questions_select_admin_only" ON user_questions FOR SELECT USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "user_questions_insert_all" ON user_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "user_questions_update_admin" ON user_questions FOR UPDATE USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- RULES_KNOWLEDGE
CREATE POLICY "rules_knowledge_select_active" ON rules_knowledge FOR SELECT USING (is_active = true);
CREATE POLICY "rules_knowledge_insert_admin" ON rules_knowledge FOR INSERT WITH CHECK (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "rules_knowledge_update_admin" ON rules_knowledge FOR UPDATE USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "rules_knowledge_delete_admin" ON rules_knowledge FOR DELETE USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- KNOWLEDGE_DOCUMENTS
CREATE POLICY "knowledge_documents_select_all" ON knowledge_documents FOR SELECT USING (true);
CREATE POLICY "knowledge_documents_insert_admin" ON knowledge_documents FOR INSERT WITH CHECK (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "knowledge_documents_update_admin" ON knowledge_documents FOR UPDATE USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "knowledge_documents_delete_admin" ON knowledge_documents FOR DELETE USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- STORE_BUNDLES
CREATE POLICY "store_bundles_select_active" ON store_bundles FOR SELECT USING (is_active = true);
CREATE POLICY "store_bundles_insert_admin" ON store_bundles FOR INSERT WITH CHECK (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "store_bundles_update_admin" ON store_bundles FOR UPDATE USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "store_bundles_delete_admin" ON store_bundles FOR DELETE USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- REDEEM_CODES
CREATE POLICY "redeem_codes_select_admin" ON redeem_codes FOR SELECT USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "redeem_codes_insert_admin" ON redeem_codes FOR INSERT WITH CHECK (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "redeem_codes_update_admin" ON redeem_codes FOR UPDATE USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "redeem_codes_delete_admin" ON redeem_codes FOR DELETE USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- APP_SETTINGS
CREATE POLICY "app_settings_select_all" ON app_settings FOR SELECT USING (true);
CREATE POLICY "app_settings_update_admin" ON app_settings FOR UPDATE USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- ============================================================================
-- INITIALIZE DEFAULT DATA
-- ============================================================================
INSERT INTO app_settings (id, match_cost, premium_modules, maintenance_mode, updated_at)
VALUES ('global', 1, '["kontrola"]'::jsonb, false, NOW())
ON CONFLICT (id) DO UPDATE SET 
  match_cost = EXCLUDED.match_cost,
  premium_modules = EXCLUDED.premium_modules,
  maintenance_mode = EXCLUDED.maintenance_mode,
  updated_at = NOW();

-- ============================================================================
-- COMPLETE - All tables, columns, indexes, and policies are now set up
-- ============================================================================

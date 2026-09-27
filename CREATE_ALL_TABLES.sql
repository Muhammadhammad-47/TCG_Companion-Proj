-- ============================================================================
-- TCG COMPANION - CREATE ALL MISSING TABLES
-- ============================================================================
-- Run this complete script in Supabase SQL Editor
-- It will create all tables needed for the app to work

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

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_crystals_collected ON profiles(crystals_collected DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);

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

CREATE INDEX IF NOT EXISTS idx_matches_room_code ON matches(room_code);
CREATE INDEX IF NOT EXISTS idx_matches_winner_id ON matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_rules_knowledge_is_active ON rules_knowledge(is_active);
CREATE INDEX IF NOT EXISTS idx_rules_knowledge_order_index ON rules_knowledge(order_index);
CREATE INDEX IF NOT EXISTS idx_rules_knowledge_category ON rules_knowledge(category);

-- ============================================================================
-- 4. KNOWLEDGE_DOCUMENTS TABLE (AI Breakdowns & Custom Docs)
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

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_is_active ON knowledge_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_is_master ON knowledge_documents(is_master);

-- ============================================================================
-- 5. STORE_BUNDLES TABLE (In-Game Purchase Packages)
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

CREATE INDEX IF NOT EXISTS idx_store_bundles_is_active ON store_bundles(is_active);
CREATE INDEX IF NOT EXISTS idx_store_bundles_price ON store_bundles(price_usd);
CREATE INDEX IF NOT EXISTS idx_store_bundles_display_order ON store_bundles(display_order);

-- ============================================================================
-- 6. REDEEM_CODES TABLE (Promo Codes & Gift Cards)
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

CREATE INDEX IF NOT EXISTS idx_redeem_codes_code ON redeem_codes(code);
CREATE INDEX IF NOT EXISTS idx_redeem_codes_is_active ON redeem_codes(is_active);

-- ============================================================================
-- 7. APP_SETTINGS TABLE (Global Configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  match_cost INTEGER DEFAULT 1,
  premium_modules TEXT[] DEFAULT '{"kontrola"}',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. ADD MISSING COLUMNS TO EXISTING user_questions TABLE
-- ============================================================================
ALTER TABLE user_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) for all tables
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
-- CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Profiles: Users can read all, but only update their own
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Matches: Everyone can read
DROP POLICY IF EXISTS "matches_select_all" ON matches;
CREATE POLICY "matches_select_all" ON matches FOR SELECT USING (true);

-- User Questions: Admin can see all, users can only create
DROP POLICY IF EXISTS "user_questions_select_admin_only" ON user_questions;
CREATE POLICY "user_questions_select_admin_only" ON user_questions FOR SELECT USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

DROP POLICY IF EXISTS "user_questions_insert_all" ON user_questions;
CREATE POLICY "user_questions_insert_all" ON user_questions FOR INSERT WITH CHECK (true);

-- Rules Knowledge: Everyone can read active rules
DROP POLICY IF EXISTS "rules_knowledge_select_active" ON rules_knowledge;
CREATE POLICY "rules_knowledge_select_active" ON rules_knowledge FOR SELECT USING (is_active = true);

-- Knowledge Documents: Everyone can read
DROP POLICY IF EXISTS "knowledge_documents_select_all" ON knowledge_documents;
CREATE POLICY "knowledge_documents_select_all" ON knowledge_documents FOR SELECT USING (true);

-- Store Bundles: Everyone can read active bundles
DROP POLICY IF EXISTS "store_bundles_select_active" ON store_bundles;
CREATE POLICY "store_bundles_select_active" ON store_bundles FOR SELECT USING (is_active = true);

-- Redeem Codes: Admin only for management
DROP POLICY IF EXISTS "redeem_codes_select_admin" ON redeem_codes;
CREATE POLICY "redeem_codes_select_admin" ON redeem_codes FOR SELECT USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- App Settings: Everyone can read
DROP POLICY IF EXISTS "app_settings_select_all" ON app_settings;
CREATE POLICY "app_settings_select_all" ON app_settings FOR SELECT USING (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running all above, check that these tables exist:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Expected tables:
-- - app_settings
-- - auth (system table)
-- - knowledge_documents
-- - matches
-- - profiles
-- - redeem_codes
-- - rules_knowledge
-- - store_bundles
-- - user_questions

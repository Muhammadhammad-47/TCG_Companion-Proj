-- ============================================================================
-- TCG COMPANION - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- This SQL script creates all required tables for the TCG Companion application.
-- Run this in your Supabase SQL Editor to initialize the database.
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

-- Create indexes for faster queries
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_matches_room_code ON matches(room_code);
CREATE INDEX IF NOT EXISTS idx_matches_winner_id ON matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);

-- ============================================================================
-- 3. RULES_KNOWLEDGE TABLE (Oficial Game Rules & Knowledge Base)
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rules_knowledge_is_active ON rules_knowledge(is_active);
CREATE INDEX IF NOT EXISTS idx_rules_knowledge_order_index ON rules_knowledge(order_index);
CREATE INDEX IF NOT EXISTS idx_rules_knowledge_category ON rules_knowledge(category);

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

-- Create indexes for faster admin queries
CREATE INDEX IF NOT EXISTS idx_user_questions_admin_status ON user_questions(admin_status);
CREATE INDEX IF NOT EXISTS idx_user_questions_user_id ON user_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_created_at ON user_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_questions_user_rating ON user_questions(user_rating);

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_is_active ON knowledge_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_is_master ON knowledge_documents(is_master);

-- ============================================================================
-- 6. STORE_BUNDLES TABLE (In-Game Purchase Packages)
-- ============================================================================
CREATE TABLE IF NOT EXISTS store_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  bundle_type TEXT NOT NULL DEFAULT 'one_time',
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_store_bundles_is_active ON store_bundles(is_active);
CREATE INDEX IF NOT EXISTS idx_store_bundles_price ON store_bundles(price_usd);
CREATE INDEX IF NOT EXISTS idx_store_bundles_display_order ON store_bundles(display_order);

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_redeem_codes_code ON redeem_codes(code);
CREATE INDEX IF NOT EXISTS idx_redeem_codes_is_active ON redeem_codes(is_active);

-- ============================================================================
-- 8. APP_SETTINGS TABLE (Global Configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  match_cost INTEGER DEFAULT 1,
  premium_modules TEXT[] DEFAULT '{"kontrola"}',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FIX EXISTING TABLES - Add missing columns to prevent errors
-- ============================================================================

-- Add missing columns to store_bundles if they don't exist
ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS bundle_type TEXT DEFAULT 'one_time';
ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE IF EXISTS store_bundles ADD COLUMN IF NOT EXISTS crystal_amount INTEGER;

-- Add missing columns to redeem_codes if they don't exist
ALTER TABLE IF EXISTS redeem_codes ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0;

-- Add missing columns to profiles if they don't exist
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS registered_app TEXT DEFAULT 'companion_hub';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS last_active_app TEXT DEFAULT 'companion_hub';

-- Add missing columns to user_questions if they don't exist
ALTER TABLE IF EXISTS user_questions ADD COLUMN IF NOT EXISTS matched_topic TEXT;
ALTER TABLE IF EXISTS user_questions ADD COLUMN IF NOT EXISTS admin_approved_answer TEXT;

-- ============================================================================
-- SECURITY POLICIES (Row Level Security)
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, but only update their own
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Matches: Everyone can read
CREATE POLICY "matches_select_all" ON matches FOR SELECT USING (true);

-- User Questions: Admin can see all, users can only create
CREATE POLICY "user_questions_select_admin_only" ON user_questions FOR SELECT USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
CREATE POLICY "user_questions_insert_all" ON user_questions FOR INSERT WITH CHECK (true);

-- Rules Knowledge: Everyone can read active rules
CREATE POLICY "rules_knowledge_select_active" ON rules_knowledge FOR SELECT USING (is_active = true);

-- Knowledge Documents: Everyone can read
CREATE POLICY "knowledge_documents_select_all" ON knowledge_documents FOR SELECT USING (true);

-- Store Bundles: Everyone can read active bundles
CREATE POLICY "store_bundles_select_active" ON store_bundles FOR SELECT USING (is_active = true);

-- Redeem Codes: Admin only for management
CREATE POLICY "redeem_codes_select_admin" ON redeem_codes FOR SELECT USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- App Settings: Everyone can read
CREATE POLICY "app_settings_select_all" ON app_settings FOR SELECT USING (true);

-- ============================================================================
-- SAMPLE INITIAL DATA (Optional - uncomment to add)
-- ============================================================================

-- INSERT INTO app_settings (id, match_cost, premium_modules)
-- VALUES ('global', 1, ARRAY['kontrola'])
-- ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- INSERT INTO store_bundles (name, bundle_type, crystals_amount, price_usd, display_order, is_active)
-- VALUES
--   ('Starter Pack', 'one_time', 100, 9.99, 1, true),
--   ('Deluxe Pack', 'one_time', 500, 39.99, 2, true),
--   ('Weekly Pass', 'subscription', 50, 4.99, 3, true)
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- INITIAL RULES KNOWLEDGE (Optional - uncomment to seed)
-- ============================================================================
-- INSERT INTO rules_knowledge (topic, category, keywords, short_answer, details, order_index, is_active)
-- VALUES
--   (
--     'How do I start a new game?',
--     'Setup',
--     ARRAY['start', 'begin', 'new', 'game'],
--     'Tap "New Match" and select your character. Wait for opponent.',
--     'To start a new Kontrola match:\n1. Click "New Match" on main screen\n2. Select your character\n3. Choose difficulty level\n4. Wait for matchmaking',
--     1,
--     true
--   ),
--   (
--     'What are Crystals used for?',
--     'Economy',
--     ARRAY['crystals', 'currency', 'buy', 'purchase', 'store'],
--     'Crystals are the premium currency used to purchase items and battle passes.',
--     'Crystals can be used for:\n- Cosmetics in the store\n- Battle pass upgrades\n- Premium character unlocks\n- Special game modes',
--     2,
--     true
--   )
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED MASTER KNOWLEDGE DOCUMENT (Optional - uncomment to initialize)
-- ============================================================================
-- INSERT INTO knowledge_documents (id, filename, title, category, content, char_count, estimated_tokens, is_master, is_active, created_at, updated_at)
-- VALUES (
--   'ai-breakdowns-master',
--   'AI_Breakdowns.txt',
--   'Attention TCG Master Rulebook & AI Breakdowns',
--   'Master Rulebook',
--   'Placeholder. Will be populated from public/Knowledge Base/AI_Breakdowns.txt on first app load.',
--   100,
--   25,
--   true,
--   true,
--   NOW(),
--   NOW()
-- )
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

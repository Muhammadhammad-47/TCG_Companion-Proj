-- ============================================================================
-- MIGRATION: User Preferences + Active Sessions
-- ============================================================================
-- Adds:
--   1. profiles.user_preferences JSONB   (taunt prefs, future extensible)
--   2. active_sessions table             (Kontrola session tracking)
-- Safe to run multiple times (idempotent).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. USER PREFERENCES column on profiles
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS user_preferences JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.user_preferences IS
  'Extensible user preferences blob. Known keys: recent_taunts (text[])';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ACTIVE_SESSIONS TABLE  (Kontrola match session tracking)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS active_sessions (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     TEXT    NOT NULL,
  player_id    TEXT    NOT NULL,          -- collision-proof warrior ID (warr_xxx)
  user_id      UUID    REFERENCES profiles(id) ON DELETE SET NULL,
  role         TEXT    NOT NULL DEFAULT 'player'
                       CHECK (role IN ('host', 'player', 'spectator')),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT active_sessions_player_match_unique UNIQUE (player_id, match_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_active_sessions_match_id
  ON active_sessions(match_id);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id
  ON active_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_active_sessions_last_seen
  ON active_sessions(last_seen_at DESC);

-- Auto-clean sessions older than 2 hours (requires pg_cron or a scheduled job).
-- If pg_cron is not available, run this manually:
--   DELETE FROM active_sessions WHERE last_seen_at < NOW() - INTERVAL '2 hours';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Players can see all sessions in a match they belong to (needed for host logic)
DROP POLICY IF EXISTS "active_sessions_select_match_members" ON active_sessions;
CREATE POLICY "active_sessions_select_match_members" ON active_sessions
  FOR SELECT USING (true);

-- Players can only insert/update their own session rows
DROP POLICY IF EXISTS "active_sessions_insert_own" ON active_sessions;
CREATE POLICY "active_sessions_insert_own" ON active_sessions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "active_sessions_update_own" ON active_sessions;
CREATE POLICY "active_sessions_update_own" ON active_sessions
  FOR UPDATE USING (
    player_id = (
      SELECT player_id FROM active_sessions
      WHERE user_id = auth.uid()
      LIMIT 1
    )
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "active_sessions_delete_own" ON active_sessions;
CREATE POLICY "active_sessions_delete_own" ON active_sessions
  FOR DELETE USING (
    user_id = auth.uid()
    OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────────────────────

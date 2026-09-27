/**
 * preferenceService.js
 * -------------------------------------------------
 * Single service for three previously-localStorage-only concerns:
 *
 *  1. TAUNT PREFERENCES
 *     - Primary:  profiles.user_preferences JSONB  { recent_taunts: string[] }
 *     - Fallback: IndexedDB (offline / unauthenticated)
 *
 *  2. KONTROLA SESSION MANAGEMENT
 *     - Primary:  active_sessions table (matchId + playerId + role + timestamps)
 *     - Fallback: localStorage (keeps existing re-join behaviour when offline)
 *
 *  3. LEADERBOARD CACHING
 *     - Primary:  live Supabase query (see authService.getLeaderboard)
 *     - Cache:    IndexedDB  (stale-while-revalidate, 5-min TTL)
 *     - Fallback: empty array (never returns stale > 30 min)
 */

import { supabase } from './supabaseClient';

// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB helper  (tiny wrapper, no external dependency)
// ─────────────────────────────────────────────────────────────────────────────
const IDB_NAME = 'tcg_companion';
const IDB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv', { keyPath: 'key' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function idbGet(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readonly');
      const req = tx.objectStore('kv').get(key);
      req.onsuccess = (e) => resolve(e.target.result?.value ?? null);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch {
    // silently fail — cache is best-effort
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TAUNT PREFERENCES
// ─────────────────────────────────────────────────────────────────────────────
const TAUNT_IDB_KEY = 'recent_taunts';
const MAX_RECENT_TAUNTS = 5;

export const tauntsService = {
  /**
   * Load recent taunts for a user.
   * Tries DB first, falls back to IndexedDB (unauthenticated / offline).
   */
  async getRecentTaunts(userId = null) {
    // 1. Authenticated – try DB
    if (userId && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_preferences')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data?.user_preferences?.recent_taunts) {
          const dbTaunts = data.user_preferences.recent_taunts;
          // Keep IndexedDB in sync as offline fallback
          await idbSet(TAUNT_IDB_KEY, dbTaunts);
          return dbTaunts;
        }
      } catch (e) {
        console.warn('tauntsService: DB read failed, falling back to IndexedDB', e);
      }
    }

    // 2. Offline fallback — IndexedDB
    const cached = await idbGet(TAUNT_IDB_KEY);
    return Array.isArray(cached) ? cached : [];
  },

  /**
   * Save a new taunt to the top of the recent list (deduped, max 5).
   * Writes to DB if authenticated, always writes to IndexedDB.
   */
  async saveRecentTaunt(msg, userId = null) {
    if (!msg?.trim()) return;

    const current = await this.getRecentTaunts(userId);
    const updated = [msg.trim(), ...current.filter((t) => t !== msg.trim())].slice(
      0,
      MAX_RECENT_TAUNTS
    );

    // Always persist locally first (fast, offline-safe)
    await idbSet(TAUNT_IDB_KEY, updated);

    // Persist to DB if authenticated
    if (userId && supabase) {
      try {
        // Merge into the existing JSONB column so we don't overwrite other preferences
        const { data: existing } = await supabase
          .from('profiles')
          .select('user_preferences')
          .eq('id', userId)
          .maybeSingle();

        const merged = {
          ...(existing?.user_preferences || {}),
          recent_taunts: updated
        };

        await supabase
          .from('profiles')
          .update({ user_preferences: merged, updated_at: new Date().toISOString() })
          .eq('id', userId);
      } catch (e) {
        console.warn('tauntsService: DB write failed, data kept in IndexedDB', e);
      }
    }

    return updated;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. KONTROLA SESSION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
const SESSION_LS_MATCH = 'kontrola_current_match';
const SESSION_LS_PLAYER = 'kontrola_player_id';

export const sessionService = {
  /**
   * Retrieve (or generate) a stable, collision-proof player ID.
   * Source of truth order:  DB active_sessions → localStorage → generate new
   */
  async getPlayerId(userId = null) {
    // Authenticated: try to load a previously persisted session player ID
    if (userId && supabase) {
      try {
        const { data, error } = await supabase
          .from('active_sessions')
          .select('player_id')
          .eq('user_id', userId)
          .order('last_seen_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data?.player_id) {
          // Sync to localStorage for instant re-use
          try { localStorage.setItem(SESSION_LS_PLAYER, data.player_id); } catch {}
          return data.player_id;
        }
      } catch (e) {
        console.warn('sessionService: DB player_id lookup failed', e);
      }
    }

    // Fallback: localStorage (existing behaviour preserved)
    try {
      const cached = localStorage.getItem(SESSION_LS_PLAYER);
      if (cached) return cached;
    } catch {}

    // Generate brand-new collision-proof ID
    const newId =
      'warr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    try { localStorage.setItem(SESSION_LS_PLAYER, newId); } catch {}
    return newId;
  },

  /**
   * Persist an active match session to the DB and localStorage.
   * @param {string} matchId
   * @param {string} playerId
   * @param {string} role  'host' | 'player' | 'spectator'
   * @param {string|null} userId  Supabase auth UUID (nullable for guests)
   */
  async saveSession(matchId, playerId, role = 'player', userId = null) {
    // Always save to localStorage first (instant, offline-safe)
    try { localStorage.setItem(SESSION_LS_MATCH, matchId); } catch {}

    if (!supabase) return;

    try {
      await supabase.from('active_sessions').upsert(
        {
          match_id: matchId,
          player_id: playerId,
          user_id: userId || null,
          role,
          last_seen_at: new Date().toISOString()
        },
        { onConflict: 'player_id,match_id' }
      );
    } catch (e) {
      console.warn('sessionService: DB session upsert failed', e);
    }
  },

  /**
   * Remove the active session from DB and localStorage on intentional leave.
   */
  async clearSession(matchId, playerId) {
    try { localStorage.removeItem(SESSION_LS_MATCH); } catch {}

    if (!supabase) return;

    try {
      await supabase
        .from('active_sessions')
        .delete()
        .eq('player_id', playerId)
        .eq('match_id', matchId);
    } catch (e) {
      console.warn('sessionService: DB session clear failed', e);
    }
  },

  /**
   * Get the most recent active match for a player (for reconnect UX).
   * Returns matchId string or null.
   */
  async getLastMatchId(userId = null, playerId = null) {
    // Try DB first for authenticated users
    if (userId && supabase) {
      try {
        const { data, error } = await supabase
          .from('active_sessions')
          .select('match_id, last_seen_at')
          .eq('user_id', userId)
          .order('last_seen_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data?.match_id) return data.match_id;
      } catch (e) {
        console.warn('sessionService: DB match lookup failed', e);
      }
    }

    // Fallback to localStorage
    try { return localStorage.getItem(SESSION_LS_MATCH) || null; } catch {}
    return null;
  },

  /**
   * Update the heartbeat timestamp so stale sessions can be culled.
   * Call this every ~30 s while in an active match.
   */
  async heartbeat(matchId, playerId) {
    if (!supabase || !matchId || !playerId) return;
    try {
      await supabase
        .from('active_sessions')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('player_id', playerId)
        .eq('match_id', matchId);
    } catch {
      // silent — heartbeat is best-effort
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. LEADERBOARD CACHING  (IndexedDB, stale-while-revalidate, 5-min TTL)
// ─────────────────────────────────────────────────────────────────────────────
const LB_CACHE_KEY = 'leaderboard_cache';
const LB_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LB_MAX_STALE_MS = 30 * 60 * 1000; // never serve cache older than 30 min

export const leaderboardCache = {
  /**
   * Read cached leaderboard data from IndexedDB.
   * Returns { data, cachedAt, isStale } or null if no/expired cache.
   */
  async read() {
    const cached = await idbGet(LB_CACHE_KEY);
    if (!cached || !cached.cachedAt) return null;

    const age = Date.now() - cached.cachedAt;
    if (age > LB_MAX_STALE_MS) return null; // expired — discard

    return {
      data: cached.data,
      cachedAt: cached.cachedAt,
      isStale: age > LB_TTL_MS
    };
  },

  /** Persist fresh leaderboard data to IndexedDB. */
  async write(data) {
    await idbSet(LB_CACHE_KEY, { data, cachedAt: Date.now() });
  },

  /**
   * Stale-while-revalidate fetch.
   * 1. Returns cached data immediately if available (even if stale).
   * 2. Always fires a fresh DB fetch in the background.
   * 3. Calls onUpdate(freshData) when the network result arrives.
   *
   * @param {function} fetchFn   async () => leaderboard rows
   * @param {function} onUpdate  (rows) => void — called when fresh data arrives
   * @returns {Promise<Array>}   cached rows (may be stale) or []
   */
  async fetchWithCache(fetchFn, onUpdate) {
    const cached = await this.read();

    // Kick off network fetch regardless of cache state
    const networkPromise = fetchFn()
      .then(async (fresh) => {
        if (Array.isArray(fresh)) {
          await this.write(fresh);
          if (typeof onUpdate === 'function') onUpdate(fresh);
        }
      })
      .catch((e) => console.warn('leaderboardCache: Network fetch failed', e));

    if (cached?.data) {
      // Return stale-while-revalidate immediately
      // (network result updates via onUpdate callback)
      if (cached.isStale) {
        console.info('leaderboardCache: serving stale cache while revalidating…');
      }
      return cached.data;
    }

    // No cache — wait for network
    await networkPromise;
    const fresh = await this.read();
    return fresh?.data ?? [];
  }
};

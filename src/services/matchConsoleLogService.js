import { supabase } from './supabaseClient';

const MAX_LOGS_PER_MATCH = 600;
const FLUSH_INTERVAL_MS = 4000;
const LOCAL_STORAGE_PREFIX = 'kontrola_match_logs_';

let isCaptureInstalled = false;
let activeContext = null; // { roomCode, playerId, playerName, role }
let activeLogsBuffer = [];
let flushTimer = null;
let isFlushing = false;

const safeSerializeArg = (arg) => {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
  }
  try {
    const seen = new WeakSet();
    const json = JSON.stringify(arg, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    });
    return json && json.length > 800 ? json.slice(0, 800) + '…' : (json || String(arg));
  } catch {
    return String(arg);
  }
};

const saveToLocalFallback = (ctx, logs) => {
  if (!ctx?.roomCode) return;
  try {
    const key = `${LOCAL_STORAGE_PREFIX}${ctx.roomCode}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    existing[ctx.playerId] = {
      room_code: ctx.roomCode,
      player_id: ctx.playerId,
      player_name: ctx.playerName || 'Player',
      role: ctx.role || 'PLAYER',
      logs: logs.slice(-MAX_LOGS_PER_MATCH),
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // Ignore localStorage quota errors
  }
};

const readLocalFallbackByRoom = (roomCode) => {
  try {
    const key = `${LOCAL_STORAGE_PREFIX}${roomCode}`;
    const parsed = JSON.parse(localStorage.getItem(key) || '{}');
    return Object.values(parsed);
  } catch {
    return [];
  }
};

const readAllLocalFallbacks = () => {
  const rows = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LOCAL_STORAGE_PREFIX)) {
        const parsed = JSON.parse(localStorage.getItem(k) || '{}');
        rows.push(...Object.values(parsed));
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return rows;
};

export const matchConsoleLogService = {
  /**
   * Hooks console.log/warn/error/info once so all logs emitted during a match are buffered.
   */
  installConsoleCapture() {
    if (isCaptureInstalled || typeof window === 'undefined') return;
    isCaptureInstalled = true;

    const levels = ['log', 'warn', 'error', 'info'];
    levels.forEach((level) => {
      const original = console[level].bind(console);
      console[level] = (...args) => {
        original(...args);
        if (!activeContext?.roomCode) return;
        const message = args.map(safeSerializeArg).join(' ');
        activeLogsBuffer.push({
          ts: new Date().toISOString(),
          level: level.toUpperCase(),
          message: message.length > 1500 ? message.slice(0, 1500) + '…' : message
        });
        if (activeLogsBuffer.length > MAX_LOGS_PER_MATCH) {
          activeLogsBuffer = activeLogsBuffer.slice(-MAX_LOGS_PER_MATCH);
        }
      };
    });
  },

  /**
   * Starts or updates the active match logging context for the current player.
   */
  setMatchContext({ roomCode, playerId, playerName = 'Player', role = 'PLAYER' }) {
    if (!roomCode || !playerId) return;
    this.installConsoleCapture();

    const isNewRoom = activeContext?.roomCode !== roomCode || activeContext?.playerId !== playerId;
    if (isNewRoom) {
      if (activeContext?.roomCode && activeLogsBuffer.length > 0) {
        this.flushLogs();
      }
      activeLogsBuffer = [];
    }

    activeContext = { roomCode, playerId, playerName, role };
    saveToLocalFallback(activeContext, activeLogsBuffer);

    if (!flushTimer) {
      flushTimer = setInterval(() => {
        this.flushLogs();
      }, FLUSH_INTERVAL_MS);
    }
  },

  /**
   * Flushes current buffered logs to Supabase and localStorage fallback.
   */
  async flushLogs() {
    if (!activeContext?.roomCode || !activeContext?.playerId || activeLogsBuffer.length === 0) {
      return null;
    }
    if (isFlushing) return null;
    isFlushing = true;

    const ctx = { ...activeContext };
    const snapshot = activeLogsBuffer.slice(-MAX_LOGS_PER_MATCH);
    saveToLocalFallback(ctx, snapshot);

    try {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('match_console_logs')
        .upsert(
          {
            room_code: ctx.roomCode,
            player_id: ctx.playerId,
            player_name: ctx.playerName || 'Player',
            role: ctx.role || 'PLAYER',
            logs: snapshot,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'room_code,player_id' }
        )
        .select()
        .single();

      if (error) {
        return null;
      }
      return data;
    } catch {
      return null;
    } finally {
      isFlushing = false;
    }
  },

  /**
   * Returns a snapshot of the active player's buffered logs.
   */
  getBufferedLogs() {
    return activeLogsBuffer.slice(-MAX_LOGS_PER_MATCH);
  },

  /**
   * Saves another player's logs received over WebSocket to localStorage + Supabase.
   */
  async saveRemotePlayerLogs({ roomCode, playerId, playerName = 'Player', role = 'PLAYER', logs = [] }) {
    if (!roomCode || !playerId || !Array.isArray(logs) || logs.length === 0) return null;
    const ctx = { roomCode, playerId, playerName, role };
    const trimmed = logs.slice(-MAX_LOGS_PER_MATCH);
    saveToLocalFallback(ctx, trimmed);
    if (!supabase) return null;
    try {
      const { data } = await supabase
        .from('match_console_logs')
        .upsert(
          {
            room_code: roomCode,
            player_id: playerId,
            player_name: playerName,
            role,
            logs: trimmed,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'room_code,player_id' }
        )
        .select()
        .single();
      return data || null;
    } catch {
      return null;
    }
  },

  /**
   * Flushes remaining logs and clears active match context.
   */
  async clearMatchContext() {
    await this.flushLogs();
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    activeContext = null;
    activeLogsBuffer = [];
  },

  /**
   * Checks whether the match_console_logs Supabase table is reachable.
   */
  async checkDbStatus() {
    if (!supabase) return { ok: false, error: 'Supabase client not configured' };
    try {
      const { error } = await supabase.from('match_console_logs').select('id').limit(1);
      if (error) return { ok: false, error: error.message || 'Table unavailable' };
      return { ok: true, error: null };
    } catch (e) {
      return { ok: false, error: e?.message || 'Connection error' };
    }
  },

  /**
   * Keeps only the latest `keepCount` (default 25) matches in localStorage & Supabase.
   */
  async pruneOldMatches(keepCount = 25) {
    try {
      // Prune localStorage
      const roomEntries = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LOCAL_STORAGE_PREFIX)) {
          const parsed = JSON.parse(localStorage.getItem(k) || '{}');
          const rows = Object.values(parsed);
          const maxTs = rows.reduce((m, r) => (r.updated_at > m ? r.updated_at : m), '');
          roomEntries.push({ key: k, maxTs });
        }
      }
      if (roomEntries.length > keepCount) {
        roomEntries.sort((a, b) => (b.maxTs > a.maxTs ? 1 : -1));
        roomEntries.slice(keepCount).forEach((entry) => {
          localStorage.removeItem(entry.key);
        });
      }
    } catch {
      // Ignore storage errors
    }

    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('match_console_logs')
        .select('room_code, updated_at')
        .order('updated_at', { ascending: false })
        .limit(500);
      if (!data || data.length === 0) return;

      const seenRooms = [];
      const seenSet = new Set();
      data.forEach((r) => {
        if (r.room_code && !seenSet.has(r.room_code)) {
          seenSet.add(r.room_code);
          seenRooms.push(r.room_code);
        }
      });

      if (seenRooms.length > keepCount) {
        const roomsToDelete = seenRooms.slice(keepCount);
        await supabase.from('match_console_logs').delete().in('room_code', roomsToDelete);
      }
    } catch {
      // Ignore prune failures
    }
  },

  /**
   * Fetches all match console log rows for Admin Match History aggregation.
   */
  async fetchAllMatchLogRows(limit = 500) {
    const localRows = readAllLocalFallbacks();
    if (!supabase) return localRows;

    try {
      const { data, error } = await supabase
        .from('match_console_logs')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        return localRows;
      }

      const byKey = new Map();
      (data || []).forEach((row) => {
        byKey.set(`${row.room_code}__${row.player_id}`, row);
      });
      localRows.forEach((row) => {
        const k = `${row.room_code}__${row.player_id}`;
        if (!byKey.has(k)) byKey.set(k, row);
      });
      return Array.from(byKey.values());
    } catch {
      return localRows;
    }
  },

  /**
   * Fetches all player console log rows for a specific match room_code.
   */
  async fetchMatchLogsByRoom(roomCode) {
    if (!roomCode) return [];
    const localRows = readLocalFallbackByRoom(roomCode);
    if (!supabase) return localRows;

    try {
      const { data, error } = await supabase
        .from('match_console_logs')
        .select('*')
        .eq('room_code', roomCode)
        .order('role', { ascending: true });

      if (error) {
        return localRows;
      }

      const byPlayer = new Map();
      (data || []).forEach((row) => byPlayer.set(row.player_id, row));
      localRows.forEach((row) => {
        if (!byPlayer.has(row.player_id)) byPlayer.set(row.player_id, row);
      });
      return Array.from(byPlayer.values());
    } catch {
      return localRows;
    }
  },

  /**
   * Formats all players' logs for a match into a single clipboard-ready string.
   */
  formatLogsForCopy(roomCode, playerRows = []) {
    if (!playerRows.length) {
      return `=== MATCH ${roomCode} ===\nNo console logs recorded for this match.`;
    }
    const header = `=== MATCH CONSOLE LOGS: ${roomCode} (${playerRows.length} player(s)) ===`;
    const sections = playerRows.map((row) => {
      const title = `\n--- [${row.role || 'PLAYER'}] ${row.player_name || row.player_id} (${row.player_id}) | ${(row.logs || []).length} log(s) ---`;
      const lines = (row.logs || []).map((entry) => {
        const time = entry.ts ? new Date(entry.ts).toLocaleTimeString() : '';
        return `[${time}] [${entry.level || 'LOG'}] ${entry.message || ''}`;
      });
      return [title, ...lines].join('\n');
    });
    return [header, ...sections].join('\n');
  }
};

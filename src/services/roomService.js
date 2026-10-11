import { supabase } from './supabaseClient';

/**
 * Room Service — Manage game room persistence in Supabase
 * Handles room creation, state persistence, and player reconnection
 */

/**
 * Generate a random 6-character room code
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new game room in Supabase
 * @param {Object} gameState - Full game state object
 * @returns {Object} { roomCode, roomId } or { error }
 */
export async function createGameRoom(gameState) {
  if (!supabase) {
    return { error: 'Supabase not configured' };
  }

  try {
    const roomCode = generateRoomCode();
    const playerIds = gameState.players.map((p, idx) => ({ id: `player_${idx + 1}`, name: p.name }));
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now

    const { data, error } = await supabase
      .from('active_game_rooms')
      .insert([
        {
          room_code: roomCode,
          game_state: gameState,
          players: playerIds,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: expiresAt
        }
      ])
      .select();

    if (error) {
      console.error('Error creating game room:', error);
      return { error: error.message };
    }

    return { roomCode, roomId: data[0].id };
  } catch (err) {
    console.error('Exception creating game room:', err);
    return { error: err.message };
  }
}

/**
 * Update game state in an existing room (debounced, called every 5 seconds)
 * @param {string} roomCode - Room code
 * @param {Object} gameState - Updated game state
 * @returns {Object} { success } or { error }
 */
export async function updateGameRoom(roomCode, gameState) {
  if (!supabase) {
    return { error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('active_game_rooms')
      .update({
        game_state: gameState,
        updated_at: new Date().toISOString()
      })
      .eq('room_code', roomCode);

    if (error) {
      console.error('Error updating game room:', error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Exception updating game room:', err);
    return { error: err.message };
  }
}

/**
 * Fetch game state from a room by room code
 * @param {string} roomCode - 6-character room code
 * @returns {Object} { gameState } or { error }
 */
export async function fetchGameRoom(roomCode) {
  if (!supabase) {
    return { error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('active_game_rooms')
      .select('id, game_state, players, created_at, updated_at, expires_at')
      .eq('room_code', roomCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { error: 'Room not found or expired' };
      }
      console.error('Error fetching game room:', error);
      return { error: error.message };
    }

    // Check if room has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { error: 'Room has expired' };
    }

    return { gameState: data.game_state, roomId: data.id, players: data.players };
  } catch (err) {
    console.error('Exception fetching game room:', err);
    return { error: err.message };
  }
}

/**
 * Delete a game room when game ends
 * @param {string} roomCode - Room code
 * @returns {Object} { success } or { error }
 */
export async function deleteGameRoom(roomCode) {
  if (!supabase) {
    return { error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('active_game_rooms')
      .delete()
      .eq('room_code', roomCode);

    if (error) {
      console.error('Error deleting game room:', error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Exception deleting game room:', err);
    return { error: err.message };
  }
}

/**
 * Re-add a player to the active players list in a room
 * Called when a player reconnects
 * @param {string} roomCode - Room code
 * @param {string} playerId - Player ID to re-activate
 * @returns {Object} { success } or { error }
 */
export async function rejoinGameRoom(roomCode, playerId) {
  if (!supabase) {
    return { error: 'Supabase not configured' };
  }

  try {
    // Fetch current game state
    const { data, error: fetchError } = await supabase
      .from('active_game_rooms')
      .select('game_state')
      .eq('room_code', roomCode)
      .single();

    if (fetchError) {
      return { error: 'Failed to fetch room state' };
    }

    let gameState = data.game_state;

    // Find and re-add player to active state if they were defeated/disconnected
    const updatedPlayers = gameState.players.map(p => {
      if (p.id === playerId) {
        return { ...p, isDefeated: false }; // Re-activate player
      }
      return p;
    });

    gameState = { ...gameState, players: updatedPlayers };

    // Update room with restored state
    const { error: updateError } = await supabase
      .from('active_game_rooms')
      .update({
        game_state: gameState,
        updated_at: new Date().toISOString()
      })
      .eq('room_code', roomCode);

    if (updateError) {
      return { error: 'Failed to update room state' };
    }

    return { success: true, gameState };
  } catch (err) {
    console.error('Exception rejoining game room:', err);
    return { error: err.message };
  }
}

import { supabase } from '../../services/supabaseClient';
export { supabase };

// Track active channels by matchId
const channels = {};
let globalLobbyChannel = null;

// Helper to broadcast state to other peers
export const broadcastState = async (matchId, state) => {
  if (!supabase || !channels[matchId]) return;
  
  await channels[matchId].send({
    type: 'broadcast',
    event: 'sync_state',
    payload: state
  });
};

export const createMatch = async (matchId, hostId, characterId = 'chynaman') => {
  if (!supabase) throw new Error('Supabase is not configured in .env');

  const initialState = {
    matchId,
    status: 'waiting',
    host: hostId,
    players: [hostId],
    characterSelections: { [hostId]: characterId },
    turn: hostId,
    deck: [],
    hands: {},
    characterStates: {},
    logs: [`Match ${matchId} created by Host. Waiting for players to join...`]
  };

  if (!channels[matchId]) {
    channels[matchId] = supabase.channel(`match_${matchId}`);
  }

  return initialState;
};

export const joinMatch = async (matchId, playerId, characterId = 'bee') => {
  if (!supabase) throw new Error('Supabase is not configured in .env');

  if (!channels[matchId]) {
    channels[matchId] = supabase.channel(`match_${matchId}`);
  }
  
  return {
    matchId,
    status: 'joining',
    players: [playerId],
    characterSelections: { [playerId]: characterId }
  };
};

export const subscribeToMatch = (matchId, callback, onSubscribe = null, playerId = null) => {
  if (!supabase) return { unsubscribe: () => {} };

  if (!channels[matchId]) {
    channels[matchId] = supabase.channel(`match_${matchId}`, {
      config: { presence: { key: playerId || 'spectator' } }
    });
  }

  const channel = channels[matchId];
  
  channel.on('broadcast', { event: 'sync_state' }, ({ payload }) => {
    callback({ type: 'SYNC_STATE', payload });
  });

  channel.on('broadcast', { event: 'player_joined' }, ({ payload }) => {
    callback({ type: 'PLAYER_JOINED', payload });
  });

  channel.on('broadcast', { event: 'player_left' }, ({ payload }) => {
    callback({ type: 'PLAYER_LEFT', payload });
  });

  channel.on('broadcast', { event: 'join_rejected' }, ({ payload }) => {
    callback({ type: 'JOIN_REJECTED', payload });
  });

  channel.on('broadcast', { event: 'request_sync' }, ({ payload }) => {
    callback({ type: 'REQUEST_SYNC', payload });
  });

  channel.on('broadcast', { event: 'dice_screen_open' }, ({ payload }) => {
    callback({ type: 'DICE_SCREEN_OPEN', payload });
  });

  channel.on('broadcast', { event: 'dice_screen_close' }, ({ payload }) => {
    callback({ type: 'DICE_SCREEN_CLOSE', payload });
  });

  channel.on('broadcast', { event: 'dice_screen_rolled' }, ({ payload }) => {
    callback({ type: 'DICE_SCREEN_ROLLED', payload });
  });

  channel.on('broadcast', { event: 'player_action' }, ({ payload }) => {
    callback(payload);
  });

  channel.on('broadcast', { event: 'roll_off_animation' }, ({ payload }) => {
    callback({ type: 'ROLL_OFF_ANIMATION', payload });
  });

  channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    if (key && key !== 'spectator') {
      callback({ type: 'PLAYER_DISCONNECTED', payload: { playerId: key } });
    }
  });

  channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
    if (key && key !== 'spectator') {
      callback({ type: 'PLAYER_RECONNECTED', payload: { playerId: key } });
    }
  });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[Supabase] Connected to match room: match_${matchId}`);
      if (playerId) {
        await channel.track({ playerId, status: 'online' });
      }
      if (onSubscribe) onSubscribe();
    }
  });

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
      delete channels[matchId];
    }
  };
};

export const requestJoin = async (matchId, joinData) => {
  if (!channels[matchId]) return;
  const payload = typeof joinData === 'object' ? joinData : { playerId: joinData };
  await channels[matchId].send({
    type: 'broadcast',
    event: 'player_joined',
    payload
  });
};

export const rejectJoin = async (matchId, reason, targetPlayerId) => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: 'join_rejected',
    payload: { reason, targetPlayerId }
  });
};

export const broadcastLeave = async (matchId, playerId) => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: 'player_left',
    payload: { playerId, timestamp: Date.now() }
  });
};

export const requestSync = async (matchId, requesterId) => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: 'request_sync',
    payload: { requesterId }
  });
};

export const broadcastUIEvent = async (matchId, eventName, payload) => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: eventName,
    payload
  });
};

export const takeTurn = async (matchId, action) => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: 'player_action',
    payload: action
  });
};

// Global Lobby Broadcasts (ephemeral)
export const advertiseRoom = async (roomData) => {
  if (!supabase) return;
  if (!globalLobbyChannel) {
    globalLobbyChannel = supabase.channel('global_lobby');
    await globalLobbyChannel.subscribe();
  }
  await globalLobbyChannel.send({
    type: 'broadcast',
    event: 'room_advertised',
    payload: { ...roomData, timestamp: Date.now() }
  });
};

export const closeRoom = async (roomCode) => {
  if (!supabase || !globalLobbyChannel) return;
  await globalLobbyChannel.send({
    type: 'broadcast',
    event: 'room_closed',
    payload: { roomCode, timestamp: Date.now() }
  });
};

export const subscribeToGlobalLobby = (callback) => {
  if (!supabase) return { unsubscribe: () => {} };

  if (!globalLobbyChannel) {
    globalLobbyChannel = supabase.channel('global_lobby');
  }

  globalLobbyChannel.on('broadcast', { event: 'room_advertised' }, ({ payload }) => {
    callback({ type: 'ROOM_ADVERTISED', payload });
  });

  globalLobbyChannel.on('broadcast', { event: 'room_closed' }, ({ payload }) => {
    callback({ type: 'ROOM_CLOSED', payload });
  });

  globalLobbyChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('[Supabase] Connected to global_lobby channel');
    }
  });

  return {
    unsubscribe: () => {
      // Keep channel alive if needed or leave
    }
  };
};


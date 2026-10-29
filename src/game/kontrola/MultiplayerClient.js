import { supabase } from '../../services/supabaseClient';
export { supabase };

// Track active channels by matchId
const channels = {};
let globalLobbyChannel = null;

// Safe subscriber to prevent "tried to join multiple times. 'join' can only be called a single time per channel instance"
const safeSubscribe = (channel, onStatus = null) => {
  if (!channel) return;
  if (channel.state === 'joined') {
    if (onStatus) onStatus('SUBSCRIBED');
    return;
  }
  if (channel.state === 'joining') {
    // Already in flight; let the existing join promise resolve
    return;
  }
  try {
    channel.subscribe((status) => {
      if (onStatus) onStatus(status);
    });
  } catch (err) {
    console.warn('[Supabase] safeSubscribe ignored re-subscribe error:', err);
  }
};

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
    stats: { damageDealt: {}, cardsPlayed: {}, turnsTaken: {} },
    logs: [`Match ${matchId} created by Host. Waiting for players to join...`]
  };

  if (!channels[matchId]) {
    channels[matchId] = supabase.channel(`match_${matchId}`, {
      config: { broadcast: { self: true } }
    });
  }

  return initialState;
};

export const joinMatch = async (matchId, playerId, characterId = 'bee') => {
  if (!supabase) throw new Error('Supabase is not configured in .env');

  if (!channels[matchId]) {
    channels[matchId] = supabase.channel(`match_${matchId}`, {
      config: { broadcast: { self: true } }
    });
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

  if (channels[matchId] && (channels[matchId].state === 'closed' || channels[matchId].state === 'errored')) {
    try { supabase.removeChannel(channels[matchId]); } catch (e) {}
    delete channels[matchId];
  }

  if (!channels[matchId]) {
    channels[matchId] = supabase.channel(`match_${matchId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: playerId || 'spectator' }
      }
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

  channel.on('broadcast', { event: 'action_effect' }, ({ payload }) => {
    callback({ type: 'ACTION_EFFECT', payload });
  });

  channel.on('broadcast', { event: 'chat_message' }, ({ payload }) => {
    callback({ type: 'CHAT_MESSAGE', payload });
  });

  channel.on('broadcast', { event: 'player_taunt' }, ({ payload }) => {
    callback({ type: 'PLAYER_TAUNT', payload });
  });

  channel.on('presence', { event: 'leave' }, ({ key }) => {
    if (key && key !== 'spectator') {
      callback({ type: 'PLAYER_PRESENCE_AWAY', payload: { playerId: key } });
    }
  });

  channel.on('presence', { event: 'join' }, ({ key }) => {
    if (key && key !== 'spectator') {
      callback({ type: 'PLAYER_RECONNECTED', payload: { playerId: key } });
    }
  });

  if (channel.state !== 'joined' && channel.state !== 'joining') {
    safeSubscribe(channel, async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Supabase] Connected to match room: match_${matchId}`);
        if (playerId) {
          try {
            await channel.track({ playerId, status: 'online' });
          } catch (e) {
            console.warn('[Supabase] Failed tracking presence:', e);
          }
        }
        if (onSubscribe) onSubscribe();
      }
    });
  } else if (channel.state === 'joined') {
    if (playerId) {
      channel.track({ playerId, status: 'online' }).catch(() => {});
    }
    if (onSubscribe) onSubscribe();
  }

  return {
    unsubscribe: () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('[Supabase] Error removing channel:', e);
      }
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

export const rejectJoin = async (matchId, playerId, reason = 'ROOM_LOCKED') => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: 'join_rejected',
    payload: { playerId, reason }
  });
};

export const requestSync = async (matchId, playerId) => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: 'request_sync',
    payload: { requesterId: playerId }
  });
};

export const broadcastRollOffAnimation = async (matchId, data) => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: 'roll_off_animation',
    payload: data
  });
};

export const broadcastActionEffect = async (matchId, effectData) => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: 'action_effect',
    payload: effectData
  });
};

export const broadcastDiceScreen = async (matchId, action, data = {}) => {
  if (!channels[matchId]) return;
  const eventName =
    action === 'open' ? 'dice_screen_open' :
    action === 'close' ? 'dice_screen_close' :
    'dice_screen_rolled';

  await channels[matchId].send({
    type: 'broadcast',
    event: eventName,
    payload: data
  });
};

export const broadcastChatMessage = async (matchId, chatData) => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: 'chat_message',
    payload: chatData
  });
};

export const broadcastTaunt = async (matchId, tauntData) => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: 'player_taunt',
    payload: tauntData
  });
};

export const broadcastLeave = async (matchId, playerId) => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: 'player_left',
    payload: { playerId }
  });
};

export const broadcastAction = async (matchId, eventName, payload) => {
  if (!channels[matchId]) return;
  try {
    await channels[matchId].send({
      type: 'broadcast',
      event: eventName,
      payload
    });
  } catch (err) {
    console.warn(`[Supabase] broadcastAction error for event ${eventName}:`, err);
  }
};

export const broadcastUIEvent = broadcastAction;

export const takeTurn = async (matchId, action) => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: 'player_action',
    payload: action
  });
};

// Global Lobby Broadcasts (ephemeral)
const getGlobalLobbyChannel = () => {
  if (!supabase) return null;
  if (globalLobbyChannel && (globalLobbyChannel.state === 'closed' || globalLobbyChannel.state === 'errored')) {
    try { supabase.removeChannel(globalLobbyChannel); } catch (e) {}
    globalLobbyChannel = null;
  }
  if (!globalLobbyChannel) {
    globalLobbyChannel = supabase.channel('global_lobby');
  }
  return globalLobbyChannel;
};

export const advertiseRoom = async (roomData) => {
  if (!supabase) return;
  const channel = getGlobalLobbyChannel();
  if (!channel) return;

  if (channel.state !== 'joined' && channel.state !== 'joining') {
    safeSubscribe(channel);
  }
  try {
    await channel.send({
      type: 'broadcast',
      event: 'room_advertised',
      payload: { ...roomData, timestamp: Date.now() }
    });
  } catch (e) {
    console.warn('[Supabase] advertiseRoom broadcast error:', e);
  }
};

export const closeRoom = async (roomCode) => {
  if (!supabase) return;
  const channel = getGlobalLobbyChannel();
  if (!channel) return;
  try {
    await channel.send({
      type: 'broadcast',
      event: 'room_closed',
      payload: { roomCode, timestamp: Date.now() }
    });
  } catch (e) {
    console.warn('[Supabase] closeRoom broadcast error:', e);
  }
};

export const subscribeToGlobalLobby = (callback) => {
  if (!supabase) return { unsubscribe: () => {} };
  const channel = getGlobalLobbyChannel();
  if (!channel) return { unsubscribe: () => {} };

  channel.on('broadcast', { event: 'room_advertised' }, ({ payload }) => {
    callback({ type: 'ROOM_ADVERTISED', payload });
  });

  channel.on('broadcast', { event: 'room_closed' }, ({ payload }) => {
    callback({ type: 'ROOM_CLOSED', payload });
  });

  safeSubscribe(channel, (status) => {
    if (status === 'SUBSCRIBED') {
      console.log('[Supabase] Connected to global_lobby channel');
    }
  });

  return {
    unsubscribe: () => {
      // Kept open or removed when needed
    }
  };
};

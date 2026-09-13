import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Track active channels by matchId
const channels = {};

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
    logs: [`Match ${matchId} created by Host. Waiting for warriors to join...`]
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

export const subscribeToMatch = (matchId, callback, onSubscribe = null) => {
  if (!supabase) return { unsubscribe: () => {} };

  if (!channels[matchId]) {
    channels[matchId] = supabase.channel(`match_${matchId}`);
  }

  const channel = channels[matchId];
  
  channel.on('broadcast', { event: 'sync_state' }, ({ payload }) => {
    callback({ type: 'SYNC_STATE', payload });
  });

  channel.on('broadcast', { event: 'player_joined' }, ({ payload }) => {
    callback({ type: 'PLAYER_JOINED', payload });
  });

  channel.on('broadcast', { event: 'player_action' }, ({ payload }) => {
    callback(payload);
  });

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[Supabase] Connected to match room: match_${matchId}`);
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

export const takeTurn = async (matchId, action) => {
  if (!channels[matchId]) return;
  await channels[matchId].send({
    type: 'broadcast',
    event: 'player_action',
    payload: action
  });
};

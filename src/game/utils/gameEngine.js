// Game Logic & State Management Engine for TCG Card Game
import { CHARACTERS, ZOMBIE_PROFILE } from '../data/characters.js';

export function createInitialGameState(playerConfigs) {
  const players = playerConfigs.map((cfg, idx) => ({
    id: `player_${idx + 1}`,
    name: cfg.name || `Player ${idx + 1}`,
    characterId: cfg.characterId || 'chynaman',
    hp: cfg.startingHP || 100,
    maxHP: 200,
    preZombieHP: cfg.startingHP || 100,
    energyTokens: cfg.startingET || 5,
    crystals: cfg.startingCrystals || (playerConfigs.length === 2 ? 2 : 1),
    poisonCards: 0,
    isZombie: false,
    isDefeated: false,
    retreatedThisTurn: false,
    shield: 0,
    buffAP: 0,
    isStunned: false,
    kontrolUsesLeft: 2,
    blitzUsesLeft: 2,
    claimedTurnET: false,
    stats: {
      damageDealt: 0,
      damageTaken: 0,
      cardsPlayed: 0,
      zombiesInfected: 0
    }
  }));

  return {
    matchId: 'match_' + Date.now(),
    players,
    activePlayerIndex: 0,
    turnNumber: 1,
    roundNumber: 1,
    direction: 'clockwise', // 'clockwise' | 'counter-clockwise'
    phase: 'action', // 'action' | 'combat' | 'zombie_alert' | 'game_over'
    winner: null,
    history: [],
    lastActionLog: null
  };
}

// Advance Turn Logic
export function advanceTurn(state) {
  const playerCount = state.players.length;
  const step = state.direction === 'clockwise' ? 1 : -1;
  let nextIndex = state.activePlayerIndex;

  // Walk to the next player who is still in the match. If nobody is left standing
  // the index simply lands back where it started rather than looping forever.
  const stunnedSkips = [];
  for (let hops = 0; hops < playerCount * 2; hops++) {
    nextIndex = (nextIndex + step + playerCount) % playerCount;
    const candidate = state.players[nextIndex];
    if (candidate.isDefeated) continue;
    // A stunned warrior forfeits this turn; the stun is spent doing so.
    if (candidate.isStunned && !stunnedSkips.includes(nextIndex)) {
      stunnedSkips.push(nextIndex);
      continue;
    }
    break;
  }

  const isNewRound = nextIndex === 0;
  const newTurnNumber = state.turnNumber + 1;
  const newRoundNumber = isNewRound ? state.roundNumber + 1 : state.roundNumber;

  // Process turn start effects for all players or next player
  const updatedPlayers = state.players.map((p, idx) => {
    const updated = { ...p };
    
    // Reset claimed turn ET for active player
    if (idx === nextIndex) {
      updated.claimedTurnET = false;
      updated.retreatedThisTurn = false;
      
      // Zombie Auto +10 HP regen at start of turn
      if (updated.isZombie && updated.hp > 0) {
        updated.hp = Math.min(updated.maxHP, updated.hp + ZOMBIE_PROFILE.turnRegen);
      }

      // Poison damage at start of turn (-10 HP per poison card if not zombie)
      if (!updated.isZombie && updated.poisonCards > 0) {
        const poisonDmg = updated.poisonCards * 10;
        updated.hp = Math.max(0, updated.hp - poisonDmg);
        updated.stats.damageTaken += poisonDmg;
      }

    }

    // Stun is consumed by the turn it caused the warrior to miss.
    if (stunnedSkips.includes(idx)) {
      updated.isStunned = false;
    }

    // Zombie Mode doc: 5+ poison transforms, <5 cures, and a Zombie at 0 HP revives
    return checkZombieStatus(updated);
  });

  return {
    ...state,
    players: updatedPlayers,
    activePlayerIndex: nextIndex,
    turnNumber: newTurnNumber,
    roundNumber: newRoundNumber,
    history: [
      ...state.history,
      {
        turn: state.turnNumber,
        text: `Turn ${state.turnNumber} ended. Turn ${newTurnNumber} begins for ${updatedPlayers[nextIndex].name}.`
      }
    ]
  };
}

// Calculate 2-Dice Combat
export function resolveDiceCombat({
  attacker,
  defender,
  actionCard,
  characterMove,
  attackerRoll, // [die1, die2]
  defenderRoll, // [die1, die2]
  amplifyBonus = 0
}) {
  const attackerDiceSum = attackerRoll[0] + attackerRoll[1];
  const defenderDiceSum = defenderRoll[0] + defenderRoll[1];

  let rawAP = characterMove.baseAP || 20;
  if (characterMove.type === 'dice_mult') {
    rawAP = attackerRoll[0] * (characterMove.baseAP || 4);
  }

  // Add Buffs & Amplify
  rawAP += (attacker.buffAP || 0) + amplifyBonus;

  // Zombie doc (Zombie Fury): at 8+ Poison Cards, Venom Strike deals +10 damage.
  const zombieFury = !!attacker.isZombie
    && characterMove.type === 'zombie_infect'
    && attacker.poisonCards >= 8;
  if (zombieFury) rawAP += 10;

  // Weakness bonus check.
  // Zombie Mode doc: a Zombie may not use any Character Card, so a Zombie defender
  // takes its DP and weakness from the Zombie Mode Card instead.
  const defChar = defender.isZombie
    ? ZOMBIE_PROFILE
    : (CHARACTERS[defender.characterId] || CHARACTERS.chynaman);

  const moveName = characterMove.name.toLowerCase();
  const isFire = moveName.includes('fire');
  const isLightning = moveName.includes('light'); // "Lighting" / "Lightning"
  const isPoison = moveName.includes('poison') || moveName.includes('venom');
  const isMagic = moveName.includes('magic') || moveName.includes('soul');

  let weaknessBonus = 0;
  let weaknessTriggered = false;

  if (defChar.weakness && (
    (isFire && defChar.weakness.type.includes('Fire')) ||
    (isLightning && defChar.weakness.type.includes('Lightning')) ||
    (isPoison && defChar.weakness.type.includes('Poison')) ||
    (isMagic && defChar.weakness.type.includes('Magic'))
  )) {
    weaknessBonus = defChar.weakness.bonusAP || 10;
    weaknessTriggered = true;
  }

  const totalAP = rawAP + weaknessBonus;

  // Defense 6+ Rule Check
  // As long as defender rolls a minimum of 6 total from 2 dice, DP reduces damage
  const defenseActivated = defenderDiceSum >= 6;
  const innateDP = defenseActivated ? (defChar.defaultDP ?? 10) : 0;

  // Check if attack hits (Attacker sum > Defender sum, or flat hit logic)
  const isAttackSuccessful = attackerDiceSum >= defenderDiceSum;

  let damageDealt = 0;
  if (isAttackSuccessful) {
    damageDealt = Math.max(0, totalAP - innateDP);
  }

  // Zombie Mode doc: when a Zombie is HIT by Fire or Lightning the attack deals its
  // normal damage and also removes 1 Poison Card — only while in Zombie Mode.
  const zombiePoisonCured = isAttackSuccessful && !!defender.isZombie && (isFire || isLightning);

  // Zombie Mode doc: a successful Venom Strike gives the defender 1 Poison Card.
  const poisonApplied = isAttackSuccessful && characterMove.type === 'zombie_infect';

  // Techniques flagged as stunning (e.g. Paparazzi Stun) cost the target their next turn.
  const stunApplied = isAttackSuccessful && !!characterMove.stun;

  return {
    isAttackSuccessful,
    attackerDiceSum,
    defenderDiceSum,
    rawAP,
    weaknessBonus,
    weaknessTriggered,
    totalAP,
    defenseActivated,
    innateDP,
    mitigatedByDP: isAttackSuccessful ? innateDP : 0,
    damageDealt,
    poisonApplied,
    stunApplied,
    zombiePoisonCured,
    zombieFury
  };
}

// Strict Game Constants & Limits from TCG Design Spec
export const GAME_LIMITS = {
  MIN_HP: 0,
  MAX_HP: 200,
  LEVEL_2_HP_THRESHOLD: 150,
  MIN_ET: 0,
  MAX_ET: 10,
  MIN_POISON: 0,
  MAX_POISON: 10,
  ZOMBIE_TRIGGER_POISON: 5,
  WIN_CRYSTAL_COUNT: 3
};

// A player is out of the match at 0 HP — unless they are a Zombie, which the
// Zombie doc says can never be permanently defeated (it revives instead).
export function applyDefeatState(player) {
  if (player.isZombie) return { ...player, isDefeated: false };
  return { ...player, isDefeated: player.hp <= 0 };
}

// Match end: first to 3 Stability Crystals, or the last warrior standing.
export function findMatchWinner(players) {
  const byCrystals = players.find(p => (p.crystals || 0) >= GAME_LIMITS.WIN_CRYSTAL_COUNT);
  if (byCrystals) return byCrystals;

  const standing = players.filter(p => !p.isDefeated);
  if (standing.length === 1 && players.length > 1) return standing[0];

  return null;
}

// Check & Apply Zombie Mode or Cure with strict limit clamping
export function checkZombieStatus(player) {
  let updated = { ...player };

  // Clamp poison between 0 and 10
  updated.poisonCards = Math.max(GAME_LIMITS.MIN_POISON, Math.min(GAME_LIMITS.MAX_POISON, updated.poisonCards));
  updated.energyTokens = Math.max(GAME_LIMITS.MIN_ET, Math.min(GAME_LIMITS.MAX_ET, updated.energyTokens));
  updated.hp = Math.max(GAME_LIMITS.MIN_HP, Math.min(GAME_LIMITS.MAX_HP, updated.hp));

  // Trigger Zombie Mode at 5+ Poison cards
  if (updated.poisonCards >= GAME_LIMITS.ZOMBIE_TRIGGER_POISON && !updated.isZombie) {
    updated.isZombie = true;
    updated.preZombieHP = updated.hp > 0 ? updated.hp : 40; // store previous HP
    updated.hp = ZOMBIE_PROFILE.baseHP; // set to 40 HP
  }

  // Cure Zombie Mode if poison drops below 5
  if (updated.poisonCards < GAME_LIMITS.ZOMBIE_TRIGGER_POISON && updated.isZombie) {
    updated.isZombie = false;
    updated.hp = Math.max(10, Math.min(GAME_LIMITS.MAX_HP, updated.preZombieHP)); // revert to pre-infection HP
  }

  // Zombie Revival Rule if HP drops to 0
  if (updated.isZombie && updated.hp <= 0) {
    if (updated.poisonCards >= 8) {
      updated.hp = 40;
    } else if (updated.poisonCards >= 6) {
      updated.hp = 20;
    } else {
      updated.hp = 10;
    }
  }

  return applyDefeatState(updated);
}

// TCG Card Game — Official Game Logic & State Management Engine
import { CHARACTERS, ZOMBIE_PROFILE } from '../data/characters.js';
import { GAME_LIMITS } from '../data/cards.js';

export function createInitialGameState(playerConfigs) {
  const players = playerConfigs.map((cfg, idx) => ({
    id: `player_${idx + 1}`,
    name: cfg.name || `Player ${idx + 1}`,
    characterId: cfg.characterId || 'chynaman',
    hp: cfg.startingHP || GAME_LIMITS.BASE_HP,
    maxHP: GAME_LIMITS.MAX_HP,
    preZombieHP: cfg.startingHP || GAME_LIMITS.BASE_HP,
    energyTokens: cfg.startingET || GAME_LIMITS.STARTING_ET,
    crystals: cfg.startingCrystals || (playerConfigs.length === 2 ? 2 : 1),
    poisonCards: 0,
    isZombie: false,
    isDefeated: false,
    retreatedThisTurn: false,
    shield: 0,
    buffAP: 0,
    buffDP: 0,
    isStunned: false,
    kontrolUsesLeft: 2,
    blitzUsesLeft: 2,
    claimedTurnET: false,
    stats: {
      damageDealt: 0,
      damageTaken: 0,
      cardsPlayed: 0,
      zombiesInfected: 0,
      diceRolls: 0
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
    lastActionLog: null,
    zombieTransformationAlert: null // { player: string, poisonCount: number }
  };
}

/**
 * Check and transition a player into or out of Zombie Mode based on poison card count
 * GDD Rules:
 * - 5+ Poison cards: Triggers Zombie Mode (HP becomes 40, gains Venom Strike, disabled normal cards)
 * - <5 Poison cards: Cures Zombie Mode and restores HP to preZombieHP
 * - If Zombie drops to 0 HP: Revives at 10 HP (5 poison), 20 HP (6-7 poison), or 40 HP (8+ poison)
 */
export function checkZombieStatus(player) {
  const p = { ...player };

  // Zombie Transformation (5+ Poison cards)
  if (!p.isZombie && p.poisonCards >= GAME_LIMITS.ZOMBIE_POISON_TRIGGER) {
    p.isZombie = true;
    p.preZombieHP = Math.max(1, p.hp); // Save HP before turning
    p.hp = ZOMBIE_PROFILE.baseHP; // 40 HP
  }

  // Zombie Cure (<5 Poison cards)
  if (p.isZombie && p.poisonCards < GAME_LIMITS.ZOMBIE_POISON_TRIGGER) {
    p.isZombie = false;
    p.hp = Math.min(p.maxHP, Math.max(10, p.preZombieHP)); // Revert to pre-zombie HP
  }

  // Zombie Revival Rule: If Zombie HP is depleted to 0, they immediately revive
  if (p.isZombie && p.hp <= 0 && !p.isDefeated) {
    if (p.poisonCards >= 8) {
      p.hp = 40;
    } else if (p.poisonCards >= 6) {
      p.hp = 20;
    } else {
      p.hp = 10; // Exactly 5 poison cards
    }
  }

  // Regular player defeat check (non-zombie at 0 HP)
  if (!p.isZombie && p.hp <= 0) {
    p.hp = 0;
    p.isDefeated = true;
  }

  return p;
}

/**
 * Resolve Dice Combat between Attacker and Defender strictly following GDD
 * 
 * Rules:
 * 1. Attacker rolls 2 Red dice (or 1 Die for multiplier moves like Fire of Fury)
 * 2. Defender rolls 2 Gold dice
 * 3. Base AP calculation:
 *    - Flat move: baseAP
 *    - Dice multiplier move: attackerDice[0] * multiplier
 * 4. Weakness check:
 *    - If move element matches defender weakness, adds +10 to +15 bonus AP
 * 5. 6+ Defense check:
 *    - If Defender rolls Gold dice sum >= 6, innate DP (-10 or -15 AP) reduces incoming damage
 *    - If Defender rolls < 6, DP does not trigger (0 reduction)
 * 6. Shield Absorption:
 *    - Absorbs incoming damage first before HP takes a hit
 * 7. Elemental Zombie Cleanse:
 *    - If defender is a Zombie and hit by Fire or Lightning, 1 Poison card is removed!
 */
export function resolveDiceCombat({
  attacker,
  defender,
  actionCard = null,
  characterMove = null,
  attackerRoll = [3, 4], // 2 Red dice (or 1 Die for multiplier)
  clashWon = true, // Passed from Phase 1
  clashDefSum = 6, // Defender's sum from Phase 1 (for 6+ check)
  amplifyBonus = 0,
  isSingleDieMultiplier = false
}) {
  const atkChar = attacker.isZombie ? ZOMBIE_PROFILE : (CHARACTERS[attacker.characterId] || CHARACTERS.chynaman);
  const defChar = defender.isZombie ? ZOMBIE_PROFILE : (CHARACTERS[defender.characterId] || CHARACTERS.chynaman);

  // 0. Clash Check
  if (!clashWon) {
    return {
      rawAP: 0,
      weaknessTriggered: false,
      weaknessBonus: 0,
      defenseActivated: false,
      innateDP: 0,
      damageDealt: 0,
      absorbedByShield: 0,
      zombiePoisonCured: false,
      appliesPoison: false,
      appliesStun: false,
      revealCards: false,
      isMiss: true
    };
  }

  // 0.5. Zombie vs Zombie (No Effect)
  if (attacker.isZombie && defender.isZombie) {
    return {
      rawAP: 0,
      weaknessTriggered: false,
      weaknessBonus: 0,
      defenseActivated: false,
      innateDP: 0,
      damageDealt: 0,
      absorbedByShield: 0,
      zombiePoisonCured: false,
      appliesPoison: false,
      appliesStun: false,
      revealCards: false,
      isMiss: false // It's not a miss, it just has no effect
    };
  }

  // 1. Calculate Base AP
  let rawAP = 0;
  let multiplierRoll = attackerRoll[0];

  if (characterMove) {
    if (characterMove.type === 'dice_mult') {
      rawAP = multiplierRoll * (characterMove.multiplier || 4);
    } else {
      rawAP = characterMove.baseAP || 25;
    }
  } else if (actionCard) {
    if (actionCard.id === 'atk_super') rawAP = 40;
    else if (actionCard.id === 'atk_basic') rawAP = 25;
    else rawAP = 20;
  } else {
    rawAP = 25;
  }

  rawAP += amplifyBonus + (attacker.buffAP || 0);

  // 2. Check Elemental Weakness
  let weaknessTriggered = false;
  let weaknessBonus = 0;
  const moveElement = characterMove?.element || (actionCard?.id === 'poison_card' ? 'Poison' : 'Physical');

  if (defChar.weakness && moveElement) {
    const wType = defChar.weakness.type.toLowerCase();
    const mElem = moveElement.toLowerCase();

    if (wType.includes(mElem) || (mElem === 'fire' && wType.includes('fire')) || (mElem === 'lightning' && wType.includes('lightning')) || (mElem === 'poison' && wType.includes('poison'))) {
      weaknessTriggered = true;
      weaknessBonus = defChar.weakness.bonusAP || 10;
    }
  }

  const totalOffensiveAP = Math.max(0, rawAP + weaknessBonus);

  // 3. Defender 6+ Defense Rule (2 Gold Dice sum >= 6 from Clash)
  const defenseActivated = clashDefSum >= 6;
  const innateDP = defenseActivated ? (defChar.defaultDP || 0) + (defender.buffDP || 0) : 0;

  // 4. Net Damage after DP mitigation
  const damageAfterDP = Math.max(0, totalOffensiveAP - innateDP);

  // 5. Shield absorption
  let currentShield = defender.shield || 0;
  let netHPDamage = damageAfterDP;
  let absorbedByShield = 0;

  if (currentShield > 0) {
    if (currentShield >= netHPDamage) {
      absorbedByShield = netHPDamage;
      currentShield -= netHPDamage;
      netHPDamage = 0;
    } else {
      absorbedByShield = currentShield;
      netHPDamage -= currentShield;
      currentShield = 0;
    }
  }

  // 6. Zombie Fire / Lightning Weakness: Removes 1 Poison card on hit
  let zombiePoisonCured = false;
  if (defender.isZombie && (moveElement === 'Fire' || moveElement === 'Lightning')) {
    zombiePoisonCured = true;
  }

  // 7. Check special effects
  const appliesPoison = characterMove?.appliesPoison || actionCard?.id === 'poison_card' || attacker.isZombie;
  const appliesStun = characterMove?.stun || false;
  const revealCards = characterMove?.revealCards || false;

  return {
    isTie: false,
    attackerDice: attackerRoll,
    defenderDice: defenderRoll || [],
    attackerDiceSum: attackerRoll.reduce((a, b) => a + b, 0),
    defenderDiceSum: defenderRoll ? defenderRoll.reduce((a, b) => a + b, 0) : 0,
    rawAP,
    weaknessTriggered,
    weaknessBonus,
    totalOffensiveAP,
    defenseActivated,
    innateDP,
    damageAfterDP,
    absorbedByShield,
    damageDealt: netHPDamage,
    newShield: currentShield,
    appliesPoison,
    appliesStun,
    revealCards,
    zombiePoisonCured,
    moveElement,
    isAttackSuccessful: totalOffensiveAP > 0
  };
}

/**
 * Advance turn logic with poison tick, zombie regen, and stun handling
 */
export function advanceTurn(state) {
  const playerCount = state.players.length;
  const step = state.direction === 'clockwise' ? 1 : -1;
  let nextIndex = state.activePlayerIndex;

  const stunnedSkips = [];
  for (let hops = 0; hops < playerCount * 2; hops++) {
    nextIndex = (nextIndex + step + playerCount) % playerCount;
    const candidate = state.players[nextIndex];
    if (candidate.isDefeated) continue;

    // Stunned player forfeits their turn; stun is consumed
    if (candidate.isStunned && !stunnedSkips.includes(nextIndex)) {
      stunnedSkips.push(nextIndex);
      continue;
    }
    break;
  }

  const isNewRound = nextIndex === 0;
  const newTurnNumber = state.turnNumber + 1;
  const newRoundNumber = isNewRound ? state.roundNumber + 1 : state.roundNumber;

  let transformationAlert = null;

  const updatedPlayers = state.players.map((p, idx) => {
    let updated = { ...p };

    // Reset turn flags for next active player
    if (idx === nextIndex) {
      updated.claimedTurnET = false;
      updated.retreatedThisTurn = false;
      updated.buffAP = 0;
      updated.buffDP = 0;

      // Zombie Auto +10 HP regen at start of turn
      if (updated.isZombie && updated.hp > 0) {
        updated.hp = Math.min(updated.maxHP, updated.hp + ZOMBIE_PROFILE.turnRegen);
      }

      // Poison damage at start of turn (-10 HP per poison card for non-zombies)
      if (!updated.isZombie && updated.poisonCards > 0) {
        const poisonDmg = updated.poisonCards * 10;
        updated.hp = Math.max(0, updated.hp - poisonDmg);
        updated.stats.damageTaken += poisonDmg;
      }
    }

    if (stunnedSkips.includes(idx)) {
      updated.isStunned = false;
    }

    const beforeZombie = updated.isZombie;
    updated = checkZombieStatus(updated);

    if (!beforeZombie && updated.isZombie) {
      transformationAlert = {
        player: updated.name,
        poisonCount: updated.poisonCards
      };
    }

    return updated;
  });

  // Check victory condition (3 Stability Crystals or last alive)
  const alivePlayers = updatedPlayers.filter(p => !p.isDefeated && !p.isZombie);
  let winner = null;

  for (const p of updatedPlayers) {
    if (p.crystals >= GAME_LIMITS.WINNING_CRYSTALS && !p.isZombie) {
      winner = p;
      break;
    }
  }

  if (!winner && alivePlayers.length === 1 && updatedPlayers.length > 1) {
    winner = alivePlayers[0];
  }

  return {
    ...state,
    players: updatedPlayers,
    activePlayerIndex: nextIndex,
    turnNumber: newTurnNumber,
    roundNumber: newRoundNumber,
    winner: winner || state.winner,
    phase: winner ? 'game_over' : state.phase,
    zombieTransformationAlert: transformationAlert
  };
}

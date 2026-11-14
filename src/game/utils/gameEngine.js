// TCG Card Game — Official Game Logic & State Management Engine
import { CHARACTERS, ZOMBIE_PROFILE } from '../data/characters.js';
import { GAME_LIMITS, ACTION_CARDS } from '../data/cards.js';
import { KONTROLA_CHARACTERS } from '../kontrola/KontrolaEngine.js';

export function drawRandomCards(count) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    // Generate a unique ID for each card instance so React keys don't clash
    const baseCard = ACTION_CARDS[Math.floor(Math.random() * ACTION_CARDS.length)];
    drawn.push({ ...baseCard, instanceId: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` });
  }
  return drawn;
}

export function createInitialGameState(playerConfigs) {
  const players = playerConfigs.map((cfg, idx) => {
    const characterId = cfg.characterId || 'chynaman';
    const charData = KONTROLA_CHARACTERS[characterId];
    const characterHP = charData?.maxHp || GAME_LIMITS.BASE_HP;
    
    return {
      id: `player_${idx + 1}`,
      name: cfg.name || `Player ${idx + 1}`,
      characterId: characterId,
      level: 1, // NEW: Character level starts at 1
      reserveHp: charData?.baseReserveHP !== undefined ? charData.baseReserveHP : (CHARACTERS[characterId]?.baseReserveHP || 0),
      maxReserveHp: charData?.baseReserveHP !== undefined ? charData.baseReserveHP : (CHARACTERS[characterId]?.baseReserveHP || 0),
      reserveUnlocked: charData?.reserveUnlocked !== undefined ? charData.reserveUnlocked : Boolean(CHARACTERS[characterId]?.reserveUnlocked),
      reserveActivations: 0,
      hp: cfg.startingHP || characterHP,
      maxHp: characterHP,
      preZombieHP: cfg.startingHP || characterHP,
      energyTokens: cfg.startingET || GAME_LIMITS.STARTING_ET,
      crystals: cfg.startingCrystals || (playerConfigs.length === 2 ? 2 : 1),
      poisonCards: 0,
      poisonCount: 0,
      burnCount: 0,
      dicePenalty: 0,
      sleepTurns: 0,
      isZombie: false,
      isDefeated: false,
      retreatedThisTurn: false,
      shield: 0,
      buffAP: 0,
      buffDP: 0,
      isStunned: false,
      kontrolUsesLeft: 2,
      blitzUsesLeft: 2,
      kontrolCooldown: 0,
      blitzCooldown: 0,
      vampireStealStack: 0,
      vampireStealTurnsLeft: 0,
      retreatSpeed: charData?.retreatSpeed || 1,
      claimedTurnET: false,
      turnActionCompleted: false,
      actionCardsHand: drawRandomCards(10),
      burnExtinguishRoll: false, // Flag for per-turn burn extinguish check
      flyerNoWeakness: false, // Flag for ANIME EXPRESS TV (FLYER card) - no weakness for one turn
      stats: {
        damageDealt: 0,
        damageTaken: 0,
        cardsPlayed: 0,
        zombiesInfected: 0,
        diceRolls: 0
      }
    };
  });

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
    p.hp = Math.min(p.maxHp || p.maxHP || 100, Math.max(10, p.preZombieHP)); // Revert to pre-zombie HP, use character's true max
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
 * 8. +DEFENCE Card System:
 *    - If defender uses +DEFENCE card during clash:
 *      - Priority 1: If defender WINS clash, apply defenseBonus to reduce attacker damage
 *      - Priority 2: If defender LOSES clash BUT rolls 6+, apply character's defaultDP
 *      - If neither: card has no effect that round
 * 9. BACK STAB Bypass:
 *    - BACK STAB bypasses shield and basic defense, deals fixed 25 AP
 *    - Only works in 3+ player matches
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
  isSingleDieMultiplier = false,
  playerCount = 2, // For BACK STAB and SOUL ALLIANCE gating
  defenseCard = null, // +DEFENCE card used by defender
  isBackStab = false // Whether this attack is BACK STAB
}) {
  const atkChar = attacker.isZombie ? ZOMBIE_PROFILE : (CHARACTERS[attacker.characterId] || CHARACTERS.chynaman);
  const defChar = defender.isZombie ? ZOMBIE_PROFILE : (CHARACTERS[defender.characterId] || CHARACTERS.chynaman);

  // BACK STAB Gate: Only works in 3+ player matches
  if (isBackStab && playerCount <= 2) {
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
      burnStacks: 0,
      revealCards: false,
      isMiss: true,
      isBackStabBlocked: true // Flag for blocked BACK STAB
    };
  }

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
      burnStacks: 0,
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
      burnStacks: 0,
      revealCards: false,
      isMiss: false // It's not a miss, it just has no effect
    };
  }

  // 1. Calculate Base AP
  let rawAP = 0;
  let multiplierRoll = attackerRoll[0];

  if (characterMove) {
    if (characterMove.type === 'dice_mult') {
      // Base multiplier from character move (e.g., "Fire of Fury" = 5)
      let charMultiplier = characterMove.multiplier || 4;
      
      // ATTACK X2 doubles the multiplier (ATTACK X1 = ×10 AP, ATTACK X2 = ×20 AP)
      // Check if actionCard is ATTACK X2 to apply the doubling bonus
      if (actionCard?.name === 'ATTACK X2') {
        charMultiplier = charMultiplier * 2;
      }
      
      rawAP = multiplierRoll * charMultiplier;
    } else {
      rawAP = characterMove.baseAP || 25;
    }
  } else if (actionCard) {
    if (actionCard.id === 'lightning_x2' || actionCard.name === 'LIGHTNING X2' || actionCard.id === 'fire_flame_x2' || actionCard.name === 'FIRE FLAME X2' || actionCard.id === 'poison_x2' || actionCard.name === 'POISON X2') rawAP = 20;
    else if (actionCard.id === 'lightning_x1' || actionCard.name === 'LIGHTNING X1' || actionCard.id === 'fire_flame_x1' || actionCard.name === 'FIRE FLAME X1' || actionCard.id === 'poison_x1' || actionCard.name === 'POISON X1') rawAP = 10;
    else if (actionCard.id === 'atk_x2') rawAP = 40;
    else if (actionCard.id === 'atk_x1') rawAP = 25;
    else rawAP = 20;
  } else {
    rawAP = 25;
  }

  rawAP += amplifyBonus + (attacker.buffAP || 0);

  // 2. Check Elemental Weakness
  let weaknessTriggered = false;
  let weaknessBonus = 0;
  const isAttackerZombie = attacker.isZombie || (attacker.poisonCards >= 5) || (attacker.poisonCount >= 5);
  const moveElement = isAttackerZombie ? 'Poison' : (characterMove?.element || (
    actionCard?.id?.includes('lightning') || actionCard?.name?.includes('LIGHTNING') ? 'Lightning' :
    actionCard?.id?.includes('fire') || actionCard?.name?.includes('FIRE FLAME') ? 'Fire' :
    (actionCard?.id === 'poison_x1' || actionCard?.id === 'poison_x2' || actionCard?.name?.includes('POISON') ? 'Poison' : 'Physical')
  ));

  // Check if defender has FLYER card immunity (ANIME EXPRESS TV)
  const hasflyerImmunity = defender?.flyerNoWeakness || false;

  const defCharKey = (defender.characterId || defender.id || defender.name || '').toLowerCase();
  const defWeakness = (defChar.weakness?.type || defender.weakness?.type || defender.weakness || '').toLowerCase();
  const hasPoisonWeakness = defWeakness.includes('poison') || ['chynaman', 'kiko', 'poochi', 'kat', 'katsumi', 'bee'].some(k => defCharKey.includes(k));
  const hasFireWeakness = defWeakness.includes('fire') || ['shroomy', 'queeny'].some(k => defCharKey.includes(k));

  if (!hasflyerImmunity) {
    if ((isAttackerZombie || moveElement === 'Poison') && hasPoisonWeakness) {
      weaknessTriggered = true;
      weaknessBonus = 10;
    } else if (moveElement === 'Fire' && hasFireWeakness) {
      weaknessTriggered = true;
      weaknessBonus = 10;
    } else if (defChar.weakness && moveElement) {
      const wType = defChar.weakness.type.toLowerCase();
      const mElem = moveElement.toLowerCase();

      if (wType.includes(mElem) || (mElem === 'fire' && wType.includes('fire')) || (mElem === 'lightning' && wType.includes('lightning')) || (mElem === 'poison' && wType.includes('poison'))) {
        weaknessTriggered = true;
        weaknessBonus = defChar.weakness.bonusAP || 10;
      }
    }
  } else if (hasflyerImmunity && defChar.weakness && moveElement) {
    // Log that weakness was blocked by FLYER card
    const wType = defChar.weakness.type.toLowerCase();
    const mElem = moveElement.toLowerCase();
    if (wType.includes(mElem) || (mElem === 'fire' && wType.includes('fire')) || (mElem === 'lightning' && wType.includes('lightning')) || (mElem === 'poison' && wType.includes('poison'))) {
      // Would be weakness, but FLYER immunity blocks it
    }
  }

  const totalOffensiveAP = Math.max(0, rawAP + weaknessBonus);

  // 3. Defender 6+ Defense Rule (2 Gold Dice sum >= 6 from Clash)
  // +DEFENCE Card Priority: Priority 1 applies if defender wins clash
  let defenseActivated = clashDefSum >= 6;
  let innateDP = defenseActivated ? (defChar.defaultDP || 0) + (defender.buffDP || 0) : 0;
  let defenseCardBonus = 0;

  // Apply +DEFENCE card bonus only if defender wins clash OR has 6+ defense
  if (defenseCard && (clashWon === false || (clashWon === true && defenseActivated))) {
    defenseCardBonus = defenseCard.defenseBonus || 0;
    if (clashWon === false && clashDefSum >= 6) {
      // Priority 2: Defender lost clash but rolled 6+, use innateDP
      defenseCardBonus = 0;
    }
  }

  // 4. BACK STAB bypasses shield and defense
  let netDamageBeforeShield = totalOffensiveAP - innateDP - defenseCardBonus;
  
  if (isBackStab) {
    // BACK STAB: Fixed 25 AP, bypasses all defenses
    netDamageBeforeShield = 25;
  }

  const damageAfterDP = Math.max(0, netDamageBeforeShield);

  // 5. Shield absorption
  let currentShield = defender.shield || 0;
  let netHPDamage = damageAfterDP;
  let absorbedByShield = 0;

  // BACK STAB bypasses shield
  if (isBackStab) {
    absorbedByShield = 0;
    // No shield reduction for BACK STAB
  } else if (currentShield > 0) {
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

  const isDrain = actionCard?.name === 'DRAIN';
  const isVampire = actionCard?.name === 'VAMPIRE LIFE STEAL';
  if (isDrain || isVampire) {
    netHPDamage = 0; // Handled directly in BattleArena stat resolution
  }

  // 6. Zombie Fire / Lightning Weakness: Removes 1 Poison card on hit
  let zombiePoisonCured = false;
  if (defender.isZombie && (moveElement === 'Fire' || moveElement === 'Lightning')) {
    zombiePoisonCured = true;
  }

  // 7. Check special effects
  const isPoisonX2 = actionCard?.id === 'poison_x2' || actionCard?.name === 'POISON X2';
  const isPoisonX1 = actionCard?.id === 'poison_x1' || actionCard?.name === 'POISON X1' || actionCard?.name?.includes('POISON');
  const appliesPoison = characterMove?.appliesPoison || isPoisonX1 || isPoisonX2 || attacker.isZombie;
  const poisonStacks = isPoisonX2 ? 2 : (appliesPoison ? 1 : 0);
  const appliesStun = characterMove?.appliesStun || characterMove?.stun || actionCard?.name?.includes('FREEZE') || false;
  const healsAttacker = clashWon ? (characterMove?.healsAttacker || 0) : 0;
  
  let burnStacks = 0;
  if (clashWon) {
    if (actionCard?.name === 'FIRE FLAME X2' || actionCard?.id === 'fire_flame_x2') {
      burnStacks = 2;
    } else if (actionCard?.name === 'FIRE FLAME X1' || actionCard?.id === 'fire_flame_x1' || actionCard?.name?.includes('FIRE FLAME')) {
      burnStacks = 1;
    }
  }

  const revealCards = characterMove?.revealCards || false;

  // Official LIGHTNING Functionality:
  // LIGHTNING X1: On successful attack, defendant receives -10 HP and attacker receives another turn (1 extra turn).
  // LIGHTNING X2: On successful attack, defendant receives -20 HP and attacker receives 2 extra turns.
  // If attack is not successful, nothing happens and game continues (no extra turn awarded).
  let extraTurnsGranted = 0;
  let sleepTurns = 0;

  if (clashWon) {
    const cardName = actionCard?.name || '';
    if (cardName.includes('LIGHTNING X2')) {
      extraTurnsGranted = 2;
    } else if (cardName.includes('LIGHTNING X1')) {
      extraTurnsGranted = 1;
    } else if (actionCard?.name === 'TIME MACHINE') {
      extraTurnsGranted = 1;
    } else if (cardName.includes('SLEEPY X2')) {
      sleepTurns = 2;
    } else if (cardName.includes('SLEEPY X1')) {
      sleepTurns = 1;
    }
  }

  const extraTurnGranted = extraTurnsGranted > 0;

  // When sleepTurns handles skip duration, disable appliesStun to prevent double-skip via isStunned
  const effectiveAppliesStun = sleepTurns > 0 ? false : appliesStun;

  return {
    isTie: false,
    attackerDice: attackerRoll,
    defenderDice: [],
    attackerDiceSum: attackerRoll.reduce((a, b) => a + b, 0),
    defenderDiceSum: clashDefSum,
    rawAP,
    weaknessTriggered,
    weaknessBonus,
    totalOffensiveAP,
    defenseActivated,
    innateDP,
    defenseCardBonus,
    damageAfterDP,
    absorbedByShield,
    damageDealt: netHPDamage,
    newShield: currentShield,
    appliesPoison,
    poisonStacks,
    appliesStun: effectiveAppliesStun,
    healsAttacker,
    burnStacks,
    revealCards,
    extraTurnGranted,
    extraTurnsGranted,
    sleepTurns,
    isDrain,
    isVampire,
    zombiePoisonCured,
    moveElement,
    isAttackSuccessful: totalOffensiveAP > 0,
    isMiss: !clashWon,
    isBackStab
  };
}

/**
 * Advance turn logic with poison tick, zombie regen, and stun handling
 */
export function advanceTurn(state) {
  const currentActive = state.players[state.activePlayerIndex];
  if (currentActive && currentActive.extraTurns > 0 && !currentActive.isDefeated) {
    const nextIndex = state.activePlayerIndex;
    const newTurnNumber = state.turnNumber + 1;

    const updatedPlayers = state.players.map((p, idx) => {
      let updated = { ...p };
      if (idx === nextIndex) {
        updated.extraTurns -= 1;
        updated.claimedTurnET = false;
        updated.turnActionCompleted = false;
        updated.retreatedThisTurn = false;
        updated.flyerNoWeakness = false;
        updated.buffAP = 0;
        updated.buffDP = 0;
      }
      return updated;
    });

    return {
      ...state,
      players: updatedPlayers,
      activePlayerIndex: nextIndex,
      turnNumber: newTurnNumber,
      turnLogs: [`⚡ Extra turn activated for ${currentActive.name}! (${currentActive.extraTurns - 1} extra turn(s) remaining)`]
    };
  }

  const playerCount = state.players.length;
  const step = state.direction === 'clockwise' ? 1 : -1;
  let nextIndex = state.activePlayerIndex;

  const stunnedSkips = [];
  for (let hops = 0; hops < playerCount * 2; hops++) {
    nextIndex = (nextIndex + step + playerCount) % playerCount;
    const candidate = state.players[nextIndex];
    if (candidate.isDefeated) continue;

    // Stunned or sleep-turned player forfeits their turn; status is consumed
    if ((candidate.isStunned || (candidate.sleepTurns && candidate.sleepTurns > 0)) && !stunnedSkips.includes(nextIndex)) {
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
      updated.turnActionCompleted = false;
      updated.retreatedThisTurn = false;
      updated.flyerNoWeakness = false; // Reset FLYER card immunity at turn end
      updated.buffAP = 0;
      updated.buffDP = 0;

      // Decrement cooldowns at start of turn
      if (updated.kontrolCooldown > 0) {
        updated.kontrolCooldown -= 1;
      }
      if (updated.blitzCooldown > 0) {
        updated.blitzCooldown -= 1;
      }

      // Decrement vampire steal duration
      if (updated.vampireStealTurnsLeft > 0) {
        updated.vampireStealTurnsLeft -= 1;
      }

      // Zombie Auto +10 HP regen at start of turn
      if (updated.isZombie && updated.hp > 0) {
        updated.hp = Math.min(updated.maxHp || updated.maxHP || 100, updated.hp + ZOMBIE_PROFILE.turnRegen);
      }

      // Poison damage at start of turn (-10 HP per poison card for non-zombies)
      if (!updated.isZombie && updated.poisonCards > 0) {
        const poisonDmg = updated.poisonCards * 10;
        updated.hp = Math.max(0, updated.hp - poisonDmg);
        updated.stats.damageTaken += poisonDmg;
      }
      // Note: Active player's Fire Flame Burn is resolved interactively via the pre-turn Extinguish Modal
    }

    if (stunnedSkips.includes(idx)) {
      updated.isStunned = false;
      // Also decrement sleepTurns counter
      if (updated.sleepTurns && updated.sleepTurns > 0) {
        updated.sleepTurns -= 1;
      }
      // Sleeping / stunned players suffer burn tick during skipped turn
      if (!updated.isZombie && updated.burnCount > 0) {
        const burnDmg = updated.burnCount * 10;
        updated.hp = Math.max(0, updated.hp - burnDmg);
        updated.stats.damageTaken += burnDmg;
        updated.turnLogs = updated.turnLogs || [];
        updated.turnLogs.unshift(`🔥 ${updated.name} suffered -${burnDmg} Burn damage while asleep/stunned! HP: ${updated.hp}`);
      }
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

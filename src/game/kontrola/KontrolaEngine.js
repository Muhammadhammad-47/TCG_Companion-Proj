// TCG Companion — Kontrola Rule Engine
// Validated against Kontrolla_Data/Docs (Rules & Regulations, AI Breakdowns, Action Cards CSV)

export const KONTROLA_CHARACTERS = {
  chynaman: {
    id: 'chynaman',
    name: 'Chynaman',
    title: 'The Blazing Duelist',
    maxHp: 100,
    mind: 4,
    element: 'Fire',
    weakness: 'Magic/Poison',
    weaknessBonus: 10,
    innateDP: 10,
    themeColor: '#ff3366',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/CHYNA WILD CARD REG.png',
    attacks: {
      'FIRE OF FURY PER PUNCH': { ap: 5, dice: 1, element: 'Fire', desc: 'Roll 1 Die × 5 AP Fire damage.' },
      'FIRE TIGER SOUL PUNCH': { ap: 25, dice: 0, element: 'Fire', desc: 'Direct blazing strike dealing 25 AP.' },
      'GOLDEN MIC LIGHTING': { ap: 40, dice: 0, element: 'Lightning', isSuper: true, desc: 'Super Lightning strike dealing 40 AP.' }
    }
  },
  bee: {
    id: 'bee',
    name: 'Zabina "Bee" Solé',
    title: 'Queen of the Hive',
    maxHp: 100,
    mind: 5,
    element: 'Lightning',
    weakness: 'Magic/Poison',
    weaknessBonus: 10,
    innateDP: 10,
    themeColor: '#ffe600',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/BEE WILD CARD GOLD.png',
    attacks: {
      'STING SLAP PER STING': { ap: 3, dice: 1, element: 'Lightning', desc: 'Roll 1 Die × 3 AP Sting damage.' },
      'PAPARAZZI STUN': { ap: 25, dice: 0, element: 'Sonic', loseTurn: true, desc: '25 AP strike; target loses 1 turn.' },
      'BEE DRONE BOMB': { ap: 40, dice: 0, element: 'Lightning', isSuper: true, desc: 'Super Drone Bomb dealing 40 AP.' }
    }
  },
  kiko: {
    id: 'kiko',
    name: 'Kiko the Monkey',
    title: 'The Agile Prankster',
    maxHp: 100,
    mind: 3,
    element: 'Sonic',
    weakness: 'Fire',
    weaknessBonus: 10,
    innateDP: 10,
    themeColor: '#00f0ff',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/KIKO WILD CARD GOLD.png',
    attacks: {
      'TAIL WHIP PER WHIP': { ap: 4, dice: 1, element: 'Physical', desc: 'Roll 1 Die × 4 AP Tail strikes.' },
      'MULTIPLICITY': { ap: 30, dice: 0, element: 'Sonic', desc: 'Sonic clones strike dealing 30 AP.' },
      'SOUL BLAST 3000': { ap: 40, dice: 0, element: 'Energy', isSuper: true, desc: 'Super Soul Blast dealing 40 AP.' }
    }
  },
  katsumi: {
    id: 'katsumi',
    name: 'Katsumi',
    title: 'The Shadow Stalker',
    maxHp: 100,
    mind: 3,
    element: 'Shadow',
    weakness: 'Poison',
    weaknessBonus: 15,
    innateDP: 10,
    themeColor: '#a855f7',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/KAT WILD CARD GOLD.png',
    attacks: {
      'SAVAGE PAWS PER STRIKE': { ap: 5, dice: 1, element: 'Physical', desc: 'Roll 1 Die × 5 AP Paw strikes.' },
      'SHADOW PURR': { ap: 20, dice: 0, element: 'Shadow', desc: 'Shadow illusion dealing 20 AP.' },
      'CLAW OF FATE': { ap: 35, dice: 0, element: 'Shadow', desc: 'Critical shadow slash dealing 35 AP.' }
    }
  },
  poochi: {
    id: 'poochi',
    name: 'Poochi',
    title: 'The Celestial Canine',
    maxHp: 100,
    mind: 2,
    element: 'Magic',
    weakness: 'Magic/Poison',
    weaknessBonus: 10,
    innateDP: 10,
    themeColor: '#ff66cc',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/POOCHI WILD CARD GOLD.png',
    attacks: {
      'GLITTER SPARKS PER SPARK': { ap: 4, dice: 1, element: 'Magic', desc: 'Roll 1 Die × 4 AP Glitter sparks.' },
      'LASSO OF TRUTH': { ap: 25, dice: 0, element: 'Magic', revealCards: true, desc: '25 AP strike; target reveals Action Cards.' },
      'GLITTER BURST': { ap: 35, dice: 0, element: 'Magic', desc: 'Magical glitter explosion dealing 35 AP.' }
    }
  },
  queeny: {
    id: 'queeny',
    name: 'Queeny',
    title: 'The Siren Empress',
    maxHp: 100,
    mind: 2,
    element: 'Psychic',
    weakness: 'Fire',
    weaknessBonus: 10,
    innateDP: 10,
    themeColor: '#e0b0ff',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/QUEENY WILD CARD GOLD.png',
    attacks: {
      'HAIR WHIP PER WHIP': { ap: 4, dice: 1, element: 'Physical', desc: 'Roll 1 Die × 4 AP Hair whip strikes.' },
      'SIREN BLAST': { ap: 30, dice: 0, element: 'Psychic', desc: 'Hypnotic siren wave dealing 30 AP.' },
      'RAINBOW FAN BLAST': { ap: 35, dice: 0, element: 'Psychic', desc: 'Prismatic fan blast dealing 35 AP.' }
    }
  },
  shroomy: {
    id: 'shroomy',
    name: 'Shroomy',
    title: 'The Spore Alchemist',
    maxHp: 100,
    mind: 2,
    element: 'Nature',
    weakness: 'Fire',
    weaknessBonus: 10,
    innateDP: 10,
    themeColor: '#39ff14',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/SHROOMY WILD CARD GOLD.png',
    attacks: {
      'POPPERS PER POP': { ap: 4, dice: 1, element: 'Nature', desc: 'Roll 1 Die × 4 AP Spore poppers.' },
      'MS BOMBA': { ap: 40, dice: 0, element: 'Fire', desc: 'Explosive spore bomb dealing 40 AP.' },
      'SOUL SNATCHER': { ap: 50, dice: 0, element: 'Dark', isSuper: true, desc: 'Super Soul Snatcher dealing 50 AP.' }
    }
  }
};

// 100-Card Basic Blueprint from Action Cards % - Sheet1.csv
export const ACTION_CARDS_BASIC = [
  { name: 'ATTACK X1', type: 'ATTACK', count: 21, costET: 1, desc: 'Standard combat attack with paired character move.' },
  { name: 'POISON X1', type: 'STATUS', count: 17, costET: 0, desc: 'Inflicts 1 Poison stack (-10 HP/turn).' },
  { name: 'DEFENCE - BASIC', type: 'DEFENSE', count: 7, costET: 0, desc: 'Reduces incoming damage by 25%.' },
  { name: 'ANTIDOTE X1', type: 'HEAL', count: 7, costET: 0, desc: 'Removes 1 Poison card.' },
  { name: 'HEAL H10', type: 'HEAL', count: 6, costET: 0, desc: 'Restores +10 HP.' },
  { name: 'LIGHTNING X1', type: 'ATTACK', count: 6, costET: 1, desc: 'Lightning strike dealing -10 HP and -1 turn.' },
  { name: 'RETREAT', type: 'TACTICAL', count: 6, costET: 0, desc: 'Escape combat without taking damage.' },
  { name: 'SHIELD BASIC +25 HP', type: 'DEFENSE', count: 6, costET: 0, desc: 'Grants +25 Shield barrier points.' },
  { name: 'SOUL ALLIANCE', type: 'OTHERS', count: 6, costET: 0, desc: 'Forge an alliance with another player.' },
  { name: 'VITALITY GAIN V10', type: 'HEAL', count: 6, costET: 0, desc: '+10 HP or prepare to Level Up.' },
  { name: 'HEAL H30', type: 'HEAL', count: 6, costET: 0, desc: 'Restores +30 HP.' },
  { name: 'HEAL H40', type: 'HEAL', count: 6, costET: 0, desc: 'Restores +40 HP.' },
  { name: 'ANTIDOTE X2', type: 'HEAL', count: 6, costET: 0, desc: 'Removes 2 Poison cards.' },
  { name: 'ATTACK X2', type: 'ATTACK', count: 6, costET: 2, desc: 'Double character attack unleash.' },
  { name: 'BOOMERANG FULL', type: 'ATTACK', count: 6, costET: 1, desc: 'On successful defense, reflects all damage back to attacker.' },
  { name: 'HEAL H20', type: 'HEAL', count: 6, costET: 0, desc: 'Restores +20 HP.' },
  { name: 'LIGHTNING X2', type: 'ATTACK', count: 6, costET: 2, desc: 'Heavy lightning dealing -20 HP and -2 turns.' },
  { name: 'MISDIRECT', type: 'ATTACK', count: 6, costET: 1, desc: 'Redirect an opponent attack.' },
  { name: 'POISON X2', type: 'STATUS', count: 6, costET: 0, desc: 'Inflicts 2 Poison stacks (-20 HP/turn).' },
  { name: 'REVIVE', type: 'HEAL', count: 6, costET: 0, desc: 'Brings player back to life with 50% HP.' },
  { name: 'SLEEPY X1', type: 'OTHERS', count: 6, costET: 0, desc: 'Target falls asleep and skips 1 turn.' },
  { name: 'VISION X1', type: 'OTHERS', count: 6, costET: 0, desc: 'Target reveals Action Cards for 15s.' },
  { name: 'VITALITY GAIN V20', type: 'HEAL', count: 6, costET: 0, minLevel: 2, desc: '+20 HP or level up to Level 2 (Requires Level 2).' },
  { name: 'X-CHANGE X1', type: 'OTHERS', count: 6, costET: 0, desc: 'Exchange 1 Action Card with an opponent.' },
  { name: 'DEFENCE - COUNTER', type: 'DEFENSE', count: 1, costET: 0, desc: '0% damage taken, reflect 25% back.' },
  { name: 'FIRE FLAME X1', type: 'ATTACK', count: 1, costET: 1, desc: 'Burns target on hit (-10 HP/turn).' },
  { name: 'HEAL CLEANSE+RESTORE', type: 'HEAL', count: 1, costET: 0, desc: 'Cleanses all poison and restores +20 HP.' },
  { name: 'TIME MACHINE', type: 'OTHERS', count: 1, costET: 0, desc: 'Receive another turn immediately.' },
  { name: 'ABANDON', type: 'OTHERS', count: 1, costET: 0, desc: 'Abandon your ally in combat.' },
  { name: 'DODGE - BASIC', type: 'DEFENSE', count: 1, costET: 0, desc: 'Evade all incoming attack damage.' }
];

// 157-Card Premium Blueprint from Action Cards % - Sheet1.csv
export const ACTION_CARDS_PREMIUM = [
  ...ACTION_CARDS_BASIC,
  { name: 'ANTIDOTE FULL', type: 'HEAL', count: 2, costET: 0, desc: 'Cures all poison cards.' },
  { name: 'DEFENCE FULL GUARD', type: 'DEFENSE', count: 4, costET: 0, desc: 'High defense barrier.' },
  { name: 'DODGE - COUNTER', type: 'DEFENSE', count: 3, costET: 0, desc: 'Dodge and immediately counter-attack.' },
  { name: 'FIRE FLAME X2', type: 'ATTACK', count: 3, costET: 1, desc: 'Intense fire dealing -20 HP burn.' },
  { name: 'FREEZE X2', type: 'OTHERS', count: 4, costET: 0, desc: 'Freezes target for 2 turns.' },
  { name: 'VISION FULL', type: 'OTHERS', count: 3, costET: 0, desc: 'All players reveal Action Cards for 30s.' },
  { name: 'BACK STAB', type: 'ATTACK', count: 4, costET: 1, desc: 'Surprise rear assault.' },
  { name: 'SHIELD FIRE + 50HP', type: 'DEFENSE', count: 2, costET: 0, desc: '+50 Shield; immune to Fire damage.' },
  { name: 'SHIELD SACRED PROTECTION', type: 'DEFENSE', count: 2, costET: 0, desc: 'Sacred barrier absorbing damage.' },
  { name: 'SHIELD ADVANCE +100HP', type: 'DEFENSE', count: 1, costET: 0, desc: '+100 Advanced Shield barrier.' },
  { name: 'SLEEPY X2', type: 'OTHERS', count: 3, costET: 0, desc: 'Target sleeps for 2 turns.' },
  { name: 'VAMPIRE LIFE STEAL', type: 'ATTACK', count: 1, costET: 1, desc: 'Steals 1 ET and 10 HP for 3 turns.' },
  { name: 'DRAIN', type: 'ATTACK', count: 2, costET: 1, desc: 'Steals all opponent Energy Tokens.' },
  { name: 'VITALITY GAIN V30', type: 'HEAL', count: 2, costET: 0, desc: '+30 HP vitality surge.' },
  { name: 'VITALITY V40', type: 'HEAL', count: 2, costET: 0, desc: '+40 HP vitality surge.' },
  { name: '+DEFENCE D20', type: 'DEFENSE', count: 4, costET: 0, desc: '+20 Defense points.' },
  { name: 'X-CHANGE FULL', type: 'OTHERS', count: 2, costET: 0, desc: 'Exchange cards with all opponents.' },
  { name: 'KONTROL', type: 'SPECIAL', count: 2, costET: 3, desc: 'Mind Control target (Mind Strength check). Max 2/match.' },
  { name: 'SAIGO NO BLITZ', type: 'ULTIMATE', count: 2, costET: 5, desc: 'Devastating 200 AP blast (HP < 50 req). Max 2/match.' }
];

export function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  const arr = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
  }
  return arr;
}

export const generateDeck = (isPremium = false) => {
  const blueprint = isPremium ? ACTION_CARDS_PREMIUM : ACTION_CARDS_BASIC;
  let deck = [];
  blueprint.forEach(card => {
    const count = card.count || 1;
    for (let i = 0; i < count; i++) {
      deck.push({
        ...card,
        id: `${card.name.replace(/\s+/g, '_')}_${Math.random().toString(36).substring(2, 9)}`
      });
    }
  });
  return shuffle(deck);
};

export const dealInitialHands = (deck, playerIds) => {
  const hands = {};
  const currentDeck = [...deck];
  playerIds.forEach(id => {
    hands[id] = currentDeck.splice(0, 10);
  });
  return { updatedDeck: currentDeck, hands };
};

export const rollDice = (count = 1) => {
  let total = 0;
  let rolls = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * 6) + 1;
    rolls.push(r);
    total += r;
  }
  return { total, rolls };
};

// Authoritative turn resolution
export const resolveTurn = (actionCard, attackerChar, attackerState, defenderState, attackSelectionName = null, precalculatedRolls = null) => {
  let log = `${attackerState.name} played ${actionCard.name}.`;
  let damage = 0;
  let heal = 0;
  let shieldGain = 0;

  let newAttackerState = { ...attackerState };
  let newDefenderState = defenderState ? { ...defenderState } : null;

  // Dice Rolls
  const attackerRoll = precalculatedRolls?.attackerRoll || rollDice(2);
  const defenderRoll = precalculatedRolls?.defenderRoll || rollDice(2);
  const kRoll = precalculatedRolls?.kRoll || rollDice(1);
  const dRoll = precalculatedRolls?.dRoll || rollDice(1);

  const cardName = actionCard.name.toUpperCase();
  const isAttackerZombie = newAttackerState.poisonCount >= 5;
  const isDefenderZombie = newDefenderState?.poisonCount >= 5;

  // 1. KONTROL CARD
  if (cardName.includes('KONTROL') && newDefenderState) {
    if (isDefenderZombie) {
      log += ` Kontrol fails! Zombies are mindless and cannot be controlled.`;
    } else {
      let controllerRoll = kRoll.total;
      if (newAttackerState.id === 'queeny') controllerRoll += 2; // Queeny +2 psychic bonus
      let targetMind = newDefenderState.mind || 3;
      if (['kiko', 'poochi', 'shroomy'].includes(newDefenderState.id)) targetMind += 1; // Magical defense +1

      if (controllerRoll > targetMind) {
        log += ` Kontrol SUCCESS! Roll ${controllerRoll} beat Mind Strength ${targetMind}! Target is mind-controlled.`;
      } else {
        log += ` Kontrol FAILED! Roll ${controllerRoll} did not beat Mind Strength ${targetMind}.`;
      }
    }
  }
  // 2. SAIGO NO BLITZ (200 AP)
  else if (cardName.includes('BLITZ')) {
    if (newAttackerState.hp >= 50) {
      log += ` Blitz requires HP < 50! Cannot activate.`;
    } else {
      const selfSacrifice = Math.floor(newAttackerState.hp * 0.5);
      newAttackerState.hp = Math.max(1, newAttackerState.hp - selfSacrifice);
      damage = 200;
      if (newDefenderState) {
        newDefenderState.hp = Math.max(0, newDefenderState.hp - damage);
        log += ` SAIGO NO BLITZ hit ${newDefenderState.name} for 200 AP devastation! (${attackerState.name} sacrificed ${selfSacrifice} HP)`;
      } else {
        log += ` SAIGO NO BLITZ unleashed 200 AP blast!`;
      }
    }
  }
  // 3. ATTACK CARDS (With Character Combat Moves or Standalone Elemental Spells)
  else if (actionCard.type === 'ATTACK') {
    let baseAP = 15;
    let attackElement = 'Physical';

    if (cardName.includes('LIGHTNING')) {
      baseAP = cardName.includes('X2') ? 20 : 10;
      attackElement = 'Lightning';
      log += ` [${actionCard.name}: Elemental Lightning strike dealing ${baseAP} AP]`;
    } else if (isAttackerZombie) {
      baseAP = 20; // Zombie Venom Strike
      attackElement = 'Poison';
    } else if (attackSelectionName && attackerChar?.attacks?.[attackSelectionName]) {
      const atk = attackerChar.attacks[attackSelectionName];
      attackElement = atk.element || 'Physical';
      if (atk.dice > 0) {
        baseAP = dRoll.total * atk.ap;
        log += ` [${attackSelectionName}: ${dRoll.total} × ${atk.ap} AP = ${baseAP} AP]`;
      } else {
        baseAP = atk.ap;
      }
    }

    // Clash Contest: Attacker 2 dice vs Defender 2 dice
    const isClashTie = attackerRoll.total === defenderRoll.total;
    const atkWin = !isClashTie && attackerRoll.total > defenderRoll.total;
    log += ` Clash: Attacker ${attackerRoll.total} vs Defender ${defenderRoll.total}.`;

    if (isClashTie) {
      log += ` Clash Tied (${attackerRoll.total} vs ${defenderRoll.total})! Attack neutralized.`;
    } else if (atkWin) {
      let finalDamage = baseAP;

      // Weakness Bonus (+10 or +15 AP)
      if (newDefenderState && attackElement && newDefenderState.weakness) {
        const matchesWeakness = newDefenderState.weakness.toLowerCase().includes(attackElement.toLowerCase());
        if (matchesWeakness) {
          const bonus = newDefenderState.weaknessBonus || 10;
          finalDamage += bonus;
          log += ` WEAKNESS TRIGGER! +${bonus} AP bonus!`;
        }
      }

      // Innate Defense: Defender rolled total of 6 or higher -> -10 HP less
      if (defenderRoll.total >= 6) {
        finalDamage = Math.max(0, finalDamage - 10);
        log += ` Defender rolled ${defenderRoll.total} (6+)! Innate DP reduced damage by 10!`;
      }

      // Shield Absorption
      if (newDefenderState?.shield > 0) {
        const absorbed = Math.min(newDefenderState.shield, finalDamage);
        newDefenderState.shield -= absorbed;
        finalDamage -= absorbed;
        log += ` Shield absorbed ${absorbed} damage.`;
      }

      // Apply damage to defender
      if (newDefenderState) {
        newDefenderState.hp = Math.max(0, newDefenderState.hp - finalDamage);
        log += ` Attack lands! ${newDefenderState.name} takes ${finalDamage} damage.`;

        // Lightning effect: shocks defender causing them to lose turns
        if (cardName.includes('LIGHTNING')) {
          const skipTurns = cardName.includes('X2') ? 2 : 1;
          newDefenderState.sleepTurns = (newDefenderState.sleepTurns || 0) + skipTurns;
          log += ` Lightning shock! ${newDefenderState.name} loses ${skipTurns} turn(s)!`;
        }

        // If Zombie is hit by Fire or Lightning -> removes 1 poison card
        if (isDefenderZombie && ['Fire', 'Lightning'].includes(attackElement)) {
          newDefenderState.poisonCount = Math.max(0, newDefenderState.poisonCount - 1);
          log += ` Fire/Lightning cleansed 1 Poison card from Zombie!`;
        }

        // If Attacker was Zombie Venom Strike -> Defender gains 1 Poison Card
        if (isAttackerZombie && !isDefenderZombie) {
          newDefenderState.poisonCount = (newDefenderState.poisonCount || 0) + 1;
          log += ` Venom Strike infected ${newDefenderState.name} with 1 Poison card!`;
        }
      }
    } else {
      log += ` Defender blocked or dodged the attack! 0 damage taken.`;
    }
  }
  // 4. POISON CARDS
  else if (cardName.includes('POISON')) {
    const stacks = cardName.includes('X2') ? 2 : 1;
    if (newDefenderState) {
      newDefenderState.poisonCount = (newDefenderState.poisonCount || 0) + stacks;
      log += ` Inflicted ${stacks} Poison card(s) on ${newDefenderState.name}.`;
    } else {
      newAttackerState.poisonCount = (newAttackerState.poisonCount || 0) + stacks;
      log += ` Attached ${stacks} Poison card(s) to self.`;
    }
  }
  // 5. ANTIDOTE & CLEANSE
  else if (cardName.includes('ANTIDOTE') || cardName.includes('CLEANSE')) {
    const removeCount = cardName.includes('FULL') || cardName.includes('CLEANSE') ? 99 : (cardName.includes('X2') ? 2 : 1);
    const beforeCount = newAttackerState.poisonCount || 0;
    newAttackerState.poisonCount = Math.max(0, beforeCount - removeCount);
    log += ` Antidote cleansed ${Math.min(beforeCount, removeCount)} Poison card(s).`;
    if (beforeCount >= 5 && newAttackerState.poisonCount < 5) {
      log += ` Cured from Zombie Mode! Returning to normal warrior form.`;
      newAttackerState.hp = newAttackerState.preZombieHp || 100;
    }
    if (cardName.includes('CLEANSE')) {
      newAttackerState.hp = Math.min(newAttackerState.maxHp || 100, newAttackerState.hp + 20);
    }
  }
  // 6. HEAL CARDS (Strictly capped at maxHp - cannot overheal)
  else if (cardName.includes('HEAL')) {
    let healAmount = 10;
    if (cardName.includes('H20')) healAmount = 20;
    else if (cardName.includes('H30')) healAmount = 30;
    else if (cardName.includes('H40')) healAmount = 40;
    
    const maxAllowed = newAttackerState.maxHp || 100;
    if (newAttackerState.hp >= maxAllowed) {
      log += ` HP already at maximum capacity (${maxAllowed} HP). Heal card used but cannot overheal.`;
    } else {
      newAttackerState.hp = Math.min(maxAllowed, newAttackerState.hp + healAmount);
      log += ` Restored +${healAmount} HP. (Current HP: ${newAttackerState.hp}/${maxAllowed})`;
    }
  }
  // 6b. VITALITY GAIN CARDS (Increases maxHp and allows HP to exceed 100)
  else if (cardName.includes('VITALITY')) {
    let vitAmount = 10;
    if (cardName.includes('V20')) {
      if ((newAttackerState.level || 1) < 2) {
        log += ` VITALITY GAIN V20 requires Character Level 2! (Current Level: ${newAttackerState.level || 1}).`;
        return { newAttackerState, newDefenderState, log };
      }
      vitAmount = 20;
    }
    newAttackerState.maxHp = (newAttackerState.maxHp || 100) + vitAmount;
    newAttackerState.hp += vitAmount;
    log += ` Vitality expanded Max HP by +${vitAmount}! (Current HP: ${newAttackerState.hp}/${newAttackerState.maxHp})`;
  }
  // 7. SHIELD CARDS
  else if (cardName.includes('SHIELD')) {
    let sValue = 25;
    if (cardName.includes('50HP')) sValue = 50;
    else if (cardName.includes('100HP')) sValue = 100;

    newAttackerState.shield = (newAttackerState.shield || 0) + sValue;
    log += ` Deployed +${sValue} Shield barrier.`;
  }
  // 8. DEFENSE CARDS
  else if (actionCard.type === 'DEFENSE') {
    newAttackerState.shield = (newAttackerState.shield || 0) + 15;
    log += ` Fortified defense (+15 temporary barrier).`;
  }
  // 9. SLEEPY CARDS
  else if (cardName.includes('SLEEPY')) {
    const sleepRounds = cardName.includes('X2') ? 2 : 1;
    if (newDefenderState) {
      newDefenderState.sleepTurns = (newDefenderState.sleepTurns || 0) + sleepRounds;
      log += ` 💤 Put ${newDefenderState.name} to sleep for ${sleepRounds} turn(s)!`;
    }
  }
  // 10. VISION CARDS
  else if (cardName.includes('VISION')) {
    if (newDefenderState) {
      log += ` 👁️ Vision activated! Revealing ${newDefenderState.name}'s Action Cards for 15 seconds.`;
    }
  }

  // Zombie State Transition Check
  if (newDefenderState && newDefenderState.poisonCount >= 5 && !isDefenderZombie) {
    newDefenderState.preZombieHp = newDefenderState.hp;
    newDefenderState.hp = 40;
    log += ` ⚠️ ${newDefenderState.name} reached 5 Poison cards and TRANSFORMED INTO A ZOMBIE (40 HP)!`;
  }
  if (newAttackerState.poisonCount >= 5 && !isAttackerZombie) {
    newAttackerState.preZombieHp = newAttackerState.hp;
    newAttackerState.hp = 40;
    log += ` ⚠️ ${newAttackerState.name} reached 5 Poison cards and TRANSFORMED INTO A ZOMBIE (40 HP)!`;
  }

  return { newAttackerState, newDefenderState, log };
};

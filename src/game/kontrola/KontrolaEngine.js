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
    retreatSpeed: 3,
    themeColor: '#ED1E24',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/CHYNA WILD CARD REG.png',
    attacks: {
      'FIRE OF FURY PER PUNCH': { ap: 5, dice: 1, element: 'Fire', desc: 'Roll 1 Die × 5 AP Fire damage.' },
      'FIRE TIGER SOUL PUNCH': { ap: 25, dice: 0, element: 'Fire', desc: 'Direct blazing strike dealing 25 AP.' },
      'GOLDEN MIC LIGHTING': { ap: 40, dice: 0, element: 'Lightning', isSuper: true, desc: 'Super Lightning strike dealing 40 AP.' },
      'KONTROL': { ap: 0, dice: 1, element: 'Psychic', isKontrol: true, desc: 'Roll 1d6 > target Mind Strength. Force attack alternate or steal 1 card (Rare, Max 2/match, 5-turn cooldown).' },
      'SAIGO NO BLITZ': { ap: 200, dice: 0, element: 'Energy', isBlitz: true, desc: 'Requires HP < 50. Sacrifice 50% HP to deal 200 AP AoE (Rare, Max 2/match).' }
    }
  },
  bee: {
    id: 'bee',
    name: 'Zabina "Bee" Solé',
    title: 'Queen of the Hive',
    maxHp: 70,
    mind: 5,
    element: 'Lightning',
    weakness: 'Magic/Poison',
    weaknessBonus: 10,
    innateDP: 10,
    retreatSpeed: 3,
    themeColor: '#FBC80D',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/BEE WILD CARD GOLD.png',
    attacks: {
      'STING SLAP PER STING': { ap: 3, dice: 1, element: 'Lightning', desc: 'Roll 1 Die × 3 AP Sting damage.' },
      'PAPARAZZI STUN': { ap: 25, dice: 0, element: 'Sonic', loseTurn: true, desc: '25 AP strike; target loses 1 turn.' },
      'BEE DRONE BOMB': { ap: 40, dice: 0, element: 'Lightning', isSuper: true, desc: 'Super Drone Bomb dealing 40 AP.' },
      'KONTROL': { ap: 0, dice: 1, element: 'Psychic', isKontrol: true, desc: 'Roll 1d6 > target Mind Strength. Force attack alternate or steal 1 card (Rare, Max 2/match, 5-turn cooldown).' },
      'SAIGO NO BLITZ': { ap: 200, dice: 0, element: 'Energy', isBlitz: true, desc: 'Requires HP < 50. Sacrifice 50% HP to deal 200 AP AoE (Rare, Max 2/match).' }
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
    retreatSpeed: 1,
    themeColor: '#FBC80D',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/KIKO WILD CARD GOLD.png',
    attacks: {
      'TAIL WHIP PER WHIP': { ap: 4, dice: 1, element: 'Physical', desc: 'Roll 1 Die × 4 AP Tail strikes.' },
      'MULTIPLICITY': { ap: 30, dice: 0, element: 'Sonic', desc: 'Sonic clones strike dealing 30 AP.' },
      'SOUL BLAST 3000': { ap: 40, dice: 0, element: 'Energy', isSuper: true, desc: 'Super Soul Blast dealing 40 AP.' },
      'KONTROL': { ap: 0, dice: 1, element: 'Psychic', isKontrol: true, desc: 'Roll 1d6 > target Mind Strength. Force attack alternate or steal 1 card (Rare, Max 2/match, 5-turn cooldown).' },
      'SAIGO NO BLITZ': { ap: 200, dice: 0, element: 'Energy', isBlitz: true, desc: 'Requires HP < 50. Sacrifice 50% HP to deal 200 AP AoE (Rare, Max 2/match).' }
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
    retreatSpeed: 1,
    themeColor: '#FBC80D',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/KAT WILD CARD GOLD.png',
    attacks: {
      'SAVAGE PAWS PER STRIKE': { ap: 5, dice: 1, element: 'Physical', desc: 'Roll 1 Die × 5 AP Paw strikes.' },
      'SHADOW PURR': { ap: 30, dice: 0, element: 'Shadow', healsAttacker: 15, appliesSleep: true, desc: 'Restores +15 HP to attacker and puts opponent to sleep for 1 turn.' },
      'CLAW OF FATE': { ap: 35, dice: 0, element: 'Shadow', desc: 'Critical shadow slash dealing 35 AP.' },
      'KONTROL': { ap: 0, dice: 1, element: 'Psychic', isKontrol: true, desc: 'Roll 1d6 > target Mind Strength. Force attack alternate or steal 1 card (Rare, Max 2/match, 5-turn cooldown).' },
      'SAIGO NO BLITZ': { ap: 200, dice: 0, element: 'Energy', isBlitz: true, desc: 'Requires HP < 50. Sacrifice 50% HP to deal 200 AP AoE (Rare, Max 2/match).' }
    }
  },
  poochi: {
    id: 'poochi',
    name: 'Poochi',
    title: 'The Celestial Canine',
    maxHp: 70,
    mind: 2,
    element: 'Magic',
    weakness: 'Magic/Poison',
    weaknessBonus: 10,
    innateDP: 10,
    retreatSpeed: 1,
    themeColor: '#ff66cc',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/POOCHI WILD CARD GOLD.png',
    attacks: {
      'GLITTER SPARKS PER SPARK': { ap: 4, dice: 1, element: 'Magic', desc: 'Roll 1 Die × 4 AP Glitter sparks.' },
      'LASSO OF TRUTH': { ap: 25, dice: 0, element: 'Magic', revealCards: true, desc: '25 AP strike; target reveals Action Cards.' },
      'GLITTER BURST': { ap: 35, dice: 0, element: 'Magic', desc: 'Magical glitter explosion dealing 35 AP.' },
      'KONTROL': { ap: 0, dice: 1, element: 'Psychic', isKontrol: true, desc: 'Roll 1d6 > target Mind Strength. Force attack alternate or steal 1 card (Rare, Max 2/match, 5-turn cooldown).' },
      'SAIGO NO BLITZ': { ap: 200, dice: 0, element: 'Energy', isBlitz: true, desc: 'Requires HP < 50. Sacrifice 50% HP to deal 200 AP AoE (Rare, Max 2/match).' }
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
    retreatSpeed: 4,
    themeColor: '#FBC80D',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/QUEENY WILD CARD GOLD.png',
    attacks: {
      'HAIR WHIP PER WHIP': { ap: 4, dice: 1, element: 'Physical', desc: 'Roll 1 Die × 4 AP Hair whip strikes.' },
      'SIREN BLAST': { ap: 30, dice: 0, element: 'Psychic', desc: 'Hypnotic siren wave dealing 30 AP.' },
      'RAINBOW FAN BLAST': { ap: 35, dice: 0, element: 'Psychic', desc: 'Prismatic fan blast dealing 35 AP.' },
      'KONTROL': { ap: 0, dice: 1, element: 'Psychic', isKontrol: true, desc: 'Roll 1d6 > target Mind Strength (+2 bonus). Force attack alternate or steal 1 card (Rare, Max 2/match, 5-turn cooldown).' },
      'SAIGO NO BLITZ': { ap: 200, dice: 0, element: 'Energy', isBlitz: true, desc: 'Requires HP < 50. Sacrifice 50% HP to deal 200 AP AoE (Rare, Max 2/match).' }
    }
  },
  shroomy: {
    id: 'shroomy',
    name: 'Shroomy',
    title: 'The Spore Alchemist',
    maxHp: 65,
    mind: 2,
    element: 'Nature',
    weakness: 'Fire',
    weaknessBonus: 10,
    innateDP: 10,
    retreatSpeed: 1,
    themeColor: '#39ff14',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/SHROOMY WILD CARD GOLD.png',
    attacks: {
      'POPPERS PER POP': { ap: 4, dice: 1, element: 'Nature', desc: 'Roll 1 Die × 4 AP Spore poppers.' },
      'MS BOMBA': { ap: 40, dice: 0, element: 'Fire', desc: 'Explosive spore bomb dealing 40 AP.' },
      'SOUL SNATCHER': { ap: 50, dice: 0, element: 'Dark', isSuper: true, desc: 'Super Soul Snatcher dealing 50 AP.' },
      'KONTROL': { ap: 0, dice: 1, element: 'Psychic', isKontrol: true, desc: 'Roll 1d6 > target Mind Strength. Force attack alternate or steal 1 card (Rare, Max 2/match, 5-turn cooldown).' },
      'SAIGO NO BLITZ': { ap: 200, dice: 0, element: 'Energy', isBlitz: true, desc: 'Requires HP < 50. Sacrifice 50% HP to deal 200 AP AoE (Rare, Max 2/match).' }
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
  { name: 'BOOMERANG FULL', type: 'DEFENSE', count: 6, costET: 0, desc: 'Defender reactive card: On successful defense or 6+ roll, reflects 100% attack damage back to attacker.' },
  { name: 'HEAL H20', type: 'HEAL', count: 6, costET: 0, desc: 'Restores +20 HP.' },
  { name: 'LIGHTNING X2', type: 'ATTACK', count: 6, costET: 2, desc: 'Heavy lightning dealing -20 HP and -2 turns.' },
  { name: 'MISDIRECT', type: 'ATTACK', count: 6, costET: 1, desc: 'Redirect an opponent attack.' },
  { name: 'POISON X2', type: 'STATUS', count: 6, costET: 0, desc: 'Inflicts 2 Poison stacks (-20 HP/turn).' },
  { name: 'REVIVE', type: 'HEAL', count: 6, costET: 0, desc: 'Brings player back to life with 50% HP.' },
  { name: 'SLEEPY X1', type: 'OTHERS', count: 6, costET: 0, desc: 'Target falls asleep and skips 1 turn.' },
  { name: 'VISION X1', type: 'OTHERS', count: 6, costET: 0, desc: 'Target reveals Action Cards for 15s.' },
  { name: 'FREEZE X1', type: 'STATUS', count: 6, costET: 0, desc: 'Target loses 1 turn and -2 dice penalty.' },
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
// NOTE: KONTROL (count: 2) and SAIGO NO BLITZ (count: 2) are CHARACTER ABILITIES, not in standard action card decks
// They are activated through character card moves, not as action cards
// These cards are listed in the CSV but should not be shuffled into the deck
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
  { name: 'VAMPIRE LIFE STEAL', type: 'OTHERS', count: 1, costET: 1, desc: 'Steals 1 ET and 10 HP for 3 turns.' },
  { name: 'DRAIN', type: 'OTHERS', count: 2, costET: 1, desc: 'Steals all opponent Energy Tokens.' },
  { name: 'VITALITY GAIN V30', type: 'HEAL', count: 2, costET: 0, desc: '+30 HP vitality surge.' },
  { name: 'HEAL H40', type: 'HEAL', count: 2, costET: 0, desc: 'Restores +40 HP.' },
  { name: '+DEFENCE D20', type: 'DEFENSE', count: 4, costET: 0, desc: '+20 Defense points.' },
  { name: 'X-CHANGE FULL', type: 'OTHERS', count: 2, costET: 0, desc: 'Exchange cards with all opponents.' },
  { name: 'FIRE INFERNO LOCK', type: 'ATTACK', count: 1, costET: 1, desc: 'Burns with spreading flames (-20 HP, spreads to neighbors, must roll doubles to extinguish, -5 HP/turn).' },
  { name: 'ANIME EXPRESS TV', type: 'FLYER', count: 1, costET: 0, desc: 'Avoid any weaknesses while defending for one turn.' }
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

// Trading system for Soul Alliance
export const tradeWithAlly = (traderState, recipientState, tradeData) => {
  if (!traderState.allianceId || traderState.allianceId !== recipientState.id) {
    return { success: false, log: 'No Soul Alliance exists between these players.' };
  }

  if (!tradeData) {
    return { success: false, log: 'Invalid trade data.' };
  }

  let log = '';
  const updatedTrader = { ...traderState };
  const updatedRecipient = { ...recipientState };

  // Trade REVIVE card
  if (tradeData.type === 'REVIVE') {
    // Check if trader has REVIVE card in hand
    const reviveIndex = updatedTrader.actionCardsHand?.findIndex(c => c.name.includes('REVIVE'));
    if (reviveIndex === -1 || reviveIndex === undefined) {
      return { success: false, log: `${updatedTrader.name} does not have a REVIVE card to trade.` };
    }

    // Transfer REVIVE card from trader to recipient
    const reviveCard = updatedTrader.actionCardsHand[reviveIndex];
    updatedTrader.actionCardsHand.splice(reviveIndex, 1);
    updatedRecipient.actionCardsHand = updatedRecipient.actionCardsHand || [];
    updatedRecipient.actionCardsHand.push(reviveCard);

    log = `🤝 REVIVE TRADE: ${updatedTrader.name} traded REVIVE card to ${updatedRecipient.name}!`;
    return { success: true, log, updatedTrader, updatedRecipient };
  }

  // Trade Energy Tokens
  if (tradeData.type === 'ENERGY_TOKENS' && typeof tradeData.amount === 'number') {
    const amount = Math.max(0, tradeData.amount);

    if (updatedTrader.energyTokens < amount) {
      return { success: false, log: `${updatedTrader.name} does not have ${amount} Energy Tokens to trade.` };
    }

    // Transfer Energy Tokens
    updatedTrader.energyTokens -= amount;
    updatedRecipient.energyTokens = (updatedRecipient.energyTokens || 0) + amount;

    log = `⚡ ENERGY TOKEN TRADE: ${updatedTrader.name} traded ${amount} Energy Token${amount !== 1 ? 's' : ''} to ${updatedRecipient.name}!`;
    return { success: true, log, updatedTrader, updatedRecipient };
  }

  return { success: false, log: 'Invalid trade type.' };
};

export const generateDeck = (isPremium = false, playerCount = 2) => {
  const baseBlueprint = isPremium ? ACTION_CARDS_PREMIUM : ACTION_CARDS_BASIC;
  // Per official rules: SOUL ALLIANCE is only available in 3+ player matches.
  // ABANDON can only be used when in a Soul Alliance, so both are excluded in 2-player games.
  const isTwoPlayer = Number(playerCount) <= 2;
  const blueprint = isTwoPlayer
    ? baseBlueprint.filter(card => card.name !== 'SOUL ALLIANCE' && card.name !== 'ABANDON')
    : baseBlueprint;

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
export const resolveTurn = (actionCard, attackerChar, attackerState, defenderState, attackSelectionName = null, precalculatedRolls = null, gameState = null) => {
  if (!actionCard) {
    return { log: 'Combat error: no action card provided.', newAttackerState: attackerState, newDefenderState: defenderState };
  }
  
  // Helper function to calculate shield damage absorption
  const calculateShieldDamage = (incomingDamage, shieldHP) => {
    // Shield reduces damage by its remaining HP, then breaks if depleted
    const damageToShield = Math.min(incomingDamage, shieldHP);
    const remainingDamage = Math.max(0, incomingDamage - damageToShield);
    const shieldHPAfter = Math.max(0, shieldHP - damageToShield);
    const shieldBroken = shieldHPAfter === 0;
    
    return {
      damageToShield,
      remainingDamage,
      shieldHPAfter,
      shieldBroken
    };
  };
  
  const cardName = (typeof actionCard === 'string' ? actionCard : (actionCard?.name || '')).toUpperCase();
  const cardType = (typeof actionCard === 'object' && actionCard?.type) ? actionCard.type : (
    ['ATTACK', 'LIGHTNING', 'FIRE', 'BACK STAB', 'VAMPIRE', 'DRAIN'].some(kw => cardName.includes(kw)) ? 'ATTACK' : 'OTHERS'
  );
  let log = `${attackerState.name} played ${typeof actionCard === 'string' ? actionCard : (actionCard?.name || 'Action Card')}.`;
  let damage = 0;
  let heal = 0;
  let shieldGain = 0;
  let aoeDamage = 0;
  let aoeSplitDamage = false;
  let stealActionCard = false;

  let newAttackerState = { ...attackerState };
  let newDefenderState = defenderState ? { ...defenderState } : null;

  // Dice Rolls
  const attackerRoll = precalculatedRolls?.attackerRoll || rollDice(2);
  const defenderRoll = precalculatedRolls?.defenderRoll || rollDice(2);
  const kRoll = precalculatedRolls?.kRoll || rollDice(1);
  const dRoll = precalculatedRolls?.dRoll || rollDice(1);

  // Process Defender's Played Card (if any) during Preparation Window
  const defCard = precalculatedRolls?.defenseCard;
  if (defCard && newDefenderState) {
    const dName = (typeof defCard === 'string' ? defCard : (defCard?.name || '')).toUpperCase();
    log += ` [Defender played ${typeof defCard === 'string' ? defCard : (defCard?.name || 'Defense Card')}]`;
    if (dName.includes('SHIELD')) {
      const gain = dName.includes('100HP') || dName.includes('ADVANCE') ? 100
                 : dName.includes('50HP')  || dName.includes('FIRE')    ? 50
                 : 20;
      newDefenderState.shield = (newDefenderState.shield || 0) + gain;
      // SHIELD FIRE grants fire immunity for this hit
      if (dName.includes('FIRE')) newDefenderState.immuneFire = true;
    } else if (dName.includes('BOOMERANG')) {
      newDefenderState.hasBoomerang = true;
    } else if (dName.includes('DODGE')) {
      newDefenderState.hasDodge = true;
      newDefenderState.dodgeCardName = defCard.name; // Track which DODGE card for later resolution
    } else if (dName.includes('COUNTER')) {
      // covers DEFENCE - COUNTER and DODGE - COUNTER
      newDefenderState.hasCounter = true;
    } else if (dName.includes('FULL GUARD')) {
      newDefenderState.shield = (newDefenderState.shield || 0) + 50;
    } else if (dName.includes('DEFENCE') || dName.includes('+DEFENCE')) {
      // e.g. +DEFENCE D20, DEFENCE - BASIC, etc.
      const bonus = dName.includes('D20') ? 20 : 15;
      newDefenderState.hasDefendBasic = true;
      newDefenderState.shield = (newDefenderState.shield || 0) + bonus;
    } else if (dName.includes('ANIME EXPRESS') || dName.includes('FLYER')) {
      // ANIME EXPRESS TV: No Weakness Shield for one turn
      newDefenderState.flyerNoWeakness = true;
      log += ` 📺 ANIME EXPRESS TV played! ${newDefenderState.name} is immune to weaknesses for this turn!`;
    }
  }

  const isAttackerZombie = newAttackerState.poisonCount >= 5;
  const isDefenderZombie = newDefenderState?.poisonCount >= 5;

  // 1. KONTROL CARD
  if (cardName.includes('KONTROL') && newDefenderState) {
    // Check cooldown
    if (newAttackerState.kontrolCooldown > 0) {
      log += ` ⏸️ KONTROL on cooldown! ${newAttackerState.kontrolCooldown} more turn(s) before available.`;
      return { newAttackerState, newDefenderState, log };
    }

    // Check usage limit
    if (newAttackerState.kontrolUsesLeft <= 0) {
      log += ` ⏸️ KONTROL limit reached for this match (Max 2/match)!`;
      return { newAttackerState, newDefenderState, log };
    }

    if (isDefenderZombie) {
      log += ` ⏸️ Kontrol fails! Zombies are mindless and cannot be controlled.`;
      newAttackerState.kontrolUsesLeft = Math.max(0, newAttackerState.kontrolUsesLeft - 1);
      newAttackerState.kontrolCooldown = 5;
      return { newAttackerState, newDefenderState, log };
    } else {
      // Official Rule: Controller rolls 1d6 and must roll HIGHER than opponent's Mind Strength
      // If tie, re-roll (best of 3)
      // Queeny has +2 bonus to rolls, Magical creatures have +1 to their Mind Strength defense
      
      let controllerRoll = kRoll.total;
      let targetMindStrength = newDefenderState.mind || 3;
      
      // Apply Queeny +2 psychic bonus if attacker is Queeny
      if (newAttackerState.characterId === 'queeny') {
        controllerRoll += 2;
        log += ` 🧠 Queeny's +2 Psychic Bonus applied!`;
      }
      
      // Apply +1 Mind defense for magical creatures
      if (['kiko', 'poochi', 'shroomy'].includes(newDefenderState.characterId)) {
        targetMindStrength += 1;
        log += ` 🧠 Magical creature +1 Mind defense applied!`;
      }
      
      let rollCount = 1;
      let success = false;
      let finalRoll = controllerRoll;
      
      log += ` 🎲 Kontrol Roll ${rollCount}: Controller rolled ${controllerRoll} vs Mind Strength ${targetMindStrength}.`;
      
      // Handle ties with re-rolls (best of 3)
      while (rollCount < 3 && controllerRoll === targetMindStrength) {
        log += ` 🎲 TIE detected! Re-rolling...`;
        rollCount++;
        const newKRoll = rollDice(1);
        controllerRoll = newKRoll.total;
        if (newAttackerState.characterId === 'queeny') controllerRoll += 2;
        finalRoll = controllerRoll;
        log += ` 🎲 Kontrol Roll ${rollCount}: Controller rolled ${controllerRoll} vs Mind Strength ${targetMindStrength}.`;
      }
      
      // Check if controller won (rolled higher than Mind Strength)
      if (finalRoll > targetMindStrength) {
        log += ` ✅ Kontrol SUCCESS! ${controllerRoll} > ${targetMindStrength}! ${newDefenderState.name} is mind-controlled!`;
        success = true;
      } else {
        log += ` ❌ Kontrol FAILED! ${controllerRoll} ≤ ${targetMindStrength}. ${newDefenderState.name} resisted mind control!`;
        success = false;
      }

      // Decrement usage counter and set cooldown (always, even on failure)
      newAttackerState.kontrolUsesLeft = Math.max(0, newAttackerState.kontrolUsesLeft - 1);
      newAttackerState.kontrolCooldown = 5; // 5-turn cooldown per official rules
      
      // KONTROL Options: Choose to force alternate target OR steal 1 action card (only if successful)
      if (success) {
        const choice = Math.random() > 0.5 ? 'A' : 'B';
        if (choice === 'A') {
          // Option A: Opponent must attack another player next turn
          newDefenderState.kontrolForceAlternateTarget = true;
          log += ` 🧠 KONTROL OPTION A: ${newDefenderState.name} MUST attack another player next turn!`;
        } else {
          // Option B: Steal 1 random Action Card from opponent
          stealActionCard = true;
          log += ` 🧠 KONTROL OPTION B: Steal Action Card activated!`;
        }
      }
    }
    
    // Return early since Kontrol doesn't deal damage
    return { newAttackerState, newDefenderState, log };
  }
  // 2. SAIGO NO BLITZ (200 AP)
  else if (cardName.includes('BLITZ')) {
    // Official Rule: Requires HP < 50 AND 5 Energy Tokens
    
    // Check cooldown
    if (newAttackerState.blitzCooldown > 0) {
      log += ` ⚡ BLITZ on cooldown! ${newAttackerState.blitzCooldown} more turn(s) before available.`;
      return { newAttackerState, newDefenderState, log };
    }

    // Check usage limit (Max 2 per match)
    if (newAttackerState.blitzUsesLeft <= 0) {
      log += ` ⚡ BLITZ limit reached for this match (Max 2/match)!`;
      return { newAttackerState, newDefenderState, log };
    }

    // Check HP requirement (must be < 50)
    if (newAttackerState.hp >= 50) {
      log += ` ⚡ BLITZ requires HP < 50! Current HP: ${newAttackerState.hp}. Cannot activate.`;
      return { newAttackerState, newDefenderState, log };
    }

    // Check ET requirement (requires 5 ET)
    if (newAttackerState.energyTokens < 5) {
      log += ` ⚡ BLITZ requires 5 Energy Tokens! You have ${newAttackerState.energyTokens} ET. Cannot activate.`;
      return { newAttackerState, newDefenderState, log };
    }

    // Deduct 5 ET cost
    newAttackerState.energyTokens = Math.max(0, newAttackerState.energyTokens - 5);
    
    // Sacrifice 50% of current HP
    const selfSacrifice = Math.floor(newAttackerState.hp * 0.5);
    newAttackerState.hp = Math.max(1, newAttackerState.hp - selfSacrifice);
    
    // Blitz deals 200 AP damage
    const blitzDamage = 200;
    
    // Decrement usage counter (limited to 2 uses per match)
    newAttackerState.blitzUsesLeft = Math.max(0, newAttackerState.blitzUsesLeft - 1);
    // No cooldown per official rules, but limited to 2 uses total per match
    
    if (newDefenderState) {
      // One vs. One: Single target takes full 200 AP
      newDefenderState.hp = Math.max(0, newDefenderState.hp - blitzDamage);
      log += ` ⚡ SAIGO NO BLITZ unleashed! ${newAttackerState.name} sacrificed ${selfSacrifice} HP and dealt 200 AP to ${newDefenderState.name}!`;
    } else {
      // One vs. All: 200 AP is split equally among all defending players
      log += ` ⚡ SAIGO NO BLITZ unleashed! ${newAttackerState.name} sacrificed ${selfSacrifice} HP and released 200 AP Area-of-Effect blast!`;
      aoeDamage = 200; // Send to UI with splitting flag
      aoeSplitDamage = true; // Flag to indicate damage should be split equally
    }
  }
  // 3. ATTACK CARDS (With Character Combat Moves or Standalone Elemental Spells)
  else if (cardType === 'ATTACK') {
    if (cardName === 'BOOMERANG FULL') {
      newAttackerState.hasBoomerang = true;
      log += ` Boomerang Trap set! Next successful attack against you will be reflected 100%.`;
      return { newAttackerState, newDefenderState, log };
    } else if (cardName === 'MISDIRECT') {
      // NOTE: MISDIRECT is documented as an active response card (defender plays during opponent's attack)
      // Current implementation treats it as a passive trap set by attacker
      // TODO: Redesign as active response during attack phase when response mechanics are implemented
      newAttackerState.hasMisdirect = true;
      log += ` ⚠️ MISDIRECT set! (Note: Redesign needed - should be defender response card per documentation)`;
      return { newAttackerState, newDefenderState, log };
    }

    let baseAP = 15;
    let attackElement = 'Physical';

    if (cardName.includes('LIGHTNING')) {
      baseAP = cardName.includes('X2') ? 20 : 10;
      attackElement = 'Lightning';
      log += ` [${cardName}: Elemental Lightning strike dealing ${baseAP} AP]`;
    } else if (cardName.includes('FIRE FLAME')) {
      const isX2 = cardName.includes('X2');
      baseAP = isX2 ? 20 : 10;
      const failurePenalty = isX2 ? 20 : 10;
      attackElement = 'Fire';
      
      // Check if attacker rolled doubles
      const rolledDoubles = attackerRoll.rolls[0] === attackerRoll.rolls[1];
      
      if (!rolledDoubles) {
        log += ` 🔥 FIRE FLAME failed (no doubles)! ${newAttackerState.name} takes ${failurePenalty} HP penalty!`;
        newAttackerState.hp = Math.max(0, newAttackerState.hp - failurePenalty);
        return { newAttackerState, newDefenderState, log };
      }
      
      log += ` [${cardName}: Rolled doubles! Elemental Fire strike dealing ${baseAP} AP]`;
    } else if (isAttackerZombie) {
      baseAP = 20; // Zombie Venom Strike
      attackElement = 'Poison';
    } else if (attackSelectionName) {
      const charKey = attackerChar?.id || attackerState?.id || 'chynaman';
      const template = KONTROLA_CHARACTERS[charKey] || Object.values(KONTROLA_CHARACTERS).find(c => c.name?.toLowerCase() === attackerChar?.name?.toLowerCase());
      const atk = attackerChar?.attacks?.[attackSelectionName] || template?.attacks?.[attackSelectionName];
      if (atk) {
        attackElement = atk.element || 'Physical';
        if (atk.dice > 0) {
          const multiplier = atk.ap;
          baseAP = (dRoll?.total || 1) * multiplier;
          log += ` [${attackSelectionName}: ${dRoll?.total || 1} × ${multiplier} AP = ${baseAP} AP]`;
        } else {
          baseAP = atk.ap;
        }
      }
    }

    // Clash Contest: Attacker 2 dice vs Defender 2 dice
    // Apply any dice penalties (e.g., from FREEZE cards)
    let adjustedAttackerRoll = attackerRoll.total;
    let adjustedDefenderRoll = defenderRoll.total;
    
    if (newDefenderState?.dicePenalty) {
      adjustedDefenderRoll = Math.max(0, adjustedDefenderRoll - newDefenderState.dicePenalty);
      log += ` ❄️ FREEZE penalty: -${newDefenderState.dicePenalty} to defender roll! (${defenderRoll.total} - ${newDefenderState.dicePenalty} = ${adjustedDefenderRoll})`;
      newDefenderState.dicePenalty = 0; // Penalty consumed for this clash
    }
    
    if (newAttackerState?.dicePenalty) {
      adjustedAttackerRoll = Math.max(0, adjustedAttackerRoll - newAttackerState.dicePenalty);
      log += ` ❄️ FREEZE penalty: -${newAttackerState.dicePenalty} to attacker roll! (${attackerRoll.total} - ${newAttackerState.dicePenalty} = ${adjustedAttackerRoll})`;
      newAttackerState.dicePenalty = 0; // Penalty consumed for this clash
    }
    
    const isClashTie = adjustedAttackerRoll === adjustedDefenderRoll;
    const atkWin = !isClashTie && adjustedAttackerRoll > adjustedDefenderRoll;
    log += ` Clash: Attacker ${adjustedAttackerRoll} vs Defender ${adjustedDefenderRoll}.`;

    if (isClashTie) {
      // Per the official rules: a tie means both must re-roll — the DiceRoller handles this UI-side.
      // We signal the tie back so the host does NOT resolve and the dice screen stays open for a re-roll.
      log += ` ⚔️ CLASH TIED (${attackerRoll.total} vs ${defenderRoll.total})! Both players must re-roll!`;
      return {
        newAttackerState: attackerState,
        newDefenderState: defenderState,
        log,
        isTie: true  // signal to the host engine to not finalize — re-roll required
      };
    } else if (atkWin) {
      // DODGE BASIC: If defender has DODGE BASIC and attacker wins clash, attacker damage +25%
      // (attacker won the clash, so defender failed to evade)
      if (newDefenderState?.hasDodge && newDefenderState.dodgeCardName?.includes('BASIC')) {
        log += ` 💨 DODGE BASIC failed! ${newDefenderState.name} couldn't evade. Attacker's damage +25%!`;
        baseAP = Math.floor(baseAP * 1.25);
        newDefenderState.hasDodge = false; // Consume the dodge
      }
      
      let finalDamage = baseAP;

      if (cardName === 'DRAIN') {
        if (newDefenderState) {
          const stolen = newDefenderState.energyTokens || 0;
          newDefenderState.energyTokens = 0;
          newAttackerState.energyTokens = (newAttackerState.energyTokens || 0) + stolen;
          log += ` DRAIN successful! Stole ${stolen} Energy Tokens from ${newDefenderState.name}.`;
        }
        finalDamage = 0; // Handled directly above
      } else if (cardName === 'BACK STAB') {
        // BACK STAB: Only available in 3+ player mode with Soul Alliance active
        // Per official rules: "Back Stab is only used when Soul Alliance is available 3+ players"
        const playerCount = gameState?.players?.length || 2;
        if (playerCount <= 2) {
          log += ` ⚔️ BACK STAB cannot be used! This card is only available in 3+ player matches (currently ${playerCount} players).`;
          return { newAttackerState, newDefenderState, log, cardBlocked: true };
        }
        
        // Back stab bypasses shields and basic defenses
        if (newDefenderState) {
          newDefenderState.shield = 0; // Bypass shield
          newDefenderState.hasDefendBasic = false; // Bypass basic defense
          finalDamage = 25; // High damage attack (2.5x normal attack)
          log += ` ⚔️ BACK STAB hit! Bypassed all defenses for ${finalDamage} AP damage!`;
        }
      } else if (cardName === 'VAMPIRE LIFE STEAL') {
        // VAMPIRE LIFE STEAL: Per official rules, steals 1 ET + 10 HP for 3 turns, but only 1 attack per card use
        if (newDefenderState) {
          const stolenHp = Math.min(10, newDefenderState.hp);
          const stolenEt = Math.min(1, newDefenderState.energyTokens || 0);
          newDefenderState.hp = Math.max(0, newDefenderState.hp - stolenHp);
          newDefenderState.energyTokens = Math.max(0, (newDefenderState.energyTokens || 0) - stolenEt);
          newAttackerState.hp = Math.min(newAttackerState.maxHp || 100, newAttackerState.hp + stolenHp);
          newAttackerState.energyTokens = (newAttackerState.energyTokens || 0) + stolenEt;
          log += ` 🧛 VAMPIRE LIFE STEAL hit! Stole ${stolenHp} HP and ${stolenEt} ET.`;
          
          // Apply 3-turn duration to defender for continued drain effect (not additional attacks)
          newDefenderState.vampireStealStack = (newDefenderState.vampireStealStack || 0) + 1;
          newDefenderState.vampireStealTurnsLeft = 3;
          newDefenderState.vampireAttackerId = newAttackerState.id || attackerChar?.id || null;
          newDefenderState.vampireStealActivated = true; // Flag to prevent multiple hits
          log += ` 🧛 VAMPIRE effect applied for 3 turns! Attacker gains +10 HP/turn and +1 ET/turn.`;
        }
        finalDamage = 0; // Handled directly above
      } else if (cardName === 'FIRE INFERNO LOCK') {
        // FIRE INFERNO LOCK: -20 HP, apply burn, spreads to neighbors
        if (newDefenderState) {
          finalDamage = 20;
          newDefenderState.burnCount = (newDefenderState.burnCount || 0) + 1;
          log += ` 🔥🔥 FIRE INFERNO LOCK! Deal 20 AP and applied burn status! Must roll doubles each turn to extinguish.`;
        }
      }

      // TRAP CONSUMPTION
      if (newDefenderState && finalDamage > 0) {
        // SHIELD FIRE immunity: if defender played SHIELD FIRE, fire attacks deal 0 damage & no burn
        if (newDefenderState.immuneFire && cardName.includes('FIRE FLAME')) {
          log += ` 🔥🚫 SHIELD FIRE IMMUNITY! ${newDefenderState.name} is immune to Fire damage this hit!`;
          finalDamage = 0;
          newDefenderState.immuneFire = false;
        } else if (newDefenderState.hasMisdirect) {
          // MISDIRECT: Try to redirect attack to random other player or fail with -20 HP penalty
          const redirectSuccess = Math.random() > 0.4; // 60% chance to redirect
          
          if (redirectSuccess) {
            log += ` 🔀 MISDIRECT TRIGGERED! Attack redirected!`;
            // Attack is negated for original defender
            finalDamage = 0;
          } else {
            log += ` ❌ MISDIRECT FAILED! ${newAttackerState.name} takes -20 HP penalty!`;
            newAttackerState.hp = Math.max(0, newAttackerState.hp - 20);
          }
          newDefenderState.hasMisdirect = false;
        } else if (newDefenderState.hasDodge) {
          // Check which DODGE card was used
          const dodgeCardName = newDefenderState.dodgeCardName || 'DODGE - FULL GUARD';
          
          if (dodgeCardName.includes('FULL GUARD')) {
            // DODGE FULL GUARD: Requires doubles to evade completely
            const rolledDoubles = defenderRoll.rolls && defenderRoll.rolls[0] === defenderRoll.rolls[1];
            const isBlitzActive = newAttackerState.isBlitzActive || false;
            
            if (rolledDoubles) {
              log += ` 💨 DODGE FULL GUARD SUCCESS! Rolled doubles, evaded all damage!`;
              finalDamage = 0;
            } else if (isBlitzActive) {
              log += ` 💨 DODGE FULL GUARD partially successful vs Blitz (50% damage reduction)!`;
              finalDamage = Math.floor(finalDamage * 0.5);
            } else {
              log += ` ❌ DODGE FULL GUARD failed (no doubles), taking full damage!`;
            }
          } else if (dodgeCardName.includes('BASIC')) {
            // DODGE BASIC: Check clash result - if won clash, evade. If lost clash, attacker damage +25%
            // This is a passive defense card - it acts during clash, not during trap phase
            // Will be handled in clash validation section below
            log += ` 💨 DODGE BASIC triggered! Clash already determined outcome above.`;
          }
          newDefenderState.hasDodge = false;
        } else if (newDefenderState.hasBoomerang) {
          if (defenderRoll.total >= 6) {
            log += ` 🪃 BOOMERANG TRIGGERED! ${newDefenderState.name} rolled ${defenderRoll.total} (6+)! ${newAttackerState.name}'s attack reflected 100% back and loses next turn!`;
            newAttackerState.hp = Math.max(0, newAttackerState.hp - finalDamage);
            newAttackerState.sleepTurns = (newAttackerState.sleepTurns || 0) + 1;  // Attacker loses next turn
            finalDamage = 0;
          } else {
            log += ` 🪃 BOOMERANG FAILED! ${newDefenderState.name} rolled ${defenderRoll.total} (needed 6+). Trap breaks, taking full damage.`;
          }
          newDefenderState.hasBoomerang = false;
        } else if (newDefenderState.hasCounter) {
          const reflectDmg = Math.floor(finalDamage * 0.25);
          log += ` ⚔️ COUNTER TRIGGERED! 0% damage taken, reflected ${reflectDmg} AP back!`;
          newAttackerState.hp = Math.max(0, newAttackerState.hp - reflectDmg);
          finalDamage = 0;
          newDefenderState.hasCounter = false;
        } else if (newDefenderState.hasDefendBasic) {
          const absorb = Math.floor(finalDamage * 0.25);
          log += ` 🛡️ DEFENSIVE GUARD TRIGGERED! Damage reduced by 25% (${absorb} AP).`;
          finalDamage = Math.max(0, finalDamage - absorb);
          newDefenderState.hasDefendBasic = false;
        }

        // Apply Burn Status if Fire Flame (only if damage got through)
        if (cardName.includes('FIRE FLAME') && finalDamage > 0) {
          newDefenderState.burnCount = (newDefenderState.burnCount || 0) + 1;
          log += ` Defender was BURNED! (+1 stack)`;
        }
      }

      // Weakness Bonus (+10 or +15 AP)
      if (newDefenderState && attackElement && newDefenderState.weakness) {
        const matchesWeakness = newDefenderState.weakness.toLowerCase().includes(attackElement.toLowerCase());
        if (matchesWeakness) {
          const bonus = newDefenderState.weaknessBonus || 10;
          finalDamage += bonus;
          log += ` WEAKNESS TRIGGER! +${bonus} AP bonus!`;
        }
      }

      // +DEFENCE PRIORITY: These cards should be FIRST priority per official rules
      // If defender has +DEFENCE card, apply its bonus BEFORE innate DP
      if (newDefenderState?.shield > 0) {
        const absorbed = Math.min(newDefenderState.shield, finalDamage);
        newDefenderState.shield -= absorbed;
        finalDamage -= absorbed;
        log += ` +DEFENCE CARD ACTIVE! Shield absorbed ${absorbed} damage.`;
      }

      // Innate Defense: Only applies if defender rolled 6+ AND no +DEFENCE card was used
      // Per official rules: "+DEFENCE Cards should be FIRST priority. Whatever the card says is what you go by, if the defender wins.
      // If the defender does not win, but receives 6+ on their dice roll. This will activate their Basic Defense available."
      if (defenderRoll.total >= 6 && !newDefenderState?.hasDefendBasic) {
        const innateDP = newDefenderState?.innateDP ?? newDefenderState?.defaultDP ?? 10;
        finalDamage = Math.max(0, finalDamage - innateDP);
        log += ` Defender rolled ${defenderRoll.total} (6+)! Innate DP reduced damage by ${innateDP}!`;
      }

      // Shield Absorption (Standard shield - only if no +DEFENCE was used above)
      // This is now handled by the +DEFENCE priority section above
      // Keeping this check only for shields that weren't set as +DEFENCE
      if (newDefenderState?.shield > 0 && !newDefenderState?.hasDefendBasic) {
        const absorbed = Math.min(newDefenderState.shield, finalDamage);
        newDefenderState.shield -= absorbed;
        finalDamage -= absorbed;
        log += ` Additional shield absorbed ${absorbed} damage.`;
      }

      // Apply damage to defender
      if (newDefenderState) {
        newDefenderState.hp = Math.max(0, newDefenderState.hp - finalDamage);
        log += ` Attack lands! ${newDefenderState.name} takes ${finalDamage} damage (Base: ${baseAP} AP` +
          (newDefenderState.weakness && attackElement && newDefenderState.weakness.toLowerCase().includes(attackElement.toLowerCase()) ? ` + Weakness` : '') +
          (defenderRoll.total >= 6 && !newDefenderState?.hasDefendBasic ? ` - Innate DP` : '') + `).`;

        // If Zombie is hit by Fire or Lightning -> removes 1 poison card
        if (isDefenderZombie && ['Fire', 'Lightning'].includes(attackElement)) {
          newDefenderState.poisonCount = Math.max(0, newDefenderState.poisonCount - 1);
          log += ` Fire/Lightning cleansed 1 Poison card from Zombie!`;
          if (newDefenderState.poisonCount < 5) {
            newDefenderState.hp = newDefenderState.preZombieHp || 100;
            log += ` 🌟 ${newDefenderState.name} was cleansed of Zombie curse and restored to human form!`;
          }
        }

        // If Attacker was Zombie Venom Strike -> Defender gains 1 Poison Card
        if (isAttackerZombie && !isDefenderZombie) {
          newDefenderState.poisonCount = (newDefenderState.poisonCount || 0) + 1;
          log += ` Venom Strike infected ${newDefenderState.name} with 1 Poison card!`;
        }

        // Apply Burn Status if Fire Flame X1 or X2
        if (cardName === 'FIRE FLAME X1' || cardName === 'FIRE FLAME X2') {
          const burnStacks = cardName === 'FIRE FLAME X2' ? 2 : 1;
          newDefenderState.burnCount = (newDefenderState.burnCount || 0) + burnStacks;
          log += ` 🔥 Applied ${burnStacks} Burn stack(s) to ${newDefenderState.name}!`;
        }
      }
    } else {
      // DODGE BASIC: If defender has DODGE BASIC and is defending, they succeed on clash win
      if (newDefenderState?.hasDodge && newDefenderState.dodgeCardName?.includes('BASIC')) {
        log += ` 💨 DODGE BASIC SUCCESS! ${newDefenderState.name} evaded all damage!`;
        newDefenderState.hasDodge = false; // Consume the dodge
      } else {
        log += ` Defender blocked or dodged the attack! 0 damage taken.`;
      }
    }

    // Lightning effect: ALWAYS applies whether attack succeeds or not per official rules
    // "This action occurs when the attack is successful and not successful"
    if (cardName.includes('LIGHTNING') && newDefenderState) {
      const skipTurns = cardName.includes('X2') ? 2 : 1;
      newDefenderState.sleepTurns = (newDefenderState.sleepTurns || 0) + skipTurns;
      log += ` ⚡ Lightning shock! ${newDefenderState.name} loses ${skipTurns} turn(s)!`;
      
      // LIGHTNING X1 / X2 removes 1 poison card from defender per official rules
      if (newDefenderState.poisonCount > 0) {
        const wasZombie = newDefenderState.poisonCount >= 5;
        newDefenderState.poisonCount = Math.max(0, newDefenderState.poisonCount - 1);
        log += ` ⚡ Lightning cleansed 1 Poison card from ${newDefenderState.name}!`;
        if (wasZombie && newDefenderState.poisonCount < 5) {
          newDefenderState.hp = newDefenderState.preZombieHp || 100;
          log += ` 🌟 ${newDefenderState.name} was cleansed of Zombie curse and restored to human form!`;
        }
      }
    }

    // Shadow Purr: Heals attacker + puts defender to sleep (only on successful hit)
    const isShadowPurr = attackSelectionName && attackSelectionName.toUpperCase().replace(/\s+/g, '').includes('SHADOWPURR');
    if (isShadowPurr && atkWin && newDefenderState) {
      newAttackerState.hp = Math.min(newAttackerState.maxHp || 100, newAttackerState.hp + 15);
      newDefenderState.sleepTurns = (newDefenderState.sleepTurns || 0) + 1;
      log += ` 😻 SHADOW PURR! ${newAttackerState.name} restored +15 HP and ${newDefenderState.name} falls asleep for 1 turn!`;
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
      log += ` Cured from Zombie Mode! Returning to normal player state.`;
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
    
    const maxAllowed = newAttackerState.poisonCount >= 5 ? 40 : (newAttackerState.maxHp || 100);
    if (newAttackerState.hp >= maxAllowed) {
      log += ` HP already at maximum capacity (${maxAllowed} HP). Heal card used but cannot overheal.`;
    } else {
      newAttackerState.hp = Math.min(maxAllowed, newAttackerState.hp + healAmount);
      log += ` Restored +${healAmount} HP. (Current HP: ${newAttackerState.hp}/${maxAllowed})`;
    }
  }
  // 6b. VITALITY GAIN CARDS (Increases maxHp and allows HP to exceed 100)
  else if (cardName.includes('VITALITY')) {
    if (newAttackerState.poisonCount >= 5) {
      log += ` Zombies cannot gain Vitality! The card has no effect on undead forms.`;
    } else {
      let vitAmount = 10;
      let requiredLevel = 1;
      let nextLevel = null;

      const currentLevel = (newAttackerState.hp >= 150 || (newAttackerState.level || 1) >= 2) ? 2 : 1;

      if (cardName.includes('V10')) {
        vitAmount = 10;
        // Vitality V10 is usable in Level 1 and Level 2
      } else if (cardName.includes('V20')) {
        vitAmount = 20;
        requiredLevel = 2;
        // Vitality V20 is for Level 2 (when player reaches 150 HP)
        if (currentLevel < requiredLevel) {
          log += ` ⚠️ Only available in level 2! VITALITY GAIN V20 requires reaching 150 HP (Level 2). Use Vitality V10 to level up first.`;
          return { newAttackerState, newDefenderState, log };
        }
      } else if (cardName.includes('V30')) {
        vitAmount = 30;
        requiredLevel = 3;
        if ((newAttackerState.level || 1) < requiredLevel && (newAttackerState.maxHp || 100) < 180) {
          log += ` ⚠️ Only available in level 3! VITALITY GAIN V30 requires Level 3.`;
          return { newAttackerState, newDefenderState, log };
        }
      } else if (cardName.includes('V40')) {
        vitAmount = 40;
        requiredLevel = 4;
        if ((newAttackerState.level || 1) < requiredLevel && (newAttackerState.maxHp || 100) < 200) {
          log += ` ⚠️ Only available in level 4! VITALITY GAIN V40 requires Level 4.`;
          return { newAttackerState, newDefenderState, log };
        }
      }

      // Apply vitality gain and level up
      newAttackerState.maxHp = (newAttackerState.maxHp || 100) + vitAmount;
      newAttackerState.hp += vitAmount;
      if (newAttackerState.hp >= 150 && (newAttackerState.level || 1) < 2) {
        newAttackerState.level = 2;
      }
      
      log += ` 🌟 Vitality expanded! Max HP +${vitAmount}. ${newAttackerState.name} leveled up to Level ${newAttackerState.level}! (Current HP: ${newAttackerState.hp}/${newAttackerState.maxHp})`;
    }
  }
  // 6c. REVIVE CARD (Bring defeated player back into game)
  else if (cardName.includes('REVIVE')) {
    // Check if attacker is defeated
    if (newAttackerState.hp <= 0 || newAttackerState.isDefeated) {
      // Restore attacker to 50% of max HP (per official rules)
      const reviveHP = Math.floor((newAttackerState.maxHp || 100) * 0.5);
      newAttackerState.hp = Math.max(1, reviveHP);
      newAttackerState.isDefeated = false;
      log += ` ${newAttackerState.name} was REVIVED! Restored to ${reviveHP} HP (50% of max).`;
    } else {
      log += ` REVIVE card failed! ${newAttackerState.name} is not defeated. Card wasted.`;
    }
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
  else if (cardType === 'DEFENSE') {
    if (cardName.includes('D20')) {
      newAttackerState.shield = (newAttackerState.shield || 0) + 20;
      log += ` Fortified defense (+20 temporary barrier).`;
    } else if (cardName.includes('FULL GUARD') || cardName.includes('SHIELD ADVANCE') || cardName.includes('SHIELD FIRE') || cardName.includes('SHIELD SACRED')) {
      newAttackerState.shield = (newAttackerState.shield || 0) + 50;
      log += ` Ultimate Defense Barrier Activated (+50 temporary barrier).`;
    } else if (cardName.includes('DODGE')) {
      newAttackerState.hasDodge = true;
      log += ` Preparing to Evade! Next incoming attack will be completely dodged.`;
    } else if (cardName.includes('COUNTER')) {
      newAttackerState.hasCounter = true;
      log += ` Counter Stance! Next incoming attack will be negated and reflected by 25%.`;
    } else if (cardName.includes('BOOMERANG')) {
      newAttackerState.hasBoomerang = true;
      log += ` Boomerang Guard activated! Next incoming attack will be reflected 100% back to attacker.`;
    } else if (cardName.includes('BASIC')) {
      newAttackerState.hasDefendBasic = true;
      log += ` Defensive Guard. Next incoming damage reduced by 25%.`;
    } else {
      newAttackerState.shield = (newAttackerState.shield || 0) + 15;
      log += ` Fortified defense (+15 temporary barrier).`;
    }
  }
  // 9. SLEEPY & FREEZE CARDS
  else if (cardName.includes('SLEEPY') || cardName.includes('FREEZE')) {
    const sleepRounds = cardName.includes('X2') ? 2 : 1;
    const dicePenalty = cardName.includes('FREEZE') ? (cardName.includes('X2') ? 4 : 2) : 0;
    
    if (newDefenderState) {
      newDefenderState.sleepTurns = (newDefenderState.sleepTurns || 0) + sleepRounds;
      if (dicePenalty > 0) {
        newDefenderState.dicePenalty = (newDefenderState.dicePenalty || 0) + dicePenalty;
        log += ` ❄️ Put ${newDefenderState.name} to sleep for ${sleepRounds} turn(s)! Dice roll penalty: -${dicePenalty}`;
      } else {
        log += ` 💤 Put ${newDefenderState.name} to sleep for ${sleepRounds} turn(s)!`;
      }
    }
  }
  // 10. VISION CARDS
  else if (cardName.includes('VISION')) {
    if (cardName === 'VISION FULL') {
      log += ` 👁️ VISION FULL activated! All players reveal their Action Cards for 30 seconds.`;
    } else if (newDefenderState) {
      log += ` 👁️ Vision activated! Revealing ${newDefenderState.name}'s Action Cards for 15 seconds.`;
    }
  }
  // 10b. DRAIN CARD (Direct effect, steals all opponent ET)
  else if (cardName === 'DRAIN') {
    if (newDefenderState) {
      const stolen = newDefenderState.energyTokens || 0;
      newDefenderState.energyTokens = 0;
      newAttackerState.energyTokens = Math.min(10, (newAttackerState.energyTokens || 0) + stolen);
      log += ` ⚡ DRAIN successful! Stole all ${stolen} Energy Tokens from ${newDefenderState.name}!`;
    } else {
      log += ` ⚡ DRAIN played without target.`;
    }
  }
  // 10c. VAMPIRE LIFE STEAL (Steals 1 ET and 10 HP for 3 turns)
  else if (cardName === 'VAMPIRE LIFE STEAL') {
    if (newDefenderState) {
      const stolenHp = Math.min(10, newDefenderState.hp);
      const stolenEt = Math.min(1, newDefenderState.energyTokens || 0);
      newDefenderState.hp = Math.max(0, newDefenderState.hp - stolenHp);
      newDefenderState.energyTokens = Math.max(0, (newDefenderState.energyTokens || 0) - stolenEt);
      newAttackerState.hp = Math.min(newAttackerState.maxHp || 100, (newAttackerState.hp || 0) + stolenHp);
      newAttackerState.energyTokens = Math.min(10, (newAttackerState.energyTokens || 0) + stolenEt);

      newDefenderState.vampireStealStack = (newDefenderState.vampireStealStack || 0) + 1;
      newDefenderState.vampireStealTurnsLeft = 3;
      newDefenderState.vampireAttackerId = newAttackerState.id || attackerChar?.id || null;
      newDefenderState.vampireStealActivated = true;
      log += ` 🧛 VAMPIRE LIFE STEAL activated! Stole ${stolenHp} HP and ${stolenEt} ET. Curse applied for 3 turns (-10 HP, -1 ET/turn)!`;
    } else {
      log += ` 🧛 VAMPIRE LIFE STEAL played without target.`;
    }
  }
  // 11. TIME MACHINE
  else if (cardName === 'TIME MACHINE') {
    log += ` ⏳ TIME MACHINE activated! ${newAttackerState.name} gains an extra turn.`;
  }
  // 11b. RETREAT CARD
  else if (cardName === 'RETREAT') {
    // Per official rules: Available for attacker after they have rolled their dice, and available for defender after the attacker rolls their dice
    // Requires character's Retreat Speed stat - must roll >= that value on 1d6
    
    // Get attacker's character to check retreat speed
    const attackerCharData = attackerChar || KONTROLA_CHARACTERS[newAttackerState.characterId || 'chynaman'];
    const retreatSpeedReq = attackerCharData?.retreatSpeed || 1;
    
    // Roll 1 die
    const retreatRoll = rollDice(1);
    const retreatSuccess = retreatRoll.total >= retreatSpeedReq;
    
    if (retreatSuccess) {
      log += ` 💨 RETREAT SUCCESS! ${newAttackerState.name} rolled ${retreatRoll.total} (${retreatSpeedReq}+) and escaped combat without taking damage!`;
      newAttackerState.retreatedThisTurn = true;
      return { newAttackerState, newDefenderState, log, retreatSuccess: true };
    } else {
      log += ` 💨 RETREAT FAILED! ${newAttackerState.name} rolled ${retreatRoll.total} (needed ${retreatSpeedReq}+). Combat continues!`;
      return { newAttackerState, newDefenderState, log, retreatSuccess: false };
    }
  }
  // 12. X-CHANGE
  else if (cardName === 'X-CHANGE X1' || cardName.includes('X-CHANGE')) {
    // X-CHANGE X1: Exchange 1 card with 1 opponent (30 second limit)
    // X-CHANGE FULL: Exchange cards with all opponents
    const isFullExchange = cardName.includes('FULL');
    log += ` 🔄 X-CHANGE activated! ${newAttackerState.name} can select cards to exchange with ${isFullExchange ? 'all opponents' : 'an opponent'}.`;
    
    // Signal UI to show X-CHANGE modal
    return {
      newAttackerState,
      newDefenderState,
      log,
      triggerXChangeModal: true,
      xChangeType: isFullExchange ? 'FULL' : 'X1',
      xChangeInitiator: newAttackerState.id
    };
  }
  // 13. SOUL ALLIANCE & ABANDON
  else if (cardName === 'SOUL ALLIANCE') {
    // Per official rules: "SOUL ALLIANCE: This card should not be available in two player mode, but available 3+ players."
    const playerCount = gameState?.players?.length || 2;
    if (playerCount <= 2) {
      log += ` 🤝 SOUL ALLIANCE cannot be used! This card is only available in 3+ player matches (currently ${playerCount} players).`;
      return { newAttackerState, newDefenderState, log, cardBlocked: true };
    }
    
    if (newDefenderState) {
      newAttackerState.allianceId = newDefenderState.id;
      newDefenderState.allianceId = newAttackerState.id;
      newAttackerState.canTradeWithAlliance = true;  // Enable trading with ally
      newDefenderState.canTradeWithAlliance = true;  // Enable trading with ally
      log += ` 🤝 Soul Alliance formed between ${newAttackerState.name} and ${newDefenderState.name}! Energy Tokens and REVIVE cards can now be traded.`;
    }
  } else if (cardName === 'ABANDON') {
    newAttackerState.allianceId = null;
    newAttackerState.canTradeWithAlliance = false;  // Disable trading
    log += ` 💔 ${newAttackerState.name} abandoned all alliances!`;
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

  // Stability Crystals: Transfer on defeat
  if (newDefenderState && newDefenderState.hp <= 0 && !newDefenderState.isDefeated) {
    newDefenderState.isDefeated = true;
    // Transfer 1 crystal from defeated player to attacker
    if (newDefenderState.crystals > 0) {
      newAttackerState.crystals = (newAttackerState.crystals || 0) + 1;
      newDefenderState.crystals = Math.max(0, newDefenderState.crystals - 1);
      log += ` 🔷 ${newAttackerState.name} claimed 1 Stability Crystal from defeated ${newDefenderState.name}!`;
    }
  }

  return {
    newAttackerState,
    newDefenderState,
    log,
    extraTurnGranted: cardName === 'TIME MACHINE',
    triggerAttackX2SecondHit: cardName.includes('ATTACK X2'), // Trigger second attack regardless of first outcome
    triggerXChange: false, // Handled in Arena UI now
    stealActionCard: Boolean(stealActionCard),
    aoeDamage,
    aoeSplitDamage: aoeSplitDamage || false // Flag for 1vAll damage splitting
  };
};



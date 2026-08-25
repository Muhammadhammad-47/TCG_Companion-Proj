// TCG Card Game — character database & statistics

export const getAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const base = import.meta.env?.BASE_URL || '/';
  return base.endsWith('/') ? `${base}${cleanPath}` : `${base}/${cleanPath}`;
};

export const CHARACTERS = {
  chynaman: {
    id: 'chynaman',
    name: 'Chynaman',
    title: 'The Blazing Duelist',
    image: 'characters/chynaman.png',
    avatar: '🔥🥋',
    themeColor: '#ff3366',
    bgGradient: 'linear-gradient(135deg, #431418 0%, #1f080a 100%)',
    defaultLP: 8000,
    atk: 2800,
    def: 2400,
    signatureMove: 'Shadow Strike',
    signatureDesc: 'Deal 500 damage to target enemy and apply Poison.',
    quote: 'You have to believe in your own strength.',
    deckName: "Chynaman's Deck",
    deckFormat: 'Standard Format',
    status: { poison: 0, antidote: 1, atkBoost: 500, shield: 0, stun: 0 },
    stats: { damageDealt: 8500, damageTaken: 2150, cardsPlayed: 23, effectsTriggered: 14, score: 12450 },
    mindStrength: 4,
    defaultDP: 15,
    retreatTarget: 4,
    weakness: { type: 'Magic / Poison', bonusAP: 10, icon: '🧪' },
    traits: ['High DP Defender', 'Fire Martial Arts'],
    moves: [
      { id: 'c_shadow', name: 'Shadow Strike', type: 'flat', costET: 1, baseAP: 500, desc: 'Deal 500 damage to target enemy and apply Poison.' },
      { id: 'c_punch', name: 'Fire of Fury', type: 'dice_mult', costET: 1, baseAP: 25, desc: 'Fire combat technique' },
      { id: 'c_mic', name: 'Golden Mic Lightning', type: 'flat', costET: 2, baseAP: 40, desc: 'Lightning strike', isSuper: true },
      { id: 'c_wild', name: 'Wild Card Soul Combo', type: 'flat', costET: 3, baseAP: 55, desc: 'Flexible attack combo' },
      { id: 'c_blitz', name: 'Saigo No Blitz', type: 'blitz', costET: 5, baseAP: 200, desc: 'HP < 50 · costs half your HP' }
    ]
  },
  bee: {
    id: 'bee',
    name: 'Zabina "Bee" Sole',
    title: 'Queen of the Hive',
    image: 'characters/bee.png',
    avatar: '🐝👑',
    themeColor: '#00f0ff',
    bgGradient: 'linear-gradient(135deg, #093436 0%, #031517 100%)',
    defaultLP: 7200,
    atk: 2600,
    def: 2500,
    signatureMove: 'Azure Guard',
    signatureDesc: 'Grant +300 Shield and counter next incoming assault.',
    quote: 'The hive always protects its own.',
    deckName: "Bee's Hive Guard",
    deckFormat: 'Standard Format',
    status: { poison: 0, antidote: 0, atkBoost: 0, shield: 300, stun: 0 },
    stats: { damageDealt: 5400, damageTaken: 1800, cardsPlayed: 19, effectsTriggered: 11, score: 7200 },
    mindStrength: 5,
    defaultDP: 10,
    retreatTarget: 3,
    weakness: { type: 'Magic / Poison', bonusAP: 10, icon: '🧪' },
    traits: ['High Mind Strength (5)', 'Stun & Shield Specialist'],
    moves: [
      { id: 'b_guard', name: 'Azure Guard', type: 'flat', costET: 1, baseAP: 300, desc: 'Grant +300 Shield and counter next incoming assault.' },
      { id: 'b_sting', name: 'Sting Slap', type: 'dice_mult', costET: 1, baseAP: 3, desc: 'Rapid piercing sting' },
      { id: 'b_stun', name: 'Paparazzi Stun', type: 'flat', costET: 2, baseAP: 25, stun: true, desc: 'Stun target', isSuper: true },
      { id: 'b_bomb', name: 'Bee Drone Bomb', type: 'flat', costET: 2, baseAP: 40, desc: 'Explosive swarm blast', isSuper: true },
      { id: 'b_blitz', name: 'Saigo No Blitz', type: 'blitz', costET: 5, baseAP: 200, desc: 'HP < 50 · costs half your HP' }
    ]
  },
  katsumi: {
    id: 'katsumi',
    name: 'Katsumi',
    title: 'Shadow Fox of Fate',
    image: 'characters/katsumi.png',
    avatar: '🦊🗡️',
    themeColor: '#a855f7',
    bgGradient: 'linear-gradient(135deg, #2b134d 0%, #0d0617 100%)',
    defaultLP: 6500,
    atk: 2700,
    def: 2200,
    signatureMove: 'Blazing Vanguard',
    signatureDesc: 'Boost attack by +500 and strike with fatal precision.',
    quote: 'Fate bends to the swift and relentless.',
    deckName: "Katsumi's Eclipse",
    deckFormat: 'Standard Format',
    status: { poison: 0, antidote: 0, atkBoost: 500, shield: 0, stun: 0 },
    stats: { damageDealt: 6100, damageTaken: 2900, cardsPlayed: 21, effectsTriggered: 9, score: 6500 },
    mindStrength: 3,
    defaultDP: 15,
    retreatTarget: 1,
    weakness: { type: 'Poison', bonusAP: 15, icon: '☠️' },
    traits: ['Ultra Fast Retreat (1+)', 'High DP (-15)'],
    moves: [
      { id: 'k_vanguard', name: 'Blazing Vanguard', type: 'flat', costET: 1, baseAP: 500, desc: 'Boost attack by +500 and strike with fatal precision.' },
      { id: 'k_paws', name: 'Savage Paws', type: 'dice_mult', costET: 1, baseAP: 5, desc: 'Rapid claws' },
      { id: 'k_fate', name: 'Claw of Fate', type: 'flat', costET: 2, baseAP: 45, desc: 'Critical strike', isSuper: true },
      { id: 'k_wild', name: 'Wild Card Eclipse', type: 'flat', costET: 3, baseAP: 60, desc: 'Void shadow strike' },
      { id: 'k_blitz', name: 'Saigo No Blitz', type: 'blitz', costET: 5, baseAP: 200, desc: 'HP < 50 · costs half your HP' }
    ]
  },
  kiko: {
    id: 'kiko',
    name: 'Kiko the Monkey',
    title: 'Mystic Primate Illusionist',
    image: 'characters/kiko.png',
    avatar: '🐵🎧',
    themeColor: '#39ff14',
    bgGradient: 'linear-gradient(135deg, #173d09 0%, #061403 100%)',
    defaultLP: 5800,
    atk: 2400,
    def: 2600,
    signatureMove: 'Astral Surge',
    signatureDesc: 'Summon illusionary clones and apply 2 Poison stacks.',
    quote: 'Tricks and tunes always conquer brute force!',
    deckName: "Kiko's Groove Deck",
    deckFormat: 'Standard Format',
    status: { poison: 2, antidote: 0, atkBoost: 0, shield: 0, stun: 0 },
    stats: { damageDealt: 4200, damageTaken: 3400, cardsPlayed: 17, effectsTriggered: 15, score: 5800 },
    mindStrength: 3,
    mindDefBonus: 1,
    defaultDP: 10,
    retreatTarget: 4,
    weakness: { type: 'Fire', bonusAP: 10, icon: '🔥' },
    traits: ['Magical Mind Shield (+1)', 'Multiplicity Clones'],
    moves: [
      { id: 'm_surge', name: 'Astral Surge', type: 'flat', costET: 1, baseAP: 400, desc: 'Summon illusionary clones and apply 2 Poison stacks.' },
      { id: 'm_whip', name: 'Tail Whip', type: 'dice_mult', costET: 1, baseAP: 4, desc: 'Tail sweep' },
      { id: 'm_soul', name: 'Soul Blast 3000', type: 'flat', costET: 2, baseAP: 40, desc: 'Mystic beat pulse', isSuper: true },
      { id: 'm_wild', name: 'Wild Card Astral Surge', type: 'flat', costET: 3, baseAP: 50, desc: 'Magic illusion' },
      { id: 'm_blitz', name: 'Saigo No Blitz', type: 'blitz', costET: 5, baseAP: 200, desc: 'HP < 50 · costs half your HP' }
    ]
  },
  shroomy: {
    id: 'shroomy',
    name: 'Shroomy',
    title: 'Spore Alchemist',
    image: 'characters/kiko.png',
    avatar: '🍄💥',
    themeColor: '#39ff14',
    bgGradient: 'linear-gradient(135deg, #173d09 0%, #061403 100%)',
    defaultLP: 5000,
    atk: 2200,
    def: 2100,
    mindStrength: 2,
    mindDefBonus: 1,
    defaultDP: 10,
    retreatTarget: 1,
    weakness: { type: 'Fire', bonusAP: 10, icon: '🔥' },
    traits: ['Fast Retreat (1+)', 'High Damage Spores'],
    moves: [
      { id: 's_pop', name: 'Poppers per Pop', type: 'dice_mult', costET: 1, baseAP: 4, desc: '' },
      { id: 's_bomba', name: 'Ms Bomba', type: 'flat', costET: 2, baseAP: 40, desc: 'Explosive fungi', isSuper: true }
    ]
  },
  poochi: {
    id: 'poochi',
    name: 'Poochi',
    title: 'Glitter Guardian',
    image: 'characters/katsumi.png',
    avatar: '🐶💖',
    themeColor: '#ff1a9d',
    bgGradient: 'linear-gradient(135deg, #4a0d2e 0%, #17040e 100%)',
    defaultLP: 5200,
    atk: 2300,
    def: 2500,
    mindStrength: 2,
    mindDefBonus: 1,
    defaultDP: 10,
    retreatTarget: 4,
    weakness: { type: 'Magic / Poison', bonusAP: 10, icon: '🧪' },
    traits: ['Magical Mind Shield (+1)', 'Lasso of Truth Reveal'],
    moves: [
      { id: 'p_sparks', name: 'Glitter Sparks', type: 'dice_mult', costET: 1, baseAP: 4, desc: '' },
      { id: 'p_burst', name: 'Glitter Burst', type: 'flat', costET: 2, baseAP: 35, desc: 'Radiant burst', isSuper: true }
    ]
  },
  queeny: {
    id: 'queeny',
    name: 'Queeny',
    title: 'Psychic Empress',
    image: 'characters/bee.png',
    avatar: '👑🔮',
    themeColor: '#ff9d2d',
    bgGradient: 'linear-gradient(135deg, #452107 0%, #170a02 100%)',
    defaultLP: 6000,
    atk: 2500,
    def: 2300,
    mindStrength: 2,
    mindAtkBonus: 2,
    defaultDP: 10,
    retreatTarget: 4,
    weakness: { type: 'Fire / Glitch', bonusAP: 10, icon: '🔥' },
    traits: ['Psychic Kontrol Specialist (+2 Roll)', 'Siren Wave Attacks'],
    moves: [
      { id: 'q_whip', name: 'Hair Whip', type: 'dice_mult', costET: 1, baseAP: 4, desc: '' },
      { id: 'q_fan', name: 'Rainbow Fan Blast', type: 'flat', costET: 2, baseAP: 40, desc: 'Prism storm', isSuper: true }
    ]
  }
};

export const ZOMBIE_PROFILE = {
  name: 'ZOMBIE INFECTED',
  title: 'Undead Plagued Husk',
  avatar: '🧟‍♂️☣️',
  themeColor: '#39ff14',
  bgGradient: 'linear-gradient(135deg, #133806 0%, #061402 100%)',
  baseHP: 40,
  turnRegen: 10,
  mindStrength: 0,
  retreatTarget: 5,
  defaultDP: 0,
  weakness: { type: 'Fire & Lightning', bonusAP: 10, desc: 'Full damage, -1 poison', icon: '⚡🔥' },
  moves: [
    {
      id: 'z_venom',
      name: 'Venom Strike',
      type: 'zombie_infect',
      costET: 1,
      baseAP: 15,
      desc: '+1 poison'
    }
  ]
};

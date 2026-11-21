// TCG Card Game — Official Character Database & Statistics from GDD

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
    image: 'Kontrolla_Data/Graphics/WILD CARDS/CHYNA WILD CARD REG.png',
    avatar: '🥋',
    themeColor: '#ED1E24',
    bgGradient: 'linear-gradient(135deg, #431418 0%, #1f080a 100%)',
    baseHP: 100,
    maxHP: 200,
    baseReserveHP: 0,
    reserveUnlocked: false,
    mindStrength: 4,
    defaultDP: 15, // Innate defense reduction if roll >= 6
    retreatTarget: 4,
    weakness: { type: 'Poison', bonusAP: 10, icon: '☠️' },
    traits: ['High DP Defender (-15)', 'Fire Martial Arts'],
    signatureMove: 'Fire Tiger Soul Punch',
    signatureDesc: '25 AP Fire martial arts technique.',
    quote: 'You have to believe in your own strength.',
    moves: [
      {
        id: 'c_punch',
        name: 'Fire of Fury per Punch',
        type: 'dice_mult',
        multiplier: 5,
        element: 'Fire',
        costET: 1,
        rarity: 'Common',
        desc: 'Common Move. Roll 1 Die × 5 AP Fire combat strikes.'
      },
      {
        id: 'c_tiger',
        name: 'Fire Tiger Soul Punch',
        type: 'flat',
        baseAP: 25,
        element: 'Fire',
        costET: 1,
        rarity: 'Semi Common',
        desc: 'Semi Common Move. Direct blazing strike dealing 25 AP.'
      },
      {
        id: 'c_mic',
        name: 'Golden Mic Lighting',
        type: 'flat',
        baseAP: 40,
        element: 'Lightning',
        costET: 2,
        isSuper: true,
        rarity: 'Rare',
        desc: 'Rare Move. Super Lightning strike dealing 40 AP.'
      },
      {
        id: 'c_wild',
        name: 'Wild Card',
        displayName: 'Wild Card (Super Rare)',
        type: 'wild',
        rarity: 'Super Rare',
        isWild: true,
        wildOptions: ['Fire of Fury per Punch', 'Fire Tiger Soul Punch', 'Golden Mic Lighting'],
        costET: 1,
        desc: 'Super Rare Wild Card. Allows choosing only one move from: Fire of Fury per Punch, Fire Tiger Soul Punch, or Golden Mic Lighting.'
      },
      {
        id: 'c_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        isBlitz: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation. Only available through digital purchase or QR Code system.'
      },
      {
        id: 'c_kontrol',
        name: 'Kontrol',
        type: 'kontrol',
        element: 'Psychic',
        costET: 3,
        isKontrol: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Mental battle using Mind Strength (4). Only available through digital purchase or QR Code system.'
      }
    ]
  },
  bee: {
    id: 'bee',
    name: 'Zabina "Bee" Solé',
    title: 'Queen of the Hive',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/BEE WILD CARD GOLD.png',
    avatar: '🐝',
    themeColor: '#FBC80D',
    bgGradient: 'linear-gradient(135deg, #093436 0%, #031517 100%)',
    baseHP: 70,
    maxHP: 200,
    baseReserveHP: 30,
    reserveUnlocked: true,
    mindStrength: 5, // Highest mind resistance
    defaultDP: 10,
    retreatTarget: 3,
    weakness: { type: 'Poison', bonusAP: 10, icon: '☠️' },
    traits: ['High Mind Strength (5)', 'Stun & Drone Specialist', 'Fast Retreat (3+)'],
    signatureMove: 'Pararazzi Stun',
    signatureDesc: '25 AP strike that forces target to skip their next turn (Sleep X1).',
    quote: 'The hive always protects its own.',
    moves: [
      {
        id: 'b_sting',
        name: 'Sting Slap per sting',
        type: 'dice_mult',
        multiplier: 3,
        element: 'Physical',
        costET: 1,
        rarity: 'Common',
        desc: 'Common Move. Roll 1 Die × 3 AP rapid piercing stings.'
      },
      {
        id: 'b_stun',
        name: 'Pararazzi Stun',
        type: 'flat',
        baseAP: 25,
        element: 'Lightning',
        costET: 1,
        rarity: 'Semi Common',
        loseTurn: true,
        appliesSleep: true,
        desc: 'Semi Common Move. 25 AP damage. If and only if the attack is successful, the defendant loses one turn (Sleep X1).'
      },
      {
        id: 'b_bomb',
        name: 'Bee Drone Bomb',
        type: 'flat',
        baseAP: 40,
        element: 'Physical',
        costET: 2,
        isSuper: true,
        rarity: 'Rare',
        desc: 'Rare Move. Explosive swarm blast dealing 40 AP.'
      },
      {
        id: 'b_wild',
        name: 'Wild Card',
        displayName: 'Wild Card (Super Rare)',
        type: 'wild',
        rarity: 'Super Rare',
        isWild: true,
        wildOptions: ['Sting Slap per sting', 'Pararazzi Stun', 'Bee Drone Bomb'],
        costET: 1,
        desc: 'Super Rare Wild Card. Allows choosing only one move from: Sting Slap per sting, Pararazzi Stun, or Bee Drone Bomb.'
      },
      {
        id: 'b_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        isBlitz: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation. Only available through digital purchase or QR Code system.'
      },
      {
        id: 'b_kontrol',
        name: 'Kontrol',
        type: 'kontrol',
        element: 'Psychic',
        costET: 3,
        isKontrol: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Mental battle using Mind Strength (5). Only available through digital purchase or QR Code system.'
      }
    ]
  },
  katsumi: {
    id: 'katsumi',
    name: 'Katsumi',
    title: 'Shadow Fox of Fate',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/KAT WILD CARD GOLD.png',
    avatar: '🦊',
    themeColor: '#FBC80D',
    bgGradient: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%)',
    baseHP: 100,
    maxHP: 200,
    baseReserveHP: 0,
    reserveUnlocked: false,
    mindStrength: 3,
    defaultDP: 15,
    retreatTarget: 1, // Ultra fast retreat (roll 1+)
    weakness: { type: 'Poison', bonusAP: 10, icon: '☠️' },
    traits: ['Ultra Fast Retreat (1+)', 'High DP Defender (-15)', 'Lethal Criticals'],
    signatureMove: 'Claw of Fate',
    signatureDesc: '45 AP fatal precision slash.',
    quote: 'Fate bends to the swift and relentless.',
    moves: [
      {
        id: 'k_paws',
        name: 'Savage Paws per strike',
        type: 'dice_mult',
        multiplier: 5,
        element: 'Physical',
        costET: 1,
        rarity: 'Common',
        desc: 'Common Move. Roll 1 Die × 5 AP razor claws.'
      },
      {
        id: 'k_purr',
        name: 'Shadow Purr',
        type: 'flat',
        baseAP: 30,
        element: 'Shadow',
        costET: 1,
        rarity: 'Semi Common',
        healsAttacker: 20,
        appliesSleep: true,
        desc: 'Semi Common Move. Stealth shadow strike dealing 30 AP. Heals attacker for 20 HP. If and only if the attack is successful, inflicts Sleep X1 on the defendant (loses 1 turn).'
      },
      {
        id: 'k_fate',
        name: 'Claw of Fate',
        type: 'flat',
        baseAP: 45,
        element: 'Physical',
        costET: 2,
        isSuper: true,
        rarity: 'Rare',
        desc: 'Rare Move. Critical fatal slash dealing 45 AP.'
      },
      {
        id: 'k_wild',
        name: 'Wild Card',
        displayName: 'Wild Card (Super Rare)',
        type: 'wild',
        rarity: 'Super Rare',
        isWild: true,
        wildOptions: ['Savage Paws per strike', 'Shadow Purr', 'Claw of Fate'],
        costET: 1,
        desc: 'Super Rare Wild Card. Allows choosing only one move from: Savage Paws per strike, Shadow Purr, or Claw of Fate.'
      },
      {
        id: 'k_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        isBlitz: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation. Only available through digital purchase or QR Code system.'
      },
      {
        id: 'k_kontrol',
        name: 'Kontrol',
        type: 'kontrol',
        element: 'Psychic',
        costET: 3,
        isKontrol: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Mental battle using Mind Strength (3). Only available through digital purchase or QR Code system.'
      }
    ]
  },
  kiko: {
    id: 'kiko',
    name: 'Kiko the Monkey',
    title: 'Mystic Primate Illusionist',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/KIKO WILD CARD GOLD.png',
    avatar: '🐵',
    themeColor: '#39ff14',
    bgGradient: 'linear-gradient(135deg, #173d09 0%, #061403 100%)',
    baseHP: 100,
    maxHP: 200,
    baseReserveHP: 0,
    reserveUnlocked: false,
    mindStrength: 3,
    mindDefBonus: 1, // Magical creature +1 to mind defense
    defaultDP: 10,
    retreatTarget: 4,
    weakness: { type: 'Poison', bonusAP: 10, icon: '☠️' },
    traits: ['Magical Mind Shield (+1)', 'Multiplicity Clones', 'Sonic Beats'],
    signatureMove: 'Soul Blast 3000',
    signatureDesc: '40 AP mystical sonic blast.',
    quote: 'Tricks and tunes always conquer brute force!',
    moves: [
      {
        id: 'm_whip',
        name: 'Tail Whip per whip',
        type: 'dice_mult',
        multiplier: 4,
        element: 'Physical',
        costET: 1,
        rarity: 'Common',
        desc: 'Common Move. Roll 1 Die × 4 AP sweeping tail strikes.'
      },
      {
        id: 'm_multi',
        name: 'Multiplicity',
        type: 'flat',
        baseAP: 30,
        element: 'Magic',
        costET: 1,
        rarity: 'Semi Common',
        desc: 'Semi Common Move. Summon illusionary clones dealing 30 AP.'
      },
      {
        id: 'm_soul',
        name: 'Soul Blast 3000',
        type: 'flat',
        baseAP: 40,
        element: 'Magic',
        costET: 2,
        isSuper: true,
        rarity: 'Rare',
        desc: 'Rare Move. Mystic sonic beat pulse dealing 40 AP.'
      },
      {
        id: 'kiko_wild',
        name: 'Wild Card',
        displayName: 'Wild Card (Super Rare)',
        type: 'wild',
        rarity: 'Super Rare',
        isWild: true,
        wildOptions: ['Tail Whip per whip', 'Multiplicity', 'Soul Blast 3000'],
        costET: 1,
        desc: 'Super Rare Wild Card. Allows choosing only one move from: Tail Whip per whip, Multiplicity, or Soul Blast 3000.'
      },
      {
        id: 'm_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        isBlitz: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation. Only available through digital purchase or QR Code system.'
      },
      {
        id: 'm_kontrol',
        name: 'Kontrol',
        type: 'kontrol',
        element: 'Psychic',
        costET: 3,
        isKontrol: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Mental battle using Mind Strength (3). Only available through digital purchase or QR Code system.'
      }
    ]
  },
  shroomy: {
    id: 'shroomy',
    name: 'Shroomy',
    title: 'Spore Alchemist',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/SHROOMY WILD CARD GOLD.png',
    avatar: '🍄',
    themeColor: '#39ff14',
    bgGradient: 'linear-gradient(135deg, #173d09 0%, #061402 100%)',
    baseHP: 65,
    maxHP: 200,
    baseReserveHP: 35,
    reserveUnlocked: true,
    mindStrength: 2,
    mindDefBonus: 1, // Magical creature +1
    defaultDP: 10,
    retreatTarget: 1, // Ultra fast escape (roll 1+)
    weakness: { type: 'Fire', bonusAP: 10, icon: '🔥' },
    traits: ['Ultra Fast Retreat (1+)', 'Magical Mind Shield (+1)', 'Explosive Spores'],
    signatureMove: 'Soul Snatcher',
    signatureDesc: '50 AP dense fungal extraction.',
    quote: 'Small fungi carry the biggest explosions!',
    moves: [
      {
        id: 's_pop',
        name: 'Poppers per pop',
        type: 'dice_mult',
        multiplier: 4,
        element: 'Nature',
        costET: 1,
        rarity: 'Common',
        desc: 'Common Move. Roll 1 Die × 4 AP rapid popping spores.'
      },
      {
        id: 's_bomba',
        name: 'MS Bomba',
        type: 'flat',
        baseAP: 40,
        element: 'Nature',
        costET: 2,
        rarity: 'Semi Common',
        desc: 'Semi Common Move. Massive explosive fungal burst dealing 40 AP.'
      },
      {
        id: 's_snatcher',
        name: 'Soul Snatcher',
        type: 'flat',
        baseAP: 50,
        element: 'Magic',
        costET: 2,
        isSuper: true,
        rarity: 'Rare',
        desc: 'Rare Move. High potency mystic spore extraction dealing 50 AP.'
      },
      {
        id: 's_wild',
        name: 'Wild Card',
        displayName: 'Wild Card (Super Rare)',
        type: 'wild',
        rarity: 'Super Rare',
        isWild: true,
        wildOptions: ['Poppers per pop', 'MS Bomba', 'Soul Snatcher'],
        costET: 1,
        desc: 'Super Rare Wild Card. Allows choosing only one move from: Poppers per pop, MS Bomba, or Soul Snatcher.'
      },
      {
        id: 's_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        isBlitz: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation. Only available through digital purchase or QR Code system.'
      },
      {
        id: 's_kontrol',
        name: 'Kontrol',
        type: 'kontrol',
        element: 'Psychic',
        costET: 3,
        isKontrol: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Mental battle using Mind Strength (2). Only available through digital purchase or QR Code system.'
      }
    ]
  },
  poochi: {
    id: 'poochi',
    name: 'Poochi',
    title: 'Glitter Guardian',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/POOCHI WILD CARD GOLD.png',
    avatar: '🐶',
    themeColor: '#ff1a9d',
    bgGradient: 'linear-gradient(135deg, #4a0d2e 0%, #17040e 100%)',
    baseHP: 70,
    maxHP: 200,
    baseReserveHP: 30,
    reserveUnlocked: true,
    mindStrength: 2,
    mindDefBonus: 1, // Magical creature +1
    defaultDP: 10,
    retreatTarget: 4,
    weakness: { type: 'Poison', bonusAP: 10, icon: '☠️' },
    traits: ['Magical Mind Shield (+1)', 'Lasso of Truth Hand Reveal', 'Radiant Glitter'],
    signatureMove: 'Glitter Burst',
    signatureDesc: '35 AP blinding sparkle assault.',
    quote: 'Sparkle bright, banish the dark!',
    moves: [
      {
        id: 'p_sparks',
        name: 'Glitter Sparks per spark',
        type: 'dice_mult',
        multiplier: 4,
        element: 'Magic',
        costET: 1,
        rarity: 'Common',
        desc: 'Common Move. Roll 1 Die × 4 AP shimmering sparks.'
      },
      {
        id: 'p_lasso',
        name: 'Lasso of Truth',
        type: 'flat',
        baseAP: 25,
        revealCards: true,
        element: 'Magic',
        costET: 1,
        rarity: 'Semi Common',
        desc: 'Semi Common Move. 25 AP strike. If and only if the attack is successful, inflicts Vision X1 on the defendant (target reveals Action Cards).'
      },
      {
        id: 'p_burst',
        name: 'Glitter Burst',
        type: 'flat',
        baseAP: 35,
        element: 'Magic',
        costET: 2,
        isSuper: true,
        rarity: 'Rare',
        desc: 'Rare Move. Radiant glitter super burst dealing 35 AP.'
      },
      {
        id: 'p_wild',
        name: 'Wild Card',
        displayName: 'Wild Card (Super Rare)',
        type: 'wild',
        rarity: 'Super Rare',
        isWild: true,
        wildOptions: ['Glitter Sparks per spark', 'Lasso of Truth', 'Glitter Burst'],
        costET: 1,
        desc: 'Super Rare Wild Card. Allows choosing only one move from: Glitter Sparks per spark, Lasso of Truth, or Glitter Burst.'
      },
      {
        id: 'p_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        isBlitz: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation. Only available through digital purchase or QR Code system.'
      },
      {
        id: 'p_kontrol',
        name: 'Kontrol',
        type: 'kontrol',
        element: 'Psychic',
        costET: 3,
        isKontrol: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Mental battle using Mind Strength (2). Only available through digital purchase or QR Code system.'
      }
    ]
  },
  queeny: {
    id: 'queeny',
    name: 'Queeny',
    title: 'Psychic Empress',
    image: 'Kontrolla_Data/Graphics/WILD CARDS/QUEENY WILD CARD GOLD.png',
    avatar: '👑',
    themeColor: '#ff9d2d',
    bgGradient: 'linear-gradient(135deg, #452107 0%, #170a02 100%)',
    baseHP: 100,
    maxHP: 200,
    baseReserveHP: 0,
    reserveUnlocked: false,
    mindStrength: 2,
    mindAtkBonus: 2, // Psychic master: +2 to Kontrol attack roll!
    defaultDP: 10,
    retreatTarget: 4,
    weakness: { type: 'Fire', bonusAP: 10, icon: '🔥' },
    traits: ['Psychic Kontrol Specialist (+2 Roll)', 'Siren Wave Attacks'],
    signatureMove: 'Rainbow Fan Blast',
    signatureDesc: '40 AP prism storm assault.',
    quote: 'Your thoughts already belong to the Empress.',
    moves: [
      {
        id: 'q_whip',
        name: 'Hair Whip per whip',
        type: 'dice_mult',
        multiplier: 4,
        element: 'Physical',
        costET: 1,
        rarity: 'Common',
        desc: 'Common Move. Roll 1 Die × 4 AP psychic hair slashes.'
      },
      {
        id: 'q_siren',
        name: 'Siren Blast',
        type: 'flat',
        baseAP: 30,
        element: 'Magic',
        costET: 1,
        rarity: 'Semi Common',
        desc: 'Semi Common Move. Sonic psychic screech dealing 30 AP.'
      },
      {
        id: 'q_fan',
        name: 'Rainbow Fan Blast',
        type: 'flat',
        baseAP: 40,
        element: 'Magic',
        costET: 2,
        isSuper: true,
        rarity: 'Rare',
        desc: 'Rare Move. Prism energy fan storm dealing 40 AP.'
      },
      {
        id: 'q_wild',
        name: 'Wild Card',
        displayName: 'Wild Card (Super Rare)',
        type: 'wild',
        rarity: 'Super Rare',
        isWild: true,
        wildOptions: ['Hair Whip per whip', 'Siren Blast', 'Rainbow Fan Blast'],
        costET: 1,
        desc: 'Super Rare Wild Card. Allows choosing only one move from: Hair Whip per whip, Siren Blast, or Rainbow Fan Blast.'
      },
      {
        id: 'q_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        isBlitz: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation. Only available through digital purchase or QR Code system.'
      },
      {
        id: 'q_kontrol',
        name: 'Kontrol',
        type: 'kontrol',
        element: 'Psychic',
        costET: 3,
        isKontrol: true,
        rarity: 'Ultra Rare',
        requiresPurchaseOrQR: true,
        desc: 'Mental battle using Mind Strength (2 +2 bonus). Only available through digital purchase or QR Code system.'
      }
    ]
  }
};

// Official Zombie Profile strictly matching GDD
export const ZOMBIE_PROFILE = {
  name: 'ZOMBIE INFECTED',
  title: 'Undead Plagued Husk',
  avatar: '🧟',
  themeColor: '#39ff14',
  bgGradient: 'linear-gradient(135deg, #133806 0%, #061402 100%)',
  baseHP: 40,
  maxHP: 200,
  turnRegen: 10, // +10 HP at start of each round
  mindStrength: 0, // Mindless: Immune to Kontrol
  retreatTarget: 5, // Extremely slow
  defaultDP: 0, // No innate character defense
  weakness: {
    type: 'Lightning and Fire',
    bonusAP: 10,
    desc: 'Lightning and Fire weakness of -10 HP on the first initial attack every time a successful Lightning or Fire attack is used, and cleanses 1 Poison card!',
    icon: '⚡🔥'
  },
  moves: [
    {
      id: 'z_venom',
      name: 'Venom Strike',
      type: 'zombie_infect',
      element: 'Poison',
      costET: 1,
      baseAP: 15,
      appliesPoison: true,
      desc: 'Deals 15 AP damage. On a successful hit, infects target with +1 Poison card!'
    }
  ]
};

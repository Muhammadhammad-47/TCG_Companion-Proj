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
    image: 'characters/chynaman.png',
    avatar: '🔥🥋',
    themeColor: '#ff3366',
    bgGradient: 'linear-gradient(135deg, #431418 0%, #1f080a 100%)',
    baseHP: 100,
    maxHP: 200,
    mindStrength: 4,
    defaultDP: 15, // Innate defense reduction if roll >= 6
    retreatTarget: 4,
    weakness: { type: 'Magic / Poison', bonusAP: 10, icon: '🧪' },
    traits: ['High DP Defender (-15)', 'Fire Martial Arts'],
    signatureMove: 'Fire Tiger Soul Punch',
    signatureDesc: '25 AP Fire martial arts technique.',
    quote: 'You have to believe in your own strength.',
    moves: [
      {
        id: 'c_punch',
        name: 'Fire of Fury',
        type: 'dice_mult',
        multiplier: 5,
        element: 'Fire',
        costET: 1,
        desc: 'Roll 1 Die × 5 AP Fire combat strikes.'
      },
      {
        id: 'c_tiger',
        name: 'Fire Tiger Soul Punch',
        type: 'flat',
        baseAP: 25,
        element: 'Fire',
        costET: 1,
        desc: 'Direct blazing strike dealing 25 AP.'
      },
      {
        id: 'c_mic',
        name: 'Golden Mic Lightning',
        type: 'flat',
        baseAP: 40,
        element: 'Lightning',
        costET: 2,
        isSuper: true,
        desc: 'Super Lightning strike dealing 40 AP.'
      },
      {
        id: 'c_wild1',
        name: 'Wild Card Soul Combo',
        type: 'flat',
        baseAP: 20,
        element: 'Physical',
        costET: 1,
        desc: 'Unpredictable rapid strikes dealing 20 AP.'
      },
      {
        id: 'c_wild2',
        name: 'Wild Card Blazing Kick',
        type: 'flat',
        baseAP: 30,
        element: 'Fire',
        costET: 1,
        desc: 'A wild flaming kick dealing 30 AP.'
      },
      {
        id: 'c_wild3',
        name: 'Wild Card Hidden Flame',
        type: 'flat',
        baseAP: 35,
        element: 'Fire',
        costET: 1,
        desc: 'A hidden fire technique dealing 35 AP.'
      },
      {
        id: 'c_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation.'
      }
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
    baseHP: 100,
    maxHP: 200,
    mindStrength: 5, // Highest mind resistance
    defaultDP: 10,
    retreatTarget: 3,
    weakness: { type: 'Magic / Poison', bonusAP: 10, icon: '🧪' },
    traits: ['High Mind Strength (5)', 'Stun & Drone Specialist', 'Fast Retreat (3+)'],
    signatureMove: 'Paparazzi Stun',
    signatureDesc: '25 AP strike that forces target to skip their next turn.',
    quote: 'The hive always protects its own.',
    moves: [
      {
        id: 'b_sting',
        name: 'Sting Slap',
        type: 'dice_mult',
        multiplier: 3,
        element: 'Physical',
        costET: 1,
        desc: 'Roll 1 Die × 3 AP rapid piercing stings.'
      },
      {
        id: 'b_stun',
        name: 'Paparazzi Stun',
        type: 'flat',
        baseAP: 25,
        element: 'Lightning',
        stun: true,
        costET: 2,
        isSuper: true,
        desc: '25 AP damage and target loses their next turn.'
      },
      {
        id: 'b_bomb',
        name: 'Bee Drone Bomb',
        type: 'flat',
        baseAP: 40,
        element: 'Physical',
        costET: 2,
        desc: 'Explosive swarm blast dealing 40 AP.'
      },
      {
        id: 'b_guard',
        name: 'Azure Guard',
        type: 'shield',
        baseShield: 30,
        costET: 1,
        desc: 'Deploy high-tech hex barrier (+30 Shield).'
      },
      {
        id: 'b_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation.'
      }
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
    baseHP: 100,
    maxHP: 200,
    mindStrength: 3,
    defaultDP: 15,
    retreatTarget: 1, // Ultra fast retreat (roll 1+)
    weakness: { type: 'Poison', bonusAP: 15, icon: '☠️' },
    traits: ['Ultra Fast Retreat (1+)', 'High DP Defender (-15)', 'Lethal Criticals'],
    signatureMove: 'Claw of Fate',
    signatureDesc: '45 AP fatal precision slash.',
    quote: 'Fate bends to the swift and relentless.',
    moves: [
      {
        id: 'k_paws',
        name: 'Savage Paws',
        type: 'dice_mult',
        multiplier: 5,
        element: 'Physical',
        costET: 1,
        desc: 'Roll 1 Die × 5 AP razor claws.'
      },
      {
        id: 'k_purr',
        name: 'Shadow Purr',
        type: 'flat',
        baseAP: 30,
        element: 'Shadow',
        costET: 1,
        desc: 'Stealth shadow strike dealing 30 AP.'
      },
      {
        id: 'k_fate',
        name: 'Claw of Fate',
        type: 'flat',
        baseAP: 45,
        element: 'Physical',
        costET: 2,
        isSuper: true,
        desc: 'Critical fatal slash dealing 45 AP.'
      },
      {
        id: 'k_wild1',
        name: 'Wild Card Shadow Pounce',
        type: 'flat',
        baseAP: 20,
        element: 'Shadow',
        costET: 1,
        desc: 'Sneaky shadow pounce dealing 20 AP.'
      },
      {
        id: 'k_wild2',
        name: 'Wild Card Fox Fire',
        type: 'flat',
        baseAP: 30,
        element: 'Physical',
        costET: 1,
        desc: 'Wild fox flame strike dealing 30 AP.'
      },
      {
        id: 'k_wild3',
        name: 'Wild Card Twin Slash',
        type: 'flat',
        baseAP: 40,
        element: 'Physical',
        costET: 1,
        desc: 'Two rapid slashes dealing 40 AP.'
      },
      {
        id: 'k_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation.'
      }
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
    baseHP: 100,
    maxHP: 200,
    mindStrength: 3,
    mindDefBonus: 1, // Magical creature +1 to mind defense
    defaultDP: 10,
    retreatTarget: 4,
    weakness: { type: 'Fire', bonusAP: 10, icon: '🔥' },
    traits: ['Magical Mind Shield (+1)', 'Multiplicity Clones', 'Sonic Beats'],
    signatureMove: 'Soul Blast 3000',
    signatureDesc: '40 AP mystical sonic blast.',
    quote: 'Tricks and tunes always conquer brute force!',
    moves: [
      {
        id: 'm_whip',
        name: 'Tail Whip',
        type: 'dice_mult',
        multiplier: 4,
        element: 'Physical',
        costET: 1,
        desc: 'Roll 1 Die × 4 AP sweeping tail strikes.'
      },
      {
        id: 'm_multi',
        name: 'Multiplicity',
        type: 'flat',
        baseAP: 30,
        element: 'Magic',
        costET: 1,
        desc: 'Summon illusionary clones dealing 30 AP.'
      },
      {
        id: 'm_soul',
        name: 'Soul Blast 3000',
        type: 'flat',
        baseAP: 40,
        element: 'Magic',
        costET: 2,
        isSuper: true,
        desc: 'Mystic sonic beat pulse dealing 40 AP.'
      },
      {
        id: 'kiko_wild1',
        name: 'Wild Card Banana Toss',
        type: 'flat',
        baseAP: 15,
        element: 'Physical',
        costET: 1,
        desc: 'Throws a banana dealing 15 AP.'
      },
      {
        id: 'kiko_wild2',
        name: 'Wild Card Monkey Flip',
        type: 'flat',
        baseAP: 25,
        element: 'Physical',
        costET: 1,
        desc: 'A wild flip kick dealing 25 AP.'
      },
      {
        id: 'kiko_wild3',
        name: 'Wild Card Jungle Strike',
        type: 'flat',
        baseAP: 35,
        element: 'Magic',
        costET: 1,
        desc: 'Unpredictable magic strike dealing 35 AP.'
      },
      {
        id: 'm_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation.'
      }
    ]
  },
  shroomy: {
    id: 'shroomy',
    name: 'Shroomy',
    title: 'Spore Alchemist',
    image: 'characters/kiko.png',
    avatar: '🍄💥',
    themeColor: '#39ff14',
    bgGradient: 'linear-gradient(135deg, #173d09 0%, #061402 100%)',
    baseHP: 100,
    maxHP: 200,
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
        name: 'Poppers per Pop',
        type: 'dice_mult',
        multiplier: 4,
        element: 'Nature',
        costET: 1,
        desc: 'Roll 1 Die × 4 AP rapid popping spores.'
      },
      {
        id: 's_bomba',
        name: 'Ms Bomba',
        type: 'flat',
        baseAP: 40,
        element: 'Nature',
        costET: 2,
        isSuper: true,
        desc: 'Massive explosive fungal burst dealing 40 AP.'
      },
      {
        id: 's_snatcher',
        name: 'Soul Snatcher',
        type: 'flat',
        baseAP: 50,
        element: 'Magic',
        costET: 3,
        desc: 'High potency mystic spore extraction dealing 50 AP.'
      },
      {
        id: 's_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation.'
      }
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
    baseHP: 100,
    maxHP: 200,
    mindStrength: 2,
    mindDefBonus: 1, // Magical creature +1
    defaultDP: 10,
    retreatTarget: 4,
    weakness: { type: 'Magic / Poison', bonusAP: 10, icon: '🧪' },
    traits: ['Magical Mind Shield (+1)', 'Lasso of Truth Hand Reveal', 'Radiant Glitter'],
    signatureMove: 'Glitter Burst',
    signatureDesc: '35 AP blinding sparkle assault.',
    quote: 'Sparkle bright, banish the dark!',
    moves: [
      {
        id: 'p_sparks',
        name: 'Glitter Sparks',
        type: 'dice_mult',
        multiplier: 4,
        element: 'Magic',
        costET: 1,
        desc: 'Roll 1 Die × 4 AP shimmering sparks.'
      },
      {
        id: 'p_lasso',
        name: 'Lasso of Truth',
        type: 'flat',
        baseAP: 25,
        revealCards: true,
        element: 'Magic',
        costET: 1,
        desc: '25 AP strike and target must reveal their Action Cards.'
      },
      {
        id: 'p_burst',
        name: 'Glitter Burst',
        type: 'flat',
        baseAP: 35,
        element: 'Magic',
        costET: 2,
        isSuper: true,
        desc: 'Radiant glitter super burst dealing 35 AP.'
      },
      {
        id: 'p_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation.'
      }
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
    baseHP: 100,
    maxHP: 200,
    mindStrength: 2,
    mindAtkBonus: 2, // Psychic master: +2 to Kontrol attack roll!
    defaultDP: 10,
    retreatTarget: 4,
    weakness: { type: 'Fire / Glitch', bonusAP: 10, icon: '🔥' },
    traits: ['Psychic Kontrol Specialist (+2 Roll)', 'Siren Wave Attacks'],
    signatureMove: 'Rainbow Fan Blast',
    signatureDesc: '40 AP prism storm assault.',
    quote: 'Your thoughts already belong to the Empress.',
    moves: [
      {
        id: 'q_whip',
        name: 'Hair Whip',
        type: 'dice_mult',
        multiplier: 4,
        element: 'Physical',
        costET: 1,
        desc: 'Roll 1 Die × 4 AP psychic hair slashes.'
      },
      {
        id: 'q_siren',
        name: 'Siren Blast',
        type: 'flat',
        baseAP: 30,
        element: 'Magic',
        costET: 1,
        desc: 'Sonic psychic screech dealing 30 AP.'
      },
      {
        id: 'q_fan',
        name: 'Rainbow Fan Blast',
        type: 'flat',
        baseAP: 40,
        element: 'Magic',
        costET: 2,
        isSuper: true,
        desc: 'Prism energy fan storm dealing 40 AP.'
      },
      {
        id: 'q_blitz',
        name: 'Saigo No Blitz',
        type: 'blitz',
        baseAP: 200,
        costET: 5,
        desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation.'
      }
    ]
  }
};

// Official Zombie Profile strictly matching GDD
export const ZOMBIE_PROFILE = {
  name: 'ZOMBIE INFECTED',
  title: 'Undead Plagued Husk',
  avatar: '🧟‍♂️☣️',
  themeColor: '#39ff14',
  bgGradient: 'linear-gradient(135deg, #133806 0%, #061402 100%)',
  baseHP: 40,
  maxHP: 200,
  turnRegen: 10, // +10 HP at start of each round
  mindStrength: 0, // Mindless: Immune to Kontrol
  retreatTarget: 5, // Extremely slow
  defaultDP: 0, // No innate character defense
  weakness: {
    type: 'Fire & Lightning',
    bonusAP: 10,
    desc: 'Fire & Lightning attacks deal normal damage AND strip 1 Poison card!',
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

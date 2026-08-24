// Attention TCG Character Database & Statistics
export const CHARACTERS = {
  chynaman: {
    id: 'chynaman',
    name: 'CHYNAMAN',
    title: 'The Blazing Lyricist',
    avatar: '🔥🎤',
    themeColor: '#ff4d4f',
    bgGradient: 'linear-gradient(135deg, #431418 0%, #1f080a 100%)',
    mindStrength: 4,
    defaultDP: 15, // Reduces AP by 15 when rolling 6+ on 2 dice
    retreatTarget: 4,
    weakness: { type: 'Magic / Poison', bonusAP: 10, icon: '🧪' },
    traits: ['High DP Defender', 'Fire Martial Arts'],
    moves: [
      { id: 'c_punch', name: 'Fire of Fury', type: 'dice_mult', costET: 1, baseAP: 5, desc: 'Roll 1 die × 5 AP damage' },
      { id: 'c_tiger', name: 'Fire Tiger Soul Punch', type: 'flat', costET: 1, baseAP: 25, desc: 'Deals 25 AP Fire damage' },
      { id: 'c_mic', name: 'Golden Mic Lighting', type: 'flat', costET: 2, baseAP: 40, desc: 'Deals 40 AP Lightning damage', isSuper: true },
      { id: 'c_wild', name: 'Wild Card Soul Combo', type: 'flat', costET: 3, baseAP: 55, desc: 'Deals 55 AP flexible damage' },
      { id: 'c_blitz', name: 'Saigo No Blitz', type: 'blitz', costET: 5, baseAP: 200, desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP catastrophe!' }
    ]
  },
  bee: {
    id: 'bee',
    name: 'Zabina "Bee" Sole',
    title: 'Queen of the Hive',
    avatar: '🐝👑',
    themeColor: '#fadb14',
    bgGradient: 'linear-gradient(135deg, #3d3200 0%, #141203 100%)',
    mindStrength: 5,
    defaultDP: 10,
    retreatTarget: 3, // Needs 3+ to escape
    weakness: { type: 'Magic / Poison', bonusAP: 10, icon: '🧪' },
    traits: ['High Mind Strength (5)', 'Stun Specialist'],
    moves: [
      { id: 'b_sting', name: 'Sting Slap', type: 'dice_mult', costET: 1, baseAP: 3, desc: 'Roll 1 die × 3 AP sting damage' },
      { id: 'b_stun', name: 'Paparazzi Stun', type: 'flat', costET: 2, baseAP: 25, stun: true, desc: 'Deals 25 AP damage + Target loses next turn', isSuper: true },
      { id: 'b_bomb', name: 'Bee Drone Bomb', type: 'flat', costET: 2, baseAP: 40, desc: 'Deals 40 AP explosive damage', isSuper: true },
      { id: 'b_wild', name: 'Wild Card Swarm', type: 'flat', costET: 3, baseAP: 50, desc: 'Deals 50 AP swarm damage' },
      { id: 'b_blitz', name: 'Saigo No Blitz', type: 'blitz', costET: 5, baseAP: 200, desc: 'Requires HP < 50. Sacrifices 50% HP for 200 AP devastation' }
    ]
  },
  katsumi: {
    id: 'katsumi',
    name: 'Katsumi',
    title: 'Shadow Panther of Fate',
    avatar: '🐾🗡️',
    themeColor: '#722ed1',
    bgGradient: 'linear-gradient(135deg, #2b134d 0%, #0d0617 100%)',
    mindStrength: 3,
    defaultDP: 15,
    retreatTarget: 1, // Super fast! 1+ retreat
    weakness: { type: 'Poison', bonusAP: 15, icon: '☠️' },
    traits: ['Ultra Fast Retreat (1+)', 'High DP (-15)'],
    moves: [
      { id: 'k_paws', name: 'Savage Paws', type: 'dice_mult', costET: 1, baseAP: 5, desc: 'Roll 1 die × 5 AP claw damage' },
      { id: 'k_purr', name: 'Shadow Purr', type: 'flat', costET: 1, baseAP: 30, desc: 'Deals 30 AP shadow strike' },
      { id: 'k_fate', name: 'Claw of Fate', type: 'flat', costET: 2, baseAP: 45, desc: 'Deals 45 AP critical strike', isSuper: true },
      { id: 'k_wild', name: 'Wild Card Eclipse', type: 'flat', costET: 3, baseAP: 60, desc: 'Deals 60 AP void damage' },
      { id: 'k_blitz', name: 'Saigo No Blitz', type: 'blitz', costET: 5, baseAP: 200, desc: 'Requires HP < 50. 200 AP lethal blast' }
    ]
  },
  kiko: {
    id: 'kiko',
    name: 'Kiko the Monkey',
    title: 'Mystic Primate Illusionist',
    avatar: '🐵✨',
    themeColor: '#13c2c2',
    bgGradient: 'linear-gradient(135deg, #093436 0%, #031517 100%)',
    mindStrength: 3,
    mindDefBonus: 1, // Magical creature +1 Mind Def
    defaultDP: 10,
    retreatTarget: 4,
    weakness: { type: 'Fire', bonusAP: 10, icon: '🔥' },
    traits: ['Magical Mind Shield (+1)', 'Multiplicity Clones'],
    moves: [
      { id: 'm_whip', name: 'Tail Whip', type: 'dice_mult', costET: 1, baseAP: 4, desc: 'Roll 1 die × 4 AP whip damage' },
      { id: 'm_multi', name: 'Multiplicity', type: 'flat', costET: 1, baseAP: 30, desc: 'Deals 30 AP illusion damage' },
      { id: 'm_soul', name: 'Soul Blast 3000', type: 'flat', costET: 2, baseAP: 40, desc: 'Deals 40 AP mystic pulse', isSuper: true },
      { id: 'm_wild', name: 'Wild Card Astral Surge', type: 'flat', costET: 3, baseAP: 50, desc: 'Deals 50 AP magic damage' },
      { id: 'm_blitz', name: 'Saigo No Blitz', type: 'blitz', costET: 5, baseAP: 200, desc: 'Requires HP < 50. 200 AP ultimate destruction' }
    ]
  },
  shroomy: {
    id: 'shroomy',
    name: 'Shroomy',
    title: 'Spore Alchemist',
    avatar: '🍄💥',
    themeColor: '#52c41a',
    bgGradient: 'linear-gradient(135deg, #173d09 0%, #061403 100%)',
    mindStrength: 2,
    mindDefBonus: 1, // Magical creature +1 Mind Def
    defaultDP: 10,
    retreatTarget: 1, // Instant escape 1+
    weakness: { type: 'Fire', bonusAP: 10, icon: '🔥' },
    traits: ['Fast Retreat (1+)', 'High Damage Spores'],
    moves: [
      { id: 's_pop', name: 'Poppers per Pop', type: 'dice_mult', costET: 1, baseAP: 4, desc: 'Roll 1 die × 4 AP spore bursts' },
      { id: 's_bomba', name: 'Ms Bomba', type: 'flat', costET: 2, baseAP: 40, desc: 'Deals 40 AP explosive fungi', isSuper: true },
      { id: 's_snatch', name: 'Soul Snatcher', type: 'flat', costET: 2, baseAP: 50, desc: 'Deals 50 AP soul drain', isSuper: true },
      { id: 's_wild', name: 'Wild Card Toxic Bloom', type: 'flat', costET: 3, baseAP: 60, desc: 'Deals 60 AP nature blast' },
      { id: 's_blitz', name: 'Saigo No Blitz', type: 'blitz', costET: 5, baseAP: 200, desc: 'Requires HP < 50. 200 AP catastrophic detonation' }
    ]
  },
  poochi: {
    id: 'poochi',
    name: 'Poochi',
    title: 'Glitter Guardian',
    avatar: '🐶💖',
    themeColor: '#eb2f96',
    bgGradient: 'linear-gradient(135deg, #4a0d2e 0%, #17040e 100%)',
    mindStrength: 2,
    mindDefBonus: 1, // Magical creature +1 Mind Def
    defaultDP: 10,
    retreatTarget: 4,
    weakness: { type: 'Magic / Poison', bonusAP: 10, icon: '🧪' },
    traits: ['Magical Mind Shield (+1)', 'Lasso of Truth Reveal'],
    moves: [
      { id: 'p_sparks', name: 'Glitter Sparks', type: 'dice_mult', costET: 1, baseAP: 4, desc: 'Roll 1 die × 4 AP sparkle damage' },
      { id: 'p_lasso', name: 'Lasso of Truth', type: 'flat', costET: 2, baseAP: 25, reveal: true, desc: 'Deals 25 AP + Forces target to reveal Action Cards', isSuper: true },
      { id: 'p_burst', name: 'Glitter Burst', type: 'flat', costET: 2, baseAP: 35, desc: 'Deals 35 AP radiant burst', isSuper: true },
      { id: 'p_wild', name: 'Wild Card Starlight', type: 'flat', costET: 3, baseAP: 50, desc: 'Deals 50 AP dazzling strike' },
      { id: 'p_blitz', name: 'Saigo No Blitz', type: 'blitz', costET: 5, baseAP: 200, desc: 'Requires HP < 50. 200 AP cosmic supernova' }
    ]
  },
  queeny: {
    id: 'queeny',
    name: 'Queeny',
    title: 'Psychic Empress',
    avatar: '👑🔮',
    themeColor: '#fa8c16',
    bgGradient: 'linear-gradient(135deg, #452107 0%, #170a02 100%)',
    mindStrength: 2,
    mindAtkBonus: 2, // Queeny gets +2 to Kontrol attack roll!
    defaultDP: 10,
    retreatTarget: 4,
    weakness: { type: 'Fire / Glitch', bonusAP: 10, icon: '🔥' },
    traits: ['Psychic Kontrol Specialist (+2 Roll)', 'Siren Wave Attacks'],
    moves: [
      { id: 'q_whip', name: 'Hair Whip', type: 'dice_mult', costET: 1, baseAP: 4, desc: 'Roll 1 die × 4 AP sonic whip' },
      { id: 'q_siren', name: 'Siren Blast', type: 'flat', costET: 1, baseAP: 30, desc: 'Deals 30 AP psychic resonance' },
      { id: 'q_fan', name: 'Rainbow Fan Blast', type: 'flat', costET: 2, baseAP: 40, desc: 'Deals 40 AP prism storm', isSuper: true },
      { id: 'q_wild', name: 'Wild Card Mind Shatter', type: 'flat', costET: 3, baseAP: 55, desc: 'Deals 55 AP mental destruction' },
      { id: 'q_blitz', name: 'Saigo No Blitz', type: 'blitz', costET: 5, baseAP: 200, desc: 'Requires HP < 50. 200 AP ultimate mind overload' }
    ]
  }
};

export const ZOMBIE_PROFILE = {
  name: 'ZOMBIE INFECTED',
  title: 'Undead Plagued Husk',
  avatar: '🧟‍♂️☣️',
  themeColor: '#389e0d',
  bgGradient: 'linear-gradient(135deg, #133806 0%, #061402 100%)',
  baseHP: 40,
  turnRegen: 10,
  mindStrength: 0, // Mindless: Immune to Kontrol
  retreatTarget: 5, // Super slow
  weakness: { type: 'Fire & Lightning', desc: 'Takes full damage AND loses 1 Poison card on hit!', icon: '⚡🔥' },
  moves: [
    {
      id: 'z_venom',
      name: 'Venom Strike',
      type: 'zombie_infect',
      costET: 1,
      baseAP: 15,
      desc: 'Deals 15 AP damage and infects target with +1 Poison Card! (Spreads Zombie virus)'
    }
  ]
};

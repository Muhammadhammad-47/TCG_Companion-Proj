// TCG Card Game — Official Action Cards from Action Cards % - Sheet1.csv
// NOTE: KONTROL and BLITZ are CHARACTER ABILITIES (not action cards)
// They are part of each character's move set and are activated differently

export const ACTION_CARDS = [
  {
    id: 'atk_x1',
    name: 'ATTACK X1',
    type: 'ATTACK',
    costET: 1,
    icon: '⚔️',
    color: '#ff3b6b',
    desc: 'Standard combat attack. Pair with a character move (Costs 1 ET).'
  },
  {
    id: 'atk_x2',
    name: 'ATTACK X2',
    type: 'ATTACK',
    costET: 2,
    icon: '💥',
    color: '#ff9d2d',
    desc: 'Double character attack unleash (Costs 2 ET).'
  },
  {
    id: 'poison_x1',
    name: 'POISON X1',
    type: 'STATUS',
    costET: 0,
    icon: '☠️',
    color: '#39ff14',
    desc: 'Inflicts 1 Poison stack (-10 HP/turn). 5 Poison turns target into a Zombie! (0 ET)'
  },
  {
    id: 'poison_x2',
    name: 'POISON X2',
    type: 'STATUS',
    costET: 0,
    icon: '☠️☠️',
    color: '#39ff14',
    desc: 'Inflicts 2 Poison stacks (-20 HP/turn). (0 ET)'
  },
  {
    id: 'antidote_x1',
    name: 'ANTIDOTE X1',
    type: 'HEAL',
    costET: 0,
    icon: '🧪',
    color: '#2df6ff',
    desc: 'Removes 1 Poison card. (0 ET)'
  },
  {
    id: 'shield_basic',
    name: 'SHIELD BASIC +25 HP',
    type: 'DEFENSE',
    costET: 0,
    icon: '🛡️',
    color: '#3b9dff',
    desc: 'Grants +25 Shield barrier points. (0 ET)'
  },
  {
    id: 'heal_h10',
    name: 'HEAL H10',
    type: 'HEAL',
    costET: 0,
    icon: '💖',
    color: '#ff1a9d',
    desc: 'Restores +10 HP. (0 ET)'
  },
  {
    id: 'heal_h20',
    name: 'HEAL H20',
    type: 'HEAL',
    costET: 0,
    icon: '💖',
    color: '#ff1a9d',
    desc: 'Restores +20 HP. (0 ET)'
  },
  {
    id: 'retreat',
    name: 'RETREAT',
    type: 'TACTICAL',
    costET: 0,
    icon: '💨',
    color: '#7c8dff',
    desc: 'Escape combat without taking damage based on character retreat speed (0 ET).'
  },
  {
    id: 'lightning_x1',
    name: 'LIGHTNING X1',
    type: 'ATTACK',
    costET: 1,
    icon: '⚡',
    color: '#ffe93d',
    desc: 'Lightning strike dealing damage and -1 turn penalty (1 ET).'
  },
  {
    id: 'lightning_x2',
    name: 'LIGHTNING X2',
    type: 'ATTACK',
    costET: 2,
    icon: '⚡⚡',
    color: '#ffe93d',
    desc: 'Heavy lightning strike dealing damage, removes 1 Poison card, and -2 turn penalty (2 ET).'
  },
  {
    id: 'defence_d10',
    name: '+DEFENCE D10',
    type: 'DEFENSE',
    costET: 0,
    icon: '🛡️',
    color: '#3b9dff',
    defenseBonus: 10,
    desc: 'Gain +10 Defense bonus. Applies if you win clash or roll 6+ on defense. (0 ET)'
  },
  {
    id: 'defence_d15',
    name: '+DEFENCE D15',
    type: 'DEFENSE',
    costET: 0,
    icon: '🛡️',
    color: '#3b9dff',
    defenseBonus: 15,
    desc: 'Gain +15 Defense bonus. Applies if you win clash or roll 6+ on defense. (0 ET)'
  },
  {
    id: 'defence_d20',
    name: '+DEFENCE D20',
    type: 'DEFENSE',
    costET: 0,
    icon: '🛡️',
    color: '#3b9dff',
    defenseBonus: 20,
    desc: 'Gain +20 Defense bonus. Applies if you win clash or roll 6+ on defense. (0 ET)'
  },
  {
    id: 'revive_card',
    name: 'REVIVE',
    type: 'HEAL',
    costET: 0,
    icon: '💀',
    color: '#2df6ff',
    desc: 'If defeated, use to re-enter at 50% HP. (0 ET)'
  },
  {
    id: 'backstab',
    name: 'BACK STAB',
    type: 'ATTACK',
    costET: 1,
    icon: '🗡️',
    color: '#ff3b6b',
    desc: 'Bypass defenses. Deals 25 AP. Only works in 3+ player matches. (1 ET)'
  },
  {
    id: 'vitality_v10',
    name: 'VITALITY GAIN V10',
    type: 'VITALITY',
    costET: 0,
    icon: '⭐',
    color: '#ffd700',
    minLevel: 1,
    desc: 'Gain vital energy to unlock Level 2 (0 ET). Requires Level 1+.'
  },
  {
    id: 'vitality_v20',
    name: 'VITALITY GAIN V20',
    type: 'VITALITY',
    costET: 0,
    icon: '⭐⭐',
    color: '#ffd700',
    minLevel: 2,
    desc: 'Gain vital energy to unlock Level 3 (0 ET). Requires Level 2+.'
  },
  {
    id: 'vitality_v30',
    name: 'VITALITY GAIN V30',
    type: 'VITALITY',
    costET: 0,
    icon: '⭐⭐⭐',
    color: '#ffd700',
    minLevel: 3,
    desc: 'Gain vital energy to unlock Level 4 (0 ET). Requires Level 3+.'
  },
  {
    id: 'vitality_v40',
    name: 'VITALITY GAIN V40',
    type: 'VITALITY',
    costET: 0,
    icon: '⭐⭐⭐⭐',
    color: '#ffd700',
    minLevel: 4,
    desc: 'Gain vital energy to unlock Level 5 (0 ET). Requires Level 4+.'
  },
  {
    id: 'kontrol_card',
    name: 'KONTROL',
    type: 'KONTROL',
    costET: 2,
    icon: '🎮',
    color: '#9d4edd',
    desc: 'Take direct control of opponent. Swap 1 action card from their hand with one from yours (2 ET). Character ability activation.'
  }
];

export const GAME_LIMITS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  MAX_ET: 10,
  STARTING_ET: 5,
  BASE_HP: 100,
  LEVEL_2_HP: 150,
  MAX_HP: 200,
  ZOMBIE_POISON_TRIGGER: 5,
  WINNING_CRYSTALS: 3
};

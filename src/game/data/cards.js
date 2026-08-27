// TCG Card Game — Official 10 Action Cards from GDD

export const ACTION_CARDS = [
  {
    id: 'atk_basic',
    name: 'Attack',
    category: 'Attack',
    costET: 1,
    icon: '⚔️',
    color: '#ff3b6b',
    desc: 'Standard combat attack. Pair with a character move (Costs 1 ET).'
  },
  {
    id: 'atk_super',
    name: 'Super Attack',
    category: 'Attack',
    costET: 2,
    icon: '💥',
    color: '#ff9d2d',
    desc: 'High-power combat technique (Costs 2 ET).'
  },
  {
    id: 'poison_card',
    name: 'Poison',
    category: 'Status',
    costET: 1,
    icon: '☠️',
    color: '#39ff14',
    desc: 'Inflicts 1 Poison stack (-10 HP per stack every round). 5 Poison turns target into a Zombie!'
  },
  {
    id: 'antidote_card',
    name: 'Antidote',
    category: 'Heal',
    costET: 1,
    icon: '🧪',
    color: '#2df6ff',
    desc: 'Removes 1 Poison card and restores +20 HP. Cures Zombie Mode if poison drops below 5!'
  },
  {
    id: 'shield_card',
    name: 'Shield',
    category: 'Defense',
    costET: 1,
    icon: '🛡️',
    color: '#3b9dff',
    desc: 'Deploys a defensive barrier granting +30 Shield points to absorb incoming damage.'
  },
  {
    id: 'heal_card',
    name: 'Heal',
    category: 'Heal',
    costET: 1,
    icon: '💖',
    color: '#ff1a9d',
    desc: 'Restores +30 HP immediately.'
  },
  {
    id: 'amplify_card',
    name: 'Amplify',
    category: 'Bonus',
    costET: 0,
    icon: '⚡',
    color: '#ffb02e',
    desc: 'Boost active action with 1 effect: +20 HP, +20 AP attack, or +10 DP defense (0 ET).'
  },
  {
    id: 'kontrol_card',
    name: 'Kontrol',
    category: 'Special',
    costET: 3,
    icon: '🧠',
    color: '#a855f7',
    desc: 'Roll 1 die > target Mind Strength. Force them to attack another opponent or steal 1 Action Card (3 ET, Max 2/match).'
  },
  {
    id: 'blitz_card',
    name: 'Blitz (Saigo No Blitz)',
    category: 'Ultimate',
    costET: 5,
    icon: '⚡',
    color: '#ffe93d',
    desc: 'Requires HP < 50. Sacrifices 50% remaining HP to unleash 200 AP devastation across opponents (5 ET, Max 2/match).'
  },
  {
    id: 'retreat_card',
    name: 'Retreat',
    category: 'Tactical',
    costET: 0,
    icon: '💨',
    color: '#7c8dff',
    desc: 'Roll 1 die to escape combat without taking damage based on character speed (0 ET).'
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

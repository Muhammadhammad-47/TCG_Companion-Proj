// TCG Card Game — action & special cards
export const ACTION_CARDS = [
  {
    id: 'atk_basic',
    name: 'Attack',
    category: 'Attack',
    costET: 1,
    icon: '⚔️',
    color: '#ff3b6b',
    desc: 'Standard attack. Pair with a move.'
  },
  {
    id: 'atk_super',
    name: 'Super Attack',
    category: 'Attack',
    costET: 2,
    icon: '💥',
    color: '#ff9d2d',
    desc: 'High-power attack.'
  },
  {
    id: 'poison_card',
    name: 'Poison',
    category: 'Status',
    costET: 1,
    icon: '☠️',
    color: '#39ff14',
    desc: '-10 HP a round. 5 = zombie.'
  },
  {
    id: 'antidote_card',
    name: 'Antidote',
    category: 'Heal',
    costET: 1,
    icon: '🧪',
    color: '#2df6ff',
    desc: '-1 poison, +20 HP.'
  },
  {
    id: 'shield_card',
    name: 'Shield',
    category: 'Defense',
    costET: 1,
    icon: '🛡️',
    color: '#3b9dff',
    desc: '+30 shield.'
  },
  {
    id: 'heal_card',
    name: 'Heal',
    category: 'Heal',
    costET: 1,
    icon: '💖',
    color: '#ff1a9d',
    desc: '+30 HP.'
  },
  {
    id: 'kontrol_card',
    name: 'Kontrol',
    category: 'Special',
    costET: 3,
    icon: '🧠',
    color: '#a855f7',
    desc: 'Beat their Mind — steal a card or a move.'
  },
  {
    id: 'blitz_card',
    name: 'Blitz',
    category: 'Ultimate',
    costET: 5,
    icon: '⚡',
    color: '#ffe93d',
    desc: 'HP < 50. Spend half your HP for 200 AP.'
  },
  {
    id: 'amplify_card',
    name: 'Amplify',
    category: 'Bonus',
    costET: 0,
    icon: '⚡',
    color: '#ffb02e',
    desc: '+20 HP, +20 AP or +10 DP.'
  },
  {
    id: 'retreat_card',
    name: 'Retreat',
    category: 'Tactical',
    costET: 0,
    icon: '💨',
    color: '#7c8dff',
    desc: 'Roll to escape combat.'
  }
];

export const GAME_LIMITS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  MAX_ET: 10,
  STARTING_ET: 5,
  MAX_POISON: 10
};


// Attention TCG Action & Special Cards
export const ACTION_CARDS = [
  {
    id: 'atk_basic',
    name: 'Attack Card',
    category: 'Attack',
    costET: 1,
    icon: '⚔️',
    color: '#ff4d4f',
    desc: 'Perform a standard character attack. Requires 1 Energy Token and pairing with a Character Card.'
  },
  {
    id: 'atk_super',
    name: 'Super Attack Card',
    category: 'Attack',
    costET: 2,
    icon: '💥',
    color: '#ff7a45',
    desc: 'Unleash a high-power Super Attack technique. Requires 2 Energy Tokens.'
  },
  {
    id: 'poison_card',
    name: 'Poison Card',
    category: 'Status',
    costET: 1,
    icon: '☠️',
    color: '#a0d911',
    desc: 'Attach Poison to target. Deals -10 or -20 HP damage every round. Accumulating 5 Poison turns a player into a ZOMBIE!'
  },
  {
    id: 'antidote_card',
    name: 'Antidote Card',
    category: 'Heal',
    costET: 1,
    icon: '🧪',
    color: '#36cfc9',
    desc: 'Remove 1 Poison Card and restore 20 HP. If used while infected as a Zombie, removing poison below 5 cures Zombie Mode!'
  },
  {
    id: 'shield_card',
    name: 'Shield Card',
    category: 'Defense',
    costET: 1,
    icon: '🛡️',
    color: '#1890ff',
    desc: 'Grants +30 Temporary Shield to absorb incoming damage from attacks.'
  },
  {
    id: 'heal_card',
    name: 'Heal / Vitality Card',
    category: 'Heal',
    costET: 1,
    icon: '💖',
    color: '#eb2f96',
    desc: 'Restores +30 HP to the active character. Helps reach 150 HP Level-Up threshold.'
  },
  {
    id: 'kontrol_card',
    name: 'Kontrol Card',
    category: 'Special',
    costET: 3,
    icon: '🧠',
    color: '#722ed1',
    desc: 'Pair with an attack card. Roll 1 die vs Opponent Mind Strength (1–6). If you roll higher: force target to attack another player or take 1 Action card! (Max 2 per match, fails on Zombies)'
  },
  {
    id: 'blitz_card',
    name: 'Saigo No Blitz Card',
    category: 'Ultimate',
    costET: 5,
    icon: '⚡',
    color: '#fadb14',
    desc: 'Only usable when HP < 50. Sacrifices 50% remaining HP to deal 200 AP catastrophe to 1 target or split among defenders.'
  },
  {
    id: 'amplify_card',
    name: 'Sue Ellen V2 Amplify',
    category: 'Bonus',
    costET: 0,
    icon: '⚡',
    color: '#faad14',
    desc: 'Boost active card with choice: +20 HP, +20 AP, or +DP. No dice roll required.'
  },
  {
    id: 'retreat_card',
    name: 'Retreat Card',
    category: 'Tactical',
    costET: 0,
    icon: '💨',
    color: '#597ef7',
    desc: 'Attempt to retreat from combat. Roll 1 die against your character RP target to escape successfully.'
  }
];

export const GAME_LIMITS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  MAX_ET: 10,
  STARTING_ET: 5,
  MAX_POISON: 10
};


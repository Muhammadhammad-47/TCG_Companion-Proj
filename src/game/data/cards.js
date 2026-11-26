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
    desc: 'Standard combat attack. An Attack X1 is only functional if the player has Character Card Moves. Strictly allows the player to have only one turn regardless if the attack is successful or not. (Costs 1 ET)'
  },
  {
    id: 'atk_x2',
    name: 'ATTACK X2',
    type: 'ATTACK',
    costET: 2,
    icon: '💥',
    color: '#ff9d2d',
    desc: 'Attack X2 only allows the player to have two turns regardless if the attack is successful or not. An Attack X1/X2 is only functional if the player has Character Card Moves. However, if the player uses their Retreat Card, they will not receive two attacks. The whole Attack X2 is forfeited and the turn goes to the next player. (Costs 2 ET)'
  },
  {
    id: 'poison_x1',
    name: 'POISON X1',
    type: 'STATUS',
    costET: 0,
    icon: '☠️',
    color: '#39ff14',
    desc: 'Initial damage: -10 HP from Poison X1 (-20 HP against Poison weakness: CHYNAMAN aka CHYNA, KIKO, Kat, Bee, Pooch with -10 HP one-time weakness penalty). Ongoing damage: -10 HP per turn until treated with an Antidote Card. Additional -10 HP weakness penalty activates again if another player attacks with another Poison Card. (0 ET)'
  },
  {
    id: 'poison_x2',
    name: 'POISON X2',
    type: 'STATUS',
    costET: 0,
    icon: '☠️☠️',
    color: '#39ff14',
    desc: 'Initial damage: -20 HP from Poison X2 (-30 HP against Poison weakness: CHYNAMAN aka CHYNA, KIKO, Kat, Bee, Pooch with -10 HP one-time weakness penalty). Ongoing damage: -20 HP per turn until treated with an Antidote Card. Additional -10 HP weakness penalty activates again if another player attacks with another Poison Card. (0 ET)'
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
    desc: 'Grants +25 Shield barrier points. Does NOT prevent damage from Poison or Fire attacks (Poison Cards, Fire Flame, Chynaman Fire attacks, Shroomy Poison attacks, etc.). (0 ET)'
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
    desc: 'Disengage or forfeit combat. Only appears if held in Action Deck. Attacker can retreat before/after roll (before Defender rolls). Defender can retreat before rolling (0 ET).'
  },
  {
    id: 'lightning_x1',
    name: 'LIGHTNING X1',
    type: 'ATTACK',
    costET: 1,
    icon: '⚡',
    color: '#ffe93d',
    desc: 'On a successful attack, the defendant will receive -10 HP and the attacker receives another turn. If not successful, nothing happens (1 ET).'
  },
  {
    id: 'lightning_x2',
    name: 'LIGHTNING X2',
    type: 'ATTACK',
    costET: 2,
    icon: '⚡⚡',
    color: '#ffe93d',
    desc: 'On a successful attack, the defendant will receive -20 HP and the attacker receives 2 extra turns. Cleanses 1 Poison card ONLY from Zombies. If not successful, nothing happens (2 ET).'
  },
  {
    id: 'fire_flame_x1',
    name: 'FIRE FLAME X1',
    type: 'ATTACK',
    costET: 1,
    icon: '🔥',
    color: '#ff4d00',
    desc: 'On a successful attack, deals -10 HP and burns opponent (-10 HP each turn until doubles are rolled). Prompt asks to roll to extinguish before each turn (1 ET).'
  },
  {
    id: 'fire_flame_x2',
    name: 'FIRE FLAME X2',
    type: 'ATTACK',
    costET: 1,
    icon: '🔥🔥',
    color: '#ff4d00',
    desc: 'On a successful attack, deals -20 HP and burns opponent (-20 HP each turn until doubles are rolled). Prompt asks to roll to extinguish before each turn (1 ET).'
  },
  {
    id: 'defence_d5',
    name: '+DEFENCE D5',
    type: 'DEFENSE',
    costET: 0,
    icon: '🛡️',
    color: '#00f0ff',
    defenseBonus: 5,
    desc: 'Adds +5 Defense Points during incoming attack clash. (0 ET)'
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
    id: 'defence_full_guard',
    name: 'DEFENCE FULL GUARD',
    type: 'DEFENSE',
    costET: 0,
    icon: '🛡️',
    color: '#3b9dff',
    defenseBonus: 50,
    desc: 'Roll doubles to evade an attack. If Blitz Card is active 50% of the damage will be dealt. (0 ET)'
  },
  {
    id: 'heal_h30',
    name: 'HEAL H30',
    type: 'HEAL',
    costET: 0,
    icon: '💚',
    color: '#39ff14',
    healAmount: 30,
    desc: 'Restores +30 HP (up to character max HP). (0 ET)'
  },
  {
    id: 'shield_advance_100',
    name: 'SHIELD ADVANCE +100 HP',
    type: 'DEFENSE',
    costET: 0,
    icon: '🛡️',
    color: '#00f0ff',
    shieldAmount: 100,
    desc: 'Grants +100 Advanced Shield barrier points. (0 ET)'
  },
  {
    id: 'shield_sacred_protection',
    name: 'SHIELD SACRED PROTECTION',
    type: 'DEFENSE',
    costET: 0,
    icon: '✨',
    color: '#ffd700',
    shieldAmount: 100,
    desc: 'Negates all status effects of poison, burns, curses, etc for 1 turn. (0 ET)'
  },
  {
    id: 'shield_fire_50',
    name: 'SHIELD FIRE +50 HP',
    type: 'DEFENSE',
    costET: 0,
    icon: '🔥',
    color: '#ff4d00',
    shieldAmount: 50,
    desc: 'Protects your character HP from damage until it is destroyed. 0 damage from all fire attacks. Not immune to poison card. (0 ET)'
  },
  {
    id: 'xchange_full',
    name: 'X-CHANGE FULL',
    type: 'OTHERS',
    costET: 0,
    icon: '🔄',
    color: '#a855f7',
    desc: 'Exchange cards with all opponents. (0 ET)'
  },
  {
    id: 'revive_card',
    name: 'REVIVE',
    type: 'HEAL',
    costET: 0,
    icon: '💀',
    color: '#2df6ff',
    desc: 'Used only when defeated or dies. Quit or continue note pops up: if continue, card is discarded, Action card re-appears, returns at 50% HP. (0 ET)'
  },
  {
    id: 'backstab',
    name: 'BACK STAB',
    type: 'ATTACK',
    costET: 1,
    icon: '🗡️',
    color: '#ff3b6b',
    desc: 'Break your alliance or servitude cleanly without receiving the -40 HP penalty AND launch an immediate surprise attack against your ex-ally (3+ players only). Bypasses defenses and shields. (1 ET)'
  },
  {
    id: 'soul_alliance',
    name: 'SOUL ALLIANCE',
    type: 'OTHERS',
    costET: 0,
    icon: '🤝',
    color: '#00f0ff',
    desc: 'Forge a Secret Soul Alliance with another player (3+ players only). Trade ET and REVIVE cards. (0 ET)'
  },
  {
    id: 'abandon',
    name: 'ABANDON',
    type: 'OTHERS',
    costET: 0,
    icon: '💔',
    color: '#ff2a6d',
    desc: 'Break your alliance or servitude cleanly without receiving the -40 HP penalty (3+ players only). (0 ET)'
  },
  {
    id: 'freeze_x1',
    name: 'FREEZE X1',
    type: 'STATUS',
    costET: 0,
    icon: '❄️',
    color: '#a5f3fc',
    desc: 'Target loses 1 turn and receives -2 penalty on their dice roll. Announces: "You are frozen". (0 ET)'
  },
  {
    id: 'freeze_x2',
    name: 'FREEZE X2',
    type: 'STATUS',
    costET: 0,
    icon: '❄️❄️',
    color: '#a5f3fc',
    desc: 'Target loses 2 turns and receives -4 penalty on their dice roll. Announces: "You are frozen". (0 ET)'
  },
  {
    id: 'sleepy_x1',
    name: 'SLEEPY X1',
    type: 'OTHERS',
    costET: 0,
    icon: '💤',
    color: '#a855f7',
    desc: 'Target falls asleep and skips 1 turn. Announces: "You are Asleep". (0 ET)'
  },
  {
    id: 'sleepy_x2',
    name: 'SLEEPY X2',
    type: 'OTHERS',
    costET: 0,
    icon: '💤💤',
    color: '#a855f7',
    desc: 'Target sleeps for 2 turns and skips their turns. Announces: "You are Asleep". (0 ET)'
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

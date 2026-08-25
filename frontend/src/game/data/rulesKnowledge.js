// Attention TCG Official Rules, Glossaries, and FAQ Knowledge Pack
export const RULES_KNOWLEDGE = [
  {
    topic: 'Game Lore & Objective',
    keywords: ['lore', 'story', 'goal', 'objective', 'caca', 'cacathar', 'stability crystal', 'win'],
    shortAnswer: 'Defeat opponents to claim their Stability Crystals. The first warrior to hold 3 Stability Crystals saves their world from Cacá (Cacáthar) and wins!',
    details: 'In Attention TCG, the evil entity Cacá (The Devourer of Souls) has absorbed the life forces across universes. Each player starts with 1 Stability Crystal (2 in 1v1). Collect 3 crystals through combat victories to win the match.'
  },
  {
    topic: '2-Dice Rolling & Defense Rule',
    keywords: ['dice', 'defense', 'roll', 'dp', 'defense power', 'basic defense', '6'],
    shortAnswer: 'Attacker rolls 2 Red dice vs Defender 2 Gold dice. If Defender rolls 6 or more total, their innate DP (e.g. -10 or -15) reduces incoming AP damage.',
    details: 'Even if the defender loses the roll, rolling a combined minimum of 6 from 2 dice activates their character\'s basic DP defense. If the roll is under 6, the player receives the full amount of incoming attack AP.'
  },
  {
    topic: 'Energy Tokens (ET)',
    keywords: ['energy', 'token', 'et', 'black', 'red', 'purple', 'gold', 'claim'],
    shortAnswer: 'ET fuels techniques: Black = 1 ET, Red = 2 ET, Purple/Gold = 3 ET. Players start with 5 ET and can claim +1 ET at the start of each turn.',
    details: 'Regular attacks cost 1 ET, Super attacks cost 2 ET, Kontrol costs 3 ET, and Blitz requires 5 ET. If a player forgets to claim their +1 ET before ending their turn, it cannot be claimed retroactively!'
  },
  {
    topic: 'Zombie Mode Rules & Transformation',
    keywords: ['zombie', 'poison', '5 poison', 'venom strike', 'revive', 'undead', 'cure', 'antidote'],
    shortAnswer: 'Accumulating 5 Poison cards triggers Zombie Mode. Zombie HP becomes 40, gets +10 HP regen/turn, deals Venom Strike, and revives if reduced to 0 HP.',
    details: 'While in Zombie Mode:\n• Character cards are disabled; only Venom Strike (infects target with Poison) can be used.\n• Cannot win or claim Stability Crystals.\n• Immune to Kontrol (mindless).\n• Fire & Lightning attacks deal damage AND remove 1 poison card.\n• If HP drops to 0, revives at 10 HP (5 poison), 20 HP (6+ poison), or 40 HP (8+ poison).\n• Antidote or reducing poison below 5 cures Zombie Mode immediately and reverts to pre-infection HP.'
  },
  {
    topic: 'Kontrol Card & Mind Strength',
    keywords: ['kontrol', 'mind strength', 'control', 'mind', 'queeny', 'brain', 'cooldown'],
    shortAnswer: 'Costs 3 ET. Roll 1 die > Opponent\'s Mind Strength (1–6). If successful, force opponent to attack someone else or steal 1 Action Card.',
    details: 'Mind Strength ranking: Bee (5), Chynaman (4), Katsumi (3), Kiko (3), Poochi (2), Queeny (2), Shroomy (2).\n• Queeny gains +2 to her attack roll for mind control.\n• Magical creatures (Kiko, Poochi, Shroomy) gain +1 to defend their mind.\n• Kontrol has a 5-turn cooldown (or max 2 uses per match) and completely fails against Zombies.'
  },
  {
    topic: 'Saigo No Blitz (Ultimate)',
    keywords: ['blitz', 'saigo', 'ultimate', '200 ap', '50 hp', 'destroy'],
    shortAnswer: 'Costs 5 ET. Usable only when HP is under 50. Sacrifices 50% remaining HP to unleash 200 AP destruction (max 2 per match).',
    details: 'Can be used 1-vs-1 or 1-vs-All. In 1-vs-All, all losing defenders divide the 200 AP equally (e.g. 2 losing defenders take 100 AP each; 5 take 40 AP each).'
  },
  {
    topic: 'Level Up Rule',
    keywords: ['level up', 'level', '150 hp', 'level 2'],
    shortAnswer: 'Players unlock Level 2 attacks once their HP reaches 150+ (via Heal, Vitality, or Amplify cards).',
    details: 'Once leveled up to Level 2+, players may freely unleash Level 2 techniques. Their HP does not decrease below level requirements unless damaged in combat.'
  },
  {
    topic: 'Retreat Mechanics',
    keywords: ['retreat', 'rp', 'retreat points', 'escape', 'run'],
    shortAnswer: 'Roll 1 die with a Retreat Card. If roll meets character requirement (e.g., Katsumi/Shroomy 1+, Bee 3+), retreat is successful.',
    details: 'The lower the target number, the faster the character. Katsumi and Shroomy only require 1+ on a single die, while Bee requires 3+.'
  },
  {
    topic: 'Character Weaknesses',
    keywords: ['weakness', 'element', 'bonus damage', 'poison weakness', 'fire weakness'],
    shortAnswer: 'Attacks matching a defender\'s weakness deal +10 to +15 bonus AP damage if the attack lands.',
    details: '• Katsumi: Poison (+15 AP)\n• Bee, Chynaman, Poochi: Magic / Poison (+10 AP)\n• Kiko, Shroomy, Queeny: Fire (+10 AP)\n• Zombies: Fire & Lightning (removes 1 poison card on hit).'
  }
];

export const SUGGESTED_QUERIES = [
  "How does 2-dice defense work?",
  "How does a player turn into a Zombie?",
  "Can Zombies win Stability Crystals?",
  "What is Mind Strength & Kontrol?",
  "How do you use Saigo No Blitz?",
  "How do you cure Zombie Mode?",
  "What is Katsumi's weakness?"
];

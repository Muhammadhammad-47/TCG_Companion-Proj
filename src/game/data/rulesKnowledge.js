// Attention TCG — Comprehensive Official Rulebook, Characters, Cards, Combat Math, and Zombie Mode Knowledge Pack

export const RULES_KNOWLEDGE = [
  {
    topic: 'Game Lore & Objective',
    keywords: ['lore', 'story', 'goal', 'objective', 'caca', 'cacathar', 'stability crystal', 'crystal', 'win', 'victory', 'universe', 'kill', 'steal'],
    shortAnswer: 'Defeat opponents to claim their Stability Crystals. The first warrior to hold 3 Stability Crystals saves their world from Cacá and wins the match!',
    details: 'In the Attention universe, the evil cosmic being Cacá (Cacáthar, The Devourer of Souls) has absorbed the life force and soul energy of all dimensions, causing worlds to collapse into instability.\n\n• Each player begins with 1 Stability Crystal (or 2 Crystals in a 1v1 duel).\n• Defeating an opponent (reducing them to 0 HP) allows you to steal 1 Stability Crystal from them.\n• The first warrior to collect 3 Stability Crystals restores balance to the universe and instantly triggers a Victory.'
  },
  {
    topic: '2-Stage Clash Roll & Defense Point (DP) Rule',
    keywords: ['dice', 'defense', 'roll', 'dp', 'defense point', 'defense power', 'basic defense', '6', 'gold dice', 'red dice', 'combat', 'clash', 'doubles'],
    shortAnswer: 'Combat is a 2-Stage Clash. Phase 1: Both roll 2 dice; attacker must roll higher to hit. Phase 2: Attacker rolls 1 die for AP multiplier. Defender DP activates if they roll 6+.',
    details: 'Combat Resolution Rules:\n1. Phase 1 (The Clash): Attacker rolls 2 Red dice, Defender rolls 2 Gold dice. If Attacker Sum > Defender Sum, the attacker wins the clash. If the attacker loses, they miss entirely (0 Damage).\n2. Phase 2 (Multiplier): If the attacker wins the clash, they clear the gold dice and roll 1 single red die to determine their AP multiplier.\n3. 6+ Defense Check: If the Defender\'s 2-dice sum during the clash is 6 or greater (≥6), their innate DP armor activates (e.g. -15 AP or -10 AP).\n4. Doubles Rule: If a player rolls doubles (e.g., two 4s) during the clash, they instantly claim 1 Chance Card and get a Re-roll!'
  },
  {
    topic: 'Energy Tokens (ET) Economy',
    keywords: ['energy', 'token', 'et', 'black', 'red', 'purple', 'gold', 'claim', 'cost', 'trade', 'economy'],
    shortAnswer: 'Players start with 5 ET and can claim +1 ET during their turn. Energy Tokens fuel all card moves and special techniques.',
    details: 'Energy Token Mechanics:\n• Token Values: Black = 1 ET, Red = 2 ET, Purple/Gold = 3 ET.\n• Starting Reserve: Each player starts the match with 5 ET.\n• "Use It or Lose It" Claim Rule: Players may claim 1 free Energy Token at any point *during* their turn. If a player clicks "END TURN" without having claimed their ET, they permanently forfeit it for that round!\n• Move Costs:\n  - Regular / Basic Attack: 1 ET\n  - Super Attack: 2 ET\n  - Kontrol Card: 3 ET\n  - Saigo No Blitz: 5 ET\n• Trade: ET may be traded between soul alliance teammates or as collateral for a Stability Crystal.'
  },
  {
    topic: 'Zombie Mode Transformation & Full Rules',
    keywords: ['zombie', 'poison', '5 poison', 'venom strike', 'revive', 'undead', 'cure', 'antidote', 'infection', 'zombie mode', 'horde'],
    shortAnswer: 'Accumulating 5+ Poison cards triggers Zombie Mode. Zombie HP becomes 40, gains +10 HP auto-regen per round, deals Venom Strike, and revives if reduced to 0 HP.',
    details: 'Official Attention TCG Zombie Mode GDD Rules:\n• Transformation: When a player reaches 5 Poison Cards, they immediately enter Zombie Mode.\n• Stats: Base HP becomes 40 HP (pre-infection HP is recorded).\n• Auto-Regeneration: At the start of each Zombie turn, they automatically recover +10 HP, even if damaged in the previous round.\n• Attack: Character moves are disabled and replaced by Venom Strike (successful hit infects target with +1 Poison card).\n• Revival Tiers: If a Zombie reaches 0 HP, they immediately revive:\n  - 5 Poison Cards: Revives at 10 HP\n  - 6–7 Poison Cards: Revives at 20 HP\n  - 8+ Poison Cards: Revives at 40 HP\n• Elemental Weakness: Fire and Lightning attacks deal normal damage AND remove 1 Poison Card from the Zombie (only removes poison while in Zombie Mode).\n• Mindless: Immune to Kontrol cards.\n• Winning Restriction: A Zombie cannot claim or win a Stability Crystal until cured.\n• Cure: Playing an Antidote or reducing poison below 5 immediately cures Zombie Mode and restores the player to their exact pre-zombie HP.'
  },
  {
    topic: 'Poison & Antidote Cards',
    keywords: ['poison card', 'antidote', 'cure poison', 'venom', 'poison damage', 'stacks'],
    shortAnswer: 'Poison deals recurring -10 HP damage at the start of each turn. 5 Poison cards turns a player into a Zombie. Antidote cures poison and stops Zombie Mode.',
    details: 'Poison & Antidote Rules:\n• Poison cards deal -10 HP damage to the afflicted player at the beginning of each of their turns until cured.\n• Reaching 5 Poison cards triggers immediate Zombie transformation.\n• Antidote Card: An infected player can play an Antidote on themselves to remove poison cards. Antidotes cannot be played on other players unless specified. When poison drops below 5, Zombie Mode ends immediately.'
  },
  {
    topic: 'Kontrol Card & Mind Strength System',
    keywords: ['kontrol', 'mind strength', 'control', 'mind', 'queeny', 'brain', 'cooldown', 'mental', 'mindless'],
    shortAnswer: 'Costs 3 ET. Both players roll 1 die; Controller must roll higher than target\'s Mind Strength (1–6) to take control of their turn or steal a card.',
    details: 'Mind Strength Ratings (1 to 6):\n• Zabina "Bee" Sole: 5\n• Chynaman: 4\n• Katsumi: 3\n• Kiko the Monkey: 3\n• Poochi: 2\n• Queeny: 2\n• Shroomy: 2\n\nSpecial Modifiers:\n• Queeny has psychic power: gains +2 to her attack roll when attempting mind control.\n• Magical Creatures (Kiko, Poochi, Shroomy): gain +1 to defend their mind.\n• Success Outcome: Force the opponent to attack another player (Victim becomes the active attacker for free at 0 ET cost) OR force them to surrender one chosen Action Card.\n• Cooldown: Max 2 Kontrol cards per match, with a 5-turn cooldown between uses.\n• Zombies are Mindless and completely immune to Kontrol.'
  },
  {
    topic: 'Saigo No Blitz (Ultimate Destruction)',
    keywords: ['blitz', 'saigo', 'saigo no blitz', 'ultimate', '200 ap', '50 hp', 'destroy', 'one vs all'],
    shortAnswer: 'Costs 5 ET. Usable only when HP is under 50. Sacrifices 50% remaining HP to deal a devastating 200 AP attack (max 2 per match).',
    details: 'Saigo No Blitz Rules:\n• Condition: HP must be below 50 (<50 HP).\n• Self-Cost: User immediately loses 50% of their current remaining HP.\n• 1-vs-1 Mode: Attacker rolls 2 dice vs Defender 2 dice. Highest roll wins (deals 200 AP on hit).\n• 1-vs-All Mode: Attacker rolls against all opponents. All losing defenders split the 200 AP equally (e.g. 2 losing defenders take -100 HP each; 5 take -40 HP each).\n• Aftershock Wave (QR Extra Card): Deals +20 HP damage to all enemies even if they dodge the main blast.\n• Limit: Maximum 2 Blitz uses per match.'
  },
  {
    topic: 'Character Weaknesses & Elemental Matchups',
    keywords: ['weakness', 'element', 'bonus damage', 'poison weakness', 'fire weakness', 'magic weakness', 'elements'],
    shortAnswer: 'Attacks matching a defender\'s elemental weakness deal +10 to +15 bonus AP damage when the attack lands.',
    details: 'Character Elemental Weakness Table:\n• Katsumi: Poison Weakness -> Takes Extra +15 AP damage from Poison attacks.\n• Zabina "Bee" Sole: Magic / Poison Weakness -> Takes Extra +10 AP damage.\n• Chynaman: Magic / Poison Weakness -> Takes Extra +10 AP damage.\n• Kiko the Monkey: Fire Weakness -> Takes Extra +10 AP damage from Fire attacks.\n• Shroomy: Fire Weakness -> Takes Extra +10 AP damage from Fire attacks.\n• Queeny: Fire Weakness -> Takes Extra +10 AP damage.\n• Poochi: Magic / Poison Weakness -> Takes Extra +10 AP damage.\n• Undead Zombie: Fire & Lightning Weakness -> Takes damage and removes 1 Poison Card on hit.'
  },
  {
    topic: 'Retreat Points (RP) & Escape System',
    keywords: ['retreat', 'rp', 'retreat points', 'escape', 'run', 'speed', 'retreat card'],
    shortAnswer: 'Roll 1 die with a Retreat Card. If your roll meets or exceeds your character\'s RP target, you escape combat successfully. The lower the number, the faster the warrior.',
    details: 'Retreat Target Numbers (Roll 1 Die):\n• Katsumi: 1+ (Instant/Super Fast)\n• Shroomy: 1+ (Instant/Super Fast)\n• Bee: 3+ (Requires rolling 3, 4, 5, or 6)\n• Undead Zombie: 5+ (Super Slow, requires rolling 5 or 6)\n\nRules: Playing a Retreat Card consumes 1 ET. Once resolved, the Retreat Card is discarded and a new Action Card is drawn.'
  },
  {
    topic: 'Level Up & Level 2 Cards',
    keywords: ['level up', 'level', '150 hp', 'level 2', 'evolution', 'empower'],
    shortAnswer: 'Players unlock Level 2 advanced cards once their HP reaches 150+ (via Heal, Vitality, or Amplify cards).',
    details: 'Level Up Mechanics:\n• Normal Starting HP is 100 (Max 200 HP).\n• When a player boosts their HP to 150 or higher, Level 2 attacks become unlocked.\n• Once unlocked, players can use Level 2 cards freely. Their Level 2 status stays active unless their HP is reduced in battle.'
  },
  {
    topic: 'Character Move Sets & Abilities',
    keywords: ['moves', 'chynaman', 'katsumi', 'bee', 'kiko', 'shroomy', 'queeny', 'poochi', 'attacks', 'character cards'],
    shortAnswer: 'Each character has 3 signature moves (Multiplier, Flat Attack, Super Attack) and distinct DP/RP/Mind stats.',
    details: 'Complete Character Roster:\n• Chynaman (100 HP, DP -15, Mind 4): Fire of Fury (1d × 5 AP, 1 ET), Fire Tiger Soul Punch (25 AP, 1 ET), Golden Mic Lightning (40 AP, 2 ET).\n• Katsumi (100 HP, DP -15, Mind 3, RP 1+): Savage Paws (1d × 5 AP, 1 ET), Shadow Purr (30 AP, 1 ET), Claw of Fate (40 AP, 2 ET).\n• Zabina "Bee" Sole (100 HP, DP -10, Mind 5, RP 3+): Sting Slap (1d × 3 AP, 1 ET), Paparazzi Stun (25 AP + Stun 1 turn, 1 ET), Bee Drone Bomb (40 AP, 2 ET).\n• Kiko the Monkey (100 HP, DP -10, Mind 3, Magic +1): Tail Whip (1d × 4 AP, 1 ET), Multiplicity (30 AP, 1 ET), Soul Blast 3000 (40 AP, 2 ET).\n• Shroomy (100 HP, DP -10, Mind 2, RP 1+): Poppers (1d × 4 AP, 1 ET), Ms. Bomba (40 AP, 1 ET), Soul Snatcher (50 AP, 2 ET).\n• Queeny (100 HP, DP -10, Mind 2, Mind Control +2): Hair Whip (1d × 4 AP, 1 ET), Siren Blast (30 AP, 1 ET), Rainbow Fan Blast (40 AP, 2 ET).\n• Poochi (100 HP, DP -10, Mind 2, Magic +1): Glitter Sparks (1d × 4 AP, 1 ET), Lasso of Truth (25 AP + reveals action cards, 1 ET), Glitter Burst (35 AP, 2 ET).'
  },
  {
    topic: 'Action Card Deck & Hand Rules',
    keywords: ['deck', 'action cards', 'hand', '10 cards', 'shuffle', 'draw', 'discard'],
    shortAnswer: 'Players maintain a hand of 10 Action Cards and 10 Character Cards. Action cards must be paired with Character cards to execute a move.',
    details: 'Hand & Deck Management:\n• Every player is dealt 10 Action Cards from the shuffled Action Card deck and holds 10 Character Cards of their chosen warrior.\n• During their turn, a player plays an Action Card paired with a Character Card in the center.\n• After the action resolves, discarded cards are replenished so the player maintains 10 Action Cards in hand.'
  },
  {
    topic: 'Amplify Card (Sue Ellen\'s V2)',
    keywords: ['amplify', 'sue ellen', 'boost', 'bonus card', '20 hp', '20 ap', 'buff'],
    shortAnswer: 'Boosts your active turn with 1 effect: +20 HP, +20 AP, or +DP armor boost. Costs 0 ET, requires no dice roll, and discards after use.',
    details: 'Amplify Card Rules:\n• Can be activated at 0 ET cost with no dice roll required.\n• Player chooses 1 of 3 enhancements:\n  1. +20 HP (Instant Healing)\n  2. +20 AP (Empower current attack)\n  3. +DP (Enhance armor for incoming defense)\n• Must be paired with an Attack card if used offensively.'
  },
  {
    topic: 'Shield & Heal Cards',
    keywords: ['shield', 'heal', 'absorb', 'protection', 'recovery', 'health'],
    shortAnswer: 'Heal restores +30 HP (1 ET). Shield grants +30 Shield points (1 ET) which absorbs incoming damage before HP is reduced.',
    details: 'Defense & Recovery Cards:\n• Heal Card: Restores +30 HP (cannot exceed max HP unless modified by level up/vitality). Costs 1 ET.\n• Shield Card: Generates a 30 HP barrier. When attacked, the shield absorbs incoming damage first. Any damage exceeding the shield value spills over into HP. Costs 1 ET.'
  },
  {
    topic: 'Turn Structure & Setup',
    keywords: ['setup', 'turn order', 'first player', 'rotation', 'clockwise', 'counter clockwise'],
    shortAnswer: 'All players roll 2 dice to determine who goes first. The highest roll selects their character and decides clockwise or counter-clockwise rotation.',
    details: 'Match Start Procedure:\n1. Dice Roll-Off: Every player rolls 2 dice. The highest total goes first.\n2. Rotation: The starting player chooses clockwise or counter-clockwise turn order.\n3. Unique Characters: No two players can select the same character.\n4. Starting Resources: 100 HP, 5 ET, 1 Stability Crystal (2 in 1v1), 10 Action Cards, 10 Character Cards.\n5. Turn Cycle: Active player claims +1 ET, plays paired Action/Character card, resolves combat dice or instant effects, and ends turn to advance rotation.'
  }
];

export const SUGGESTED_QUERIES = [
  "How does 2-dice defense work?",
  "How does a player turn into a Zombie?",
  "Can Zombies win Stability Crystals?",
  "What is Mind Strength & Kontrol?",
  "How do you use Saigo No Blitz?",
  "How do you cure Zombie Mode?",
  "What is Katsumi's weakness?",
  "How do Energy Tokens and claims work?",
  "How does Level Up 150+ HP work?",
  "What are the stats for Chynaman and Kiko?"
];


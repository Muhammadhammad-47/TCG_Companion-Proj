// Attention TCG - Official Knowledge Base
// All rules sourced strictly from the official GDD document (document.txt)

export const RULES_KNOWLEDGE = [
  {
    topic: 'Game Lore & Objective',
    keywords: ['lore', 'story', 'goal', 'objective', 'caca', 'cacathar', 'stability crystal', 'crystal', 'win', 'victory', 'universe', 'kill', 'steal', 'three crystals', '3 crystals'],
    shortAnswer: 'Defeat opponents to claim their Stability Crystals. The first warrior to hold 3 Stability Crystals saves their world from Caca (Cacathar, The Devourer of Souls) and wins!',
    details: 'The Story:\nIn the Anime Series Attention, the evil grand being Caca (Cacathar, The Devourer of Souls) has sucked out and absorbed all the worlds in the universe, causing all worlds to be unstable. Each character\'s mission is to obtain 3 Stability Crystals to bring life and stability back into their world.\n\nVictory Rules:\n- Each player begins with 1 Stability Crystal placed in front of them.\n- In a 2-player duel, each player starts with 2 Stability Crystals.\n- Defeating an opponent (reducing them to 0 HP) allows you to collect their Stability Crystal.\n- The first player to obtain 3 Stability Crystals wins and saves their world.\n- The winner may also choose to opt out while other players continue battling for the remaining crystals.'
  },
  {
    topic: 'Game Setup & How to Begin',
    keywords: ['setup', 'begin', 'start', 'how to play', 'first player', 'dice roll off', 'clockwise', 'counterclockwise', 'shuffle', '10 cards', 'starting', 'character select'],
    shortAnswer: 'All players roll 2 dice. Highest roll picks character first and decides clockwise or counterclockwise turn order. Each player starts with 5 ET, 1 Crystal, 10 Action Cards, and 10 Character Cards.',
    details: 'Match Setup Procedure:\n1. All players roll two dice. The player with the highest roll is the first player and decides turn rotation direction.\n2. The first player shuffles the Action Card deck and passes out 10 Action Cards to each player.\n3. Each player chooses one unique character. No two players can choose the same character.\n4. Each player receives 10 Character Cards of their chosen character.\n5. Players keep their Action Cards and Character Cards hidden.\n6. Each player receives 1 Stability Crystal Card (2 Crystals in a 2-player game).\n7. Each player starts with 5 Energy Tokens.\n\nTurn Cycle:\n- Active player may claim +1 ET (must request it, no one will remind them).\n- Player picks an Action Card and pairs it with a Character Card to make the action valid.\n- After resolving, discard the Action Card and Character Card and draw replacements.\n- Players must always maintain 10 Action Cards and 10 Character Cards in hand.'
  },
  {
    topic: '2-Stage Clash Roll & Defense Point (DP) Rule',
    keywords: ['dice', 'defense', 'roll', 'dp', 'defense point', 'defense power', 'basic defense', '6', 'gold dice', 'red dice', 'combat', 'clash', 'doubles', 'attack roll', 'two dice', 'miss'],
    shortAnswer: 'Phase 1 (Clash): Both roll 2 dice, attacker must roll higher to hit. Phase 2 (Multiplier): Attacker rolls 1 die for AP. Defender DP (-10 or -15 AP) activates if they roll 6+.',
    details: 'Combat Resolution:\n1. Phase 1 (The Clash): Attacker rolls 2 Red dice, Defender rolls 2 Gold dice. If Attacker Sum is greater than Defender Sum, the attacker wins. If the attacker loses or ties, they miss with 0 Damage.\n2. Phase 2 (The Multiplier): If the attacker wins, they roll 1 single die for their AP multiplier. Example: Chynaman rolls a 3 x 5 AP = 15 AP damage.\n3. Defense Point (DP) Check: If the Defender rolls 6 or higher on 2 dice during the clash, their DP armor activates and reduces incoming AP, even if they lost the clash.\n\nDP Values by Character:\n- Chynaman: -15 AP\n- Katsumi: -15 AP\n- Kiko the Monkey: -10 AP\n- Shroomy: -10 AP\n- Zabina Bee Sole: -10 AP\n- Poochi: -10 AP\n- Queeny: -10 AP\n\nDoubles Rule: If a player rolls doubles during the clash, they claim 1 Chance Card and get a free re-roll!'
  },
  {
    topic: 'Energy Tokens (ET) Economy',
    keywords: ['energy', 'token', 'et', 'black', 'red', 'purple', 'gold', 'claim', 'cost', 'trade', 'economy', 'energy token', 'spend', 'use it or lose it'],
    shortAnswer: 'Players start with 5 ET and can claim +1 ET during their turn. No one will remind you! If your turn ends without claiming, it is lost until your next turn.',
    details: 'Energy Token Mechanics:\n- Token Values: Black = 1 ET, Red = 2 ET, Purple/Gold = 3 ET.\n- Starting Reserve: Each player starts with 5 ET.\n- Use It or Lose It: Players may claim 1 free ET at any point during their turn. No one will remind the player. Once their turn ends, they cannot receive it until the next turn.\n- Move Costs:\n  Regular / Basic Attack: 1 ET\n  Super Attack: 2 ET\n  Kontrol Card: 3 ET\n  Saigo No Blitz: 5 ET\n- Trade: ET may be traded to another player if they are soul alliance, or used as collateral for a Stability Crystal won from an Alliance battle.'
  },
  {
    topic: 'Character Move Sets & Abilities',
    keywords: ['moves', 'chynaman', 'katsumi', 'bee', 'kiko', 'shroomy', 'queeny', 'poochi', 'attacks', 'character cards', 'abilities', 'fire of fury', 'tail whip', 'sting slap', 'poppers', 'glitter sparks', 'hair whip', 'savage paws', 'shadow purr', 'claw of fate', 'multiplicity', 'soul blast', 'ms bomba', 'soul snatcher', 'paparazzi', 'bee drone', 'lasso', 'glitter burst', 'siren blast', 'rainbow fan'],
    shortAnswer: 'Each character has a Multiplier Attack (1 die x AP), a Flat Attack, and a Super Attack (2 ET). All also have Wild Card, Kontrol, and Saigo No Blitz options.',
    details: 'Complete Character Move Sets:\n\nCHYNAMAN (DP -15):\n- Fire of Fury: 1 die x 5 AP (1 ET). Example: roll 3 = 15 AP.\n- Fire Tiger Soul Punch: 25 AP (1 ET)\n- Golden Mic Lightning: 40 AP (2 ET)\n- Wild Card: Variety of attacks, player chooses and adds required ET.\n- Kontrol: 3 ET.\n- Saigo No Blitz: 200 AP (5 ET)\n\nKIKO THE MONKEY (DP -10):\n- Tail Whip: 1 die x 4 AP (1 ET). Example: roll 3 = 12 AP.\n- Multiplicity: 30 AP (1 ET)\n- Soul Blast 3000: 40 AP (2 ET)\n- Wild Card, Kontrol, Saigo No Blitz\n\nSHROOMY (DP -10):\n- Poppers: 1 die x 4 AP (1 ET). Example: roll 3 = 12 AP.\n- Ms. Bomba: 40 AP (1 ET)\n- Soul Snatcher: 50 AP (2 ET)\n- Wild Card, Kontrol, Saigo No Blitz\n\nZABINA BEE SOLE (DP -10):\n- Sting Slap: 1 die x 3 AP (1 ET). Example: roll 3 = 9 AP.\n- Paparazzi Stun: 25 AP + Stun, opponent loses 1 turn on a successful hit (1 ET)\n- Bee Drone Bomb: 40 AP (2 ET)\n- Wild Card, Kontrol, Saigo No Blitz\n\nKATSUMI (DP -15):\n- Savage Paws: 1 die x AP multiplier (1 ET)\n- Shadow Purr: Flat AP attack (1 ET)\n- Claw of Fate: Flat AP attack (2 ET)\n- Wild Card, Kontrol, Saigo No Blitz\n\nPOOCHI (DP -10):\n- Glitter Sparks: 1 die x 4 AP (1 ET). Example: roll 3 = 12 AP.\n- Lasso of Truth: 25 AP + opponent must show all Action Cards on a successful hit (1 ET)\n- Glitter Burst: 35 AP (2 ET)\n- Wild Card, Kontrol, Saigo No Blitz\n\nQUEENY (DP -10):\n- Hair Whip: 1 die x 4 AP (1 ET). Example: roll 3 = 12 AP.\n- Siren Blast: 30 AP (1 ET)\n- Rainbow Fan Blast: Flat AP (2 ET)\n- Wild Card, Kontrol, Saigo No Blitz'
  },
  {
    topic: 'Wild Card Attacks',
    keywords: ['wild card', 'wild', 'variety', 'choose attack', 'extra moves'],
    shortAnswer: 'Wild Cards give a variety of attack options. The player picks the attack type and adds the required Energy Tokens for it.',
    details: 'Wild Card Rules:\n- Each character has Wild Card options in their move set.\n- When a Wild Card is played, the player may choose any attack variety available for that character.\n- The player must add the Energy Tokens required for the selected attack type (1 ET for Regular, 2 ET for Super, etc.).\n- Wild Cards offer strategic flexibility!'
  },
  {
    topic: 'Zombie Mode Transformation & Full Rules',
    keywords: ['zombie', 'poison', '5 poison', 'venom strike', 'revive', 'undead', 'cure', 'antidote', 'infection', 'zombie mode', 'horde', 'zombie card', 'mindless'],
    shortAnswer: 'Accumulating 5 Poison Cards triggers Zombie Mode. HP becomes 40, auto-regens +10 HP per turn, can only use Venom Strike (15 AP + infects), and revives if reduced to 0 HP.',
    details: 'Official Zombie Mode Rules:\nWhen a player has 5 Poison Cards, the dealer gives them a Zombie Mode Card placed face-up.\n\nZombie Mode Restrictions:\n- Cannot use any Character Cards or Character Card abilities.\n- Cannot win or claim a Stability Crystal Card (must be cured first).\n- All attacks must use the Zombie Mode Card only: Venom Strike (15 AP, infects target with +1 Poison Card on a successful hit).\n\nZombie Stats:\n- Starting HP: 40 HP (can only increase via Vitality or Heal cards).\n- Turn Regeneration: At the start of each Zombie turn, they automatically recover +10 HP, even if they took damage last round.\n- Kontrol Immunity: Mindless Zombies are completely immune to Kontrol Cards.\n\nRevival Rules (if Zombie HP reaches 0):\n- 5 Poison Cards: Revives at 10 HP.\n- 6 to 7 Poison Cards: Revives at 20 HP.\n- 8 or more Poison Cards: Revives at 40 HP.\n\nWeaknesses:\n- Fire and Lightning attacks deal normal damage AND remove 1 Poison Card on hit (only while in Zombie Mode).\n\nCuring Zombie Mode:\n- Playing an Antidote Card or reducing poison below 5 immediately cures the player.\n- Discard the Zombie Mode Card and return to the exact HP the player had before entering Zombie Mode.\n- Remaining poison cards continue dealing -10 HP per round until fully cured.'
  },
  {
    topic: 'Poison & Antidote Cards',
    keywords: ['poison card', 'antidote', 'cure poison', 'venom', 'poison damage', 'stacks', 'poisoned'],
    shortAnswer: 'Poison deals -10 HP at the start of each afflicted player\'s turn. Reaching 5 Poison Cards triggers Zombie Mode. An Antidote Card cures poison and cancels Zombie Mode.',
    details: 'Poison & Antidote Rules:\n- Each Poison Card deals -10 HP damage to the afflicted player at the beginning of each of their turns.\n- Reaching 5 Poison Cards triggers immediate Zombie Mode transformation.\n- Antidote Card: An infected player can play an Antidote to remove Poison Cards. When poison drops below 5, Zombie Mode ends immediately and the player returns to their pre-zombie HP.'
  },
  {
    topic: 'Kontrol Card & Mind Strength System',
    keywords: ['kontrol', 'mind strength', 'control', 'mind', 'queeny', 'brain', 'cooldown', 'mental', 'mindless', 'kontrol card', 'mind control', 'chance card kontrol'],
    shortAnswer: 'Costs 3 ET. Roll 1 die. Controller must roll higher than the target\'s Mind Strength (1 to 6) to force an attack or steal an Action Card. Max 2 uses per match, 5-turn cooldown.',
    details: 'Kontrol Card Rules:\nPair the Kontrol Card with an Attack Action Card (costs 3 ET). Both players roll 1 die.\n\nSuccess Condition: The controller must roll a number HIGHER than the opponent\'s Mind Strength.\n- Example: Opponent Mind Strength is 4, controller must roll 5 or 6.\n- If the controller fails, the Kontrol Card is discarded.\n\nSuccess Outcomes (choose one):\n- Force the opponent to attack another player (victim becomes active attacker at 0 ET cost).\n- Force opponent to show all Action Cards and surrender 1 of the controller\'s choice.\n\nMind Strength Ratings:\n- Katsumi: 3\n- Zabina Bee Sole: 5\n- Chynaman: 4\n- Kiko the Monkey: 3\n- Poochi: 2\n- Queeny: 2\n- Shroomy: 2\n\nSpecial Modifiers:\n- Queeny gains +2 to her roll when attacking for mind control.\n- Kiko, Poochi, and Shroomy (magical creatures) gain +1 to defend their mind.\n- Zombies are Mindless and completely immune to Kontrol Cards.\n\nCooldown: Max 2 Kontrol Cards per match, with a 5-turn cooldown between uses.\n\nKontrol QR Extra Card (if available): Must be played with the Kontrol Card and only usable on success. Effect: Restore 20 HP and deal 20 HP damage to the defender. Discard after use.'
  },
  {
    topic: 'Chance Cards',
    keywords: ['chance', 'chance card', 'luck', 'fate', 'doubles', 'chance roll'],
    shortAnswer: 'Chance Cards test your fate with good or bad effects. They are earned by rolling doubles during the combat clash dice roll.',
    details: 'Chance Card Rules:\n- Chance Cards are optional accessories in the game.\n- They test a player\'s fate and may give a good or bad effect depending on luck.\n- Chance Cards are earned when a player rolls doubles during the combat dice roll (both dice show the same number). The player claims 1 Chance Card and gets a free re-roll.\n\nChance Card & Kontrol Resistance:\nIf a player holds an Action Card: CHANCE, they may roll to resist being Kontrolled:\n- Mind Strength 1: Roll 5+\n- Mind Strength 2: Roll 4+\n- Mind Strength 3: Roll 4+\n- Mind Strength 4: Roll 2+\n- Mind Strength 5: Roll 2+'
  },
  {
    topic: 'Saigo No Blitz (Ultimate Destruction)',
    keywords: ['blitz', 'saigo', 'saigo no blitz', 'ultimate', '200 ap', '50 hp', 'destroy', 'one vs all', 'blitz card', 'aftershock'],
    shortAnswer: 'Costs 5 ET. Use ONLY when HP is below 50. Lose 50% of remaining HP. Deals 200 AP to 1 enemy or splits equally across all enemies. Max 2 uses per match.',
    details: 'Saigo No Blitz Rules:\n- Condition: HP must be below 50.\n- Self-Cost: User immediately loses 50% of their current remaining HP.\n- AP: 200 AP on a successful attack.\n\nOne vs. One Attack:\nBoth Attacker and Defender roll 2 dice. Whoever rolls highest wins. On success, defender takes 200 AP damage.\n\nOne vs. All Attack:\nAttacker rolls against all other players. Defenders who roll higher dodge. All losing defenders divide the 200 AP equally.\n- Example: 5 defenders lose, each takes 40 HP damage.\n- Example: 2 defenders lose, each takes 100 HP damage.\n\nBlitz QR Extra Card (if available): Must be played with the Blitz Card and only usable on success.\nEffect: Aftershock Wave inflicts 20 HP damage to ALL enemies. Discard after use. Effective even if a defender avoids the main attack.\n\nLimit: Maximum 2 Blitz uses per match.'
  },
  {
    topic: 'Character Weaknesses & Elemental Matchups',
    keywords: ['weakness', 'element', 'bonus damage', 'poison weakness', 'fire weakness', 'magic weakness', 'elements', 'extra damage', 'elemental'],
    shortAnswer: 'Attacks matching a defender\'s elemental weakness deal bonus AP damage when the attack lands.',
    details: 'Character Elemental Weakness Table (Official GDD):\n- Katsumi: Poison Weakness. Takes extra +15 AP damage on a successful hit.\n- Zabina Bee Sole: Magic and Poison Weakness. Takes extra +10 AP damage.\n- Chynaman: Magic and Poison Weakness. Takes extra +10 AP damage.\n- Kiko the Monkey: Fire Weakness. Takes extra +10 AP damage.\n- Shroomy: Fire Weakness. Takes extra +10 AP damage.\n- Queeny: Fire Weakness. Takes extra +10 AP damage. (Note: The card has a misprint showing Magic/Poison. The GDD uses Fire as the official weakness.)\n- Poochi: Magic and Poison Weakness. Takes extra +10 AP damage.\n- Undead Zombie: Fire and Lightning Weakness. Takes normal damage AND loses 1 Poison Card per hit (only while in Zombie Mode).'
  },
  {
    topic: 'Retreat Points (RP) & Escape System',
    keywords: ['retreat', 'rp', 'retreat points', 'escape', 'run', 'speed', 'retreat card', 'flee', 'run away'],
    shortAnswer: 'Roll 1 die with a Retreat Card. Higher RP value means a lower dice roll is needed to escape successfully.',
    details: 'Retreat System (from official GDD):\n- You must hold a Retreat Card to attempt a retreat.\n- Roll 1 die. If your result meets the required roll for your character\'s RP, you escape.\n\nRP Value to Required Roll:\n- RP 1: Must roll 5 or higher.\n- RP 2: Must roll 4 or higher.\n- RP 3: Must roll 3 or higher.\n- RP 4: Must roll 2 or higher.\n- RP 5: Must roll 1 or higher (instant escape, super fast).\n\nThe higher the RP number, the lower the roll needed. Higher RP means faster and easier escape.\n\nAfter a Retreat Card resolves (success or fail), it is discarded and the player draws a new Action Card.'
  },
  {
    topic: 'Level Up & Level 2 Cards',
    keywords: ['level up', 'level', '150 hp', 'level 2', 'evolution', 'empower', 'level two'],
    shortAnswer: 'Players unlock Level 2 advanced character cards once their HP reaches 150 or higher via Heal, Vitality, Amplify, or other boost cards.',
    details: 'Level Up Mechanics:\n- Normal Starting HP is 100. Maximum HP is 200.\n- When a player boosts their HP to 150 or higher, their Level 2 attacks become unlocked.\n- Level 2 cards are more powerful than Level 1 cards.\n- Once unlocked, players can freely use Level 2 cards. Their HP will not go down unless attacked.'
  },
  {
    topic: 'Amplify Card (Sue Ellen\'s V2)',
    keywords: ['amplify', 'sue ellen', 'boost', 'bonus card', '20 hp', '20 ap', 'buff', 'sue ellen v2'],
    shortAnswer: 'Sue Ellen\'s V2 Amplify Card boosts your active turn with 1 effect: +20 HP, +20 AP, or +DP. Costs 0 ET, no dice roll required, discard after use.',
    details: 'Amplify Card Rules (Sue Ellen\'s V2):\n- Effect: Boost your active card with 1 chosen effect:\n  +20 HP (Instant Healing)\n  +20 AP (Empower current attack)\n  +DP (Enhance defense power)\n- Cost: 0 ET. No Energy Tokens required.\n- No dice roll required to activate.\n- Must be paired with an Attack Card if used offensively.\n- Discard after use.'
  },
  {
    topic: 'Shield & Heal Cards',
    keywords: ['shield', 'heal', 'absorb', 'protection', 'recovery', 'health', 'heal card', 'shield card'],
    shortAnswer: 'Heal restores +30 HP (1 ET). Shield grants a 30 HP barrier (1 ET) that absorbs incoming damage before HP is reduced.',
    details: 'Defense & Recovery Cards:\n- Heal Card: Restores +30 HP. HP cannot exceed maximum unless a card effect states otherwise. Costs 1 ET.\n- Shield Card: Generates a 30 HP barrier. When attacked, the shield absorbs all incoming damage first. Any damage exceeding the shield value spills into the player\'s HP. Costs 1 ET.'
  },
  {
    topic: 'Action Cards & Hand Management',
    keywords: ['action card', 'deck', 'hand', '10 cards', 'shuffle', 'draw', 'discard', 'character card', 'card types', 'pair'],
    shortAnswer: 'Each player holds 10 Action Cards and 10 Character Cards. An Action Card MUST always be paired with a Character Card to make any move valid.',
    details: 'Action Card & Hand Rules:\n- Action Card: Determines the move on a player\'s turn. Must be paired with a Character Card to be valid.\n- Character Card: Determines the specific attack or defense, and shows the character\'s Retreat number and DP value.\n- Each player always maintains 10 Action Cards and 10 Character Cards in hand.\n- After an action resolves, both the Action Card and Character Card are discarded. The player immediately draws replacements.\n- If two Action Cards are used in one turn, two replacements are drawn at turn end.\n\nCard Types:\n- Action Cards: Determine moves such as Attack, Defend, Heal, and other effects.\n- Character Cards: Determine the attack type and character-specific powers.\n- Chance Cards: Test a player\'s fate with good or bad effects based on luck.'
  },
  {
    topic: 'Key Terminology & Glossary',
    keywords: ['terminology', 'terms', 'glossary', 'hp', 'ap', 'dp', 'rp', 'et', 'stacking', 'critical hit', 'combo', 'miss', 'status', 'cooldown', 'round', 'turn', 'ability', 'passive', 'active'],
    shortAnswer: 'HP = Health Points, AP = Attack Power, DP = Defense Power, RP = Retreat Points, ET = Energy Tokens. Stacking means using the same card multiple times at once.',
    details: 'Official Terminology:\n- HP (Health Points): The amount of life a player has. Reaches 0 = defeated.\n- AP (Attack Power): The damage dealt when an attack is successful.\n- DP (Defense Power): Reduces incoming AP when defender rolls 6+ on 2 dice during the clash.\n- RP (Retreat Points): Escape ability. Higher RP number = lower dice roll needed to flee.\n- ET (Energy Token): Resource spent to activate attacks and special abilities.\n- Stacking: Placing the same card on top of each other or using the same card simultaneously.\n- Critical Hit: An attack that deals additional damage when specific conditions are met.\n- Combo: A sequence of attacks or abilities working together for a stronger effect.\n- Counter: A defensive response that interrupts or retaliates against an opponent\'s action.\n- Miss: An attack that fails to hit and deals no damage.\n- Successful Attack: An attack that meets all requirements to hit and applies its effects.\n- Status Effect: A temporary condition like Poison, Stun, or Zombie Mode.\n- Cooldown: Number of turns to wait before using the same card or ability again.\n- Round: A complete cycle where every player has taken one turn.\n- Weakness: Attacks matching a character\'s elemental weakness deal bonus AP on hit.'
  }
];

export const SUGGESTED_QUERIES = [
  "How does the 2-Stage Clash combat system work?",
  "How does a player turn into a Zombie?",
  "Can Zombies win Stability Crystals?",
  "What is Mind Strength and how does Kontrol work?",
  "How do you use Saigo No Blitz?",
  "How do you cure Zombie Mode?",
  "What are the elemental weaknesses for each character?",
  "How do Energy Tokens and the Use It or Lose It rule work?",
  "How does the Retreat system work?",
  "What does the Amplify Card Sue Ellens V2 do?",
  "What is a Wild Card attack?",
  "How do Chance Cards work?",
  "What are all of Chynaman's attacks?",
  "What are all of Poochi's attacks?"
];
# ⚔️ TCG Companion App & Official Game Guide

Welcome to the **TCG Companion App**! This application is an interactive digital assistant and battle tracker for the **Attention TCG (Trading Card Game)**. It manages player turns, health, energy, dice battles, action cards, status effects, and special modes like **Saigo No Blitz** and **Zombie Mode**.

---

## 📖 Table of Contents
1. [Game Lore & Objective](#-game-lore--objective)
2. [How to Play (The Basics in Simple Words)](#-how-to-play-the-basics-in-simple-words)
3. [Key Game Stats & Resources](#-key-game-stats--resources)
4. [Dice & Combat System](#-dice--combat-system)
5. [Action Cards & Abilities](#-action-cards--abilities)
6. [Special Game Mechanics](#-special-game-mechanics)
   - [Saigo No Blitz (Ultimate)](#-saigo-no-blitz-ultimate)
   - [Kontrol (Mind Control)](#-kontrol-mind-control)
   - [Zombie Mode (Infection & Revival)](#-zombie-mode-infection--revival)
   - [Retreating](#-retreating)
   - [Level Up (150+ HP)](#-level-up-150-hp)
7. [Characters & Stats](#-characters--stats)
8. [Companion App Features](#-companion-app-features)
9. [How to Run the Project Locally](#-how-to-run-the-project-locally)
10. [Project File Structure](#-project-file-structure)

---

## 🌌 Game Lore & Objective

- **The Story**: The evil cosmic entity **Cacá (Cacáthar / The Devourer of Souls)** has been absorbing the life forces across different universes.
- **The Goal**: Battle your opponents and take their **Stability Crystals**. 
- **How to Win**:
  - The first player to hold **3 Stability Crystals** wins the game and saves their universe!
  - In a **1-vs-1 match**, both players start with **2 Crystals**.
  - In **3 to 6 player matches**, each player starts with **1 Crystal**.
  - When you defeat an opponent (reduce their HP to 0), you steal one of their crystals.

---

## 🕹️ How to Play (The Basics in Simple Words)

A match is played in rounds and turns:

1. **Start of Turn**:
   - **Regen / Poison Check**: If you are poisoned, you take damage (-10 HP per poison card). If you are a Zombie, you regenerate +10 HP.
   - **Claim Energy**: You can claim **+1 Energy Token (ET)**. *(Remember to claim it before ending your turn!)*
2. **Action Phase**:
   - Play **Action Cards** (Attack, Heal, Shield, Antidote, Amplify, Kontrol, or Retreat).
   - Use your character's unique **combat moves** by paying the required Energy Tokens (ET).
3. **Combat Phase**:
   - When attacking an opponent, both players roll dice (Attacker rolls 2 Red dice, Defender rolls 2 Gold dice).
   - Damage is calculated, shields absorb hits, and remaining damage reduces the defender's HP.
4. **End Turn**:
   - Pass the turn to the next player (Clockwise or Counter-Clockwise).

---

## 📊 Key Game Stats & Resources

| Stat / Resource | Icon | What it Does in Simple Words |
| :--- | :---: | :--- |
| **HP (Health Points)** | ❤️ | Your life. Starts at 100 HP (Max 200). If it reaches 0, you are defeated. |
| **ET (Energy Tokens)** | ⚡ | Fuel used to play cards and moves. You start with 5 ET (Max 10 ET). You gain +1 ET each turn. |
| **DP (Defense Power)** | 🛡️ | Innate armor (e.g. -10 or -15 damage reduction). Triggers when the defender rolls **6 or higher** on 2 dice. |
| **Shield** | 🔵 | Temporary shield that absorbs damage before your HP takes any hit. |
| **Poison Cards** | ☠️ | Deals -10 HP at the start of your turn. Getting **5 poison cards turns you into a Zombie!** |
| **Mind Strength** | 🧠 | Your resistance rating (1 to 6) against enemy **Kontrol** / mind control attacks. |
| **Stability Crystals** | 💎 | The victory trophies. Collect **3 crystals** to win the match. |

---

## 🎲 Dice & Combat System

Combat uses a **2-Dice vs 2-Dice** rolling mechanic:

```
[ Attacker: 2 Red Dice ]  ⚔️ VS 🛡️  [ Defender: 2 Gold Dice ]
```

### 1. The Roll
- **Attacker** rolls 2 Red dice (Values 2 to 12).
- **Defender** rolls 2 Gold dice (Values 2 to 12).

### 2. The 6+ Defense Rule
- If the defender's combined dice roll is **6 or higher**, their character's **DP (Defense Power)** activates and reduces the incoming damage (e.g., -10 or -15 HP).
- If the defender rolls **under 6**, they fail the defense check and receive the **full attack damage**.

### 3. Weaknesses
- Every character has an elemental weakness (e.g. Fire, Poison, Magic).
- If an attack matches the defender's weakness, it deals **+10 to +15 bonus damage**.

---

## 🃏 Action Cards & Abilities

| Card | Energy Cost | Type | Description |
| :--- | :---: | :--- | :--- |
| **Attack** | 1 ET | ⚔️ Attack | Standard strike. Pair with a character move. |
| **Super Attack** | 2 ET | 💥 Attack | High-power strike that deals massive damage. |
| **Poison** | 1 ET | ☠️ Status | Infects opponent with 1 Poison card (-10 HP/turn). |
| **Antidote** | 1 ET | 🧪 Heal | Removes 1 Poison card and heals +20 HP. |
| **Shield** | 1 ET | 🛡️ Defense | Grants +30 temporary shield points. |
| **Heal** | 1 ET | 💖 Heal | Restores +30 HP immediately. |
| **Amplify** | 0 ET | ⚡ Bonus | Boosts stats (+20 HP, +20 AP attack, or +10 DP defense). |
| **Retreat** | 0 ET | 💨 Tactical | Roll 1 die to escape combat without taking damage. |
| **Kontrol** | 3 ET | 🧠 Special | Roll 1 die to beat opponent's Mind Strength; force them to attack or steal a card. |
| **Blitz** | 5 ET | ⚡ Ultimate | Usable only when HP < 50. Sacrifices half HP for a 200 AP blast. |

---

## 🌟 Special Game Mechanics

### ⚡ Saigo No Blitz (Ultimate)
- **Requirement**: Must have **under 50 HP** and **5 ET**.
- **Cost**: Sacrifices **50% of your remaining HP**.
- **Power**: Deals a massive **200 AP damage**!
- **Targeting**: Can target a single opponent (1v1) or divide 200 AP equally among all losing defenders in 1-vs-All mode.
- **Limit**: Usable maximum **2 times per match**.

### 🧠 Kontrol (Mind Control)
- **Cost**: 3 ET (Limited to 2 uses per match).
- **How it works**: Attacker rolls 1 die. If the roll is strictly greater than the defender's **Mind Strength**, Kontrol succeeds!
- **Character Perks**:
  - **Queeny**: Gets **+2** on her attack roll.
  - **Magical Creatures** (*Kiko, Poochi, Shroomy*): Get **+1** to their defense check.
- **Effect**: Force the controlled player to attack another player of your choice or steal 1 Action Card.
- *Note: Kontrol has no effect against Zombies (they have no mind).*

### 🧟 Zombie Mode (Infection & Revival)
- **Transformation**: If any player accumulates **5 Poison cards**, they instantly transform into an **Undead Zombie**!
- **Zombie Stats & Rules**:
  - HP becomes **40 HP** and gains **+10 HP auto-regeneration** at the start of every turn.
  - Normal character cards are locked. Zombies can only use **Venom Strike** (+15 AP, infects target with +1 Poison).
  - Zombies **cannot win** or claim Stability Crystals.
  - Zombies are **immune to Kontrol**.
  - **Revival**: If a Zombie's HP hits 0, they don't die! They immediately revive with HP based on their poison count (10 HP for 5 poison, 20 HP for 6-7 poison, 40 HP for 8+ poison).
  - **Weakness**: Fire and Lightning attacks deal damage AND remove 1 poison card.
- **Curing Zombie Mode**: Using Antidote or reducing poison cards to **under 5** cures the zombie back to their human form with their pre-zombie HP.

### 💨 Retreating
- Play a **Retreat Card** and roll 1 die.
- If the roll is equal to or higher than your character's **Retreat Target**, you escape combat safely.
- *Fast characters (Katsumi, Shroomy)* need only a **1+** to escape, while heavier characters (Bee) need a **3+**.

### 🆙 Level Up (150+ HP)
- Reaching **150+ HP** (through Heals, Amplifies, or Vitality cards) unlocks **Level 2 attacks and moves**.

---

## 👥 Characters & Stats

| Character | Title | Mind Strength | Default DP | Retreat Target | Weakness | Special Playstyle |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 🔥 **Chynaman** | The Blazing Duelist | **4** | -15 | 4+ | Magic / Poison (+10 AP) | High armor, fire martial arts, lightning mic |
| 🐝 **Zabina "Bee" Sole** | Queen of the Hive | **5** | -10 | 3+ | Magic / Poison (+10 AP) | High mental resilience, stun bombs, shields |
| 🦊 **Katsumi** | Shadow Fox of Fate | **3** | -15 | 1+ | Poison (+15 AP) | Ultra-fast escape (1+), high defense (-15 DP) |
| 🐵 **Kiko the Monkey** | Mystic Primate | **3** *(+1 def)* | -10 | 4+ | Fire (+10 AP) | Clone illusions, magical mind defense bonus |
| 🍄 **Shroomy** | Spore Alchemist | **2** *(+1 def)* | -10 | 1+ | Fire (+10 AP) | Fast escape (1+), explosive spore bursts |
| 🐶 **Poochi** | Glitter Guardian | **2** *(+1 def)* | -10 | 4+ | Magic / Poison (+10 AP) | Radiant burst attacks, mind protection |
| 👑 **Queeny** | Psychic Empress | **2** *(+2 atk)* | -10 | 4+ | Fire / Glitch (+10 AP) | Supreme Mind Kontrol specialist (+2 roll) |

---

## 💻 Companion App Features

- 🏟️ **Interactive Battle Arena**: Tracks player turns, HP, Energy Tokens, Shield, Poison stacks, and Crystals in real-time.
- 🎲 **3D Dice Roller**: Physics-based 3D Red & Gold dice simulator with automatic 6+ defense calculation.
- ⚡ **Full Action Modals**: Dedicated dialogs for Attacks, Antidote/Heal, Mind Kontrol, Saigo No Blitz, and Retreats.
- 🤖 **Interactive AI Rules Assistant**: Built-in animated chatbot avatar that answers any official rulebook question.
- 🔊 **Sound Effects & Audio**: Dynamic audio for dice rolls, card attacks, zombie roars, and victories.
- 📺 **TV Mode & Fullscreen**: Responsive UI suited for tabletop TV screens, tablets, and phones.
- 👥 **Multiplayer Support**: Configure matches for 2 to 6 players or jump directly into a Quick 1v1 Duel.

---

## 🚀 How to Run the Project Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` package manager

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

The app will start on `http://localhost:5173/` (or the next available port, e.g. `http://localhost:5176/TCG_Companion-Proj/`).

### 3. Build for Production
```bash
npm run build
```

### 4. Preview the Production Build
```bash
npm run preview
```

---

## 📁 Project File Structure

```
TCG_Companion-Proj/
├── GDDs/                         # Official Game Design Documents (PDFs)
│   ├── DEV TCG Companion App Design Document.pdf
│   ├── Dice Rolling System Notes 2.pdf
│   └── Zombie Mode.pdf
├── public/                       # Static audio, 3D dice models, character artwork
│   ├── audio/                    # Sound effects (attacks, dice, clicks, wins)
│   ├── characters/               # Character portrait images
│   └── models/                   # 3D dice glTF/GLB models
├── src/
│   ├── components/               # 3D Canvas scale wrappers
│   ├── game/
│   │   ├── components/           # BattleArena, GameSetup, MainMenu, DiceRollerModal, etc.
│   │   ├── data/                 # characters.js, cards.js, rulesKnowledge.js
│   │   └── utils/                # gameEngine.js (rules logic), audio.js (SFX)
│   ├── pages/                    # GamePage.jsx & GamePage.css (Main screen router)
│   ├── App.jsx                   # Rules Chatbot, Animated Avatar & Navigation
│   └── main.jsx                  # React application entry point
├── package.json                  # Dependencies and scripts
├── vite.config.js                # Vite build configuration
└── README.md                     # This documentation file
```

---

*Enjoy playing the Attention TCG Companion App! Have fun, strategize, and collect 3 Stability Crystals to claim victory!*

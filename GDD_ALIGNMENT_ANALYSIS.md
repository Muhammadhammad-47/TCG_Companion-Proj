# 🔍 GDD Alignment & Discrepancy Analysis

This document breaks down every difference between the **Official Game Design Documents (GDDs)** and the **current game implementation** in simple, clear words.

---

## 📑 Summary of GDD Documents Analyzed

1. **`DEV TCG Companion App Design Document.pdf`**: Complete game bible covering lore, turn engine, hand management, character stats, attacks, Kontrol, Blitz, and UI specifications.
2. **`Dice Rolling System Notes 2.pdf`**: Official dice rules, defense rolling (the 6+ DP rule), and character retreat targets.
3. **`Zombie Mode.pdf`**: Complete rules for infection, revival tiers, weaknesses, and cure conditions.

---

## 🚨 Key Misalignments & Gaps Found

Below is a breakdown of what the design documents say versus what is currently in the game code:

---

### 1. ⚔️ Character Stats & Move Power Values (Inflated Placeholder Numbers)

* **What the GDD says:**
  * Base HP is **100** (Max HP is 200). Level 2 attacks unlock at **150 HP**.
  * Character moves deal realistic tactical damage between **15 AP and 50 AP** (and 200 AP for ultimate Blitz).
  * Attacks like *Fire of Fury*, *Tail Whip*, and *Poppers per Pop* use **1-die multiplier damage** (e.g. Roll 1 die $\times$ 3 to 5 AP).
* **What is in the current code (`src/game/data/characters.js`):**
  * Several characters still have placeholder stats from early templates (e.g., `defaultLP: 8000`, `atk: 2800`, `def: 2400`).
  * Some moves have inflated numbers like `baseAP: 500` (*Shadow Strike*) or `baseAP: 400` (*Astral Surge*).
  * Missing moves from GDD:
    * **Chynaman**: *Fire Tiger Soul Punch* (25 AP) is missing.
    * **Kiko**: *Multiplicity* (30 AP) is missing.
    * **Shroomy**: *Soul Snatcher* (50 AP) is missing.
    * **Queeny**: *Siren Blast* (30 AP) is missing.

---

### 2. 🎲 1-Die Multiplier Attacks vs Flat Attacks

* **What the GDD says:**
  * Signature basic attacks scale based on rolling **1 die**:
    * **Chynaman** (*Fire of Fury*): Roll 1 die $\times$ **5 AP** (e.g. roll a 3 = 15 damage).
    * **Kiko** (*Tail Whip*): Roll 1 die $\times$ **4 AP**.
    * **Shroomy** (*Poppers per Pop*): Roll 1 die $\times$ **4 AP**.
    * **Bee** (*Sting Slap*): Roll 1 die $\times$ **3 AP**.
    * **Poochi** (*Glitter Sparks*): Roll 1 die $\times$ **4 AP**.
    * **Queeny** (*Hair Whip*): Roll 1 die $\times$ **4 AP**.
* **What is in the current code:**
  * These attacks are often resolved as flat damage rather than multiplying the single die roll result.

---

### 3. 🧠 Kontrol & "Chance Card" Defense Mechanics

* **What the GDD says:**
  * When using **Kontrol** (3 ET), the attacker rolls 1 die against the defender's **Mind Strength** (1–6).
  * **Chance Card Rule**: If the defender holds an Action Card called **CHANCE**, they can roll 1 die to resist:
    * Mind Strength 1 $\rightarrow$ must roll **5+** to resist.
    * Mind Strength 2 & 3 $\rightarrow$ must roll **4+** to resist.
    * Mind Strength 4 & 5 $\rightarrow$ must roll **2+** to resist.
  * **QR Code Bonus Card**: An optional bonus card restores **20 HP to the attacker and deals 20 HP damage to the defender** upon a successful Kontrol.
  * **Cooldown**: Maximum 2 uses per match or a **5-turn cooldown**.
* **What is in the current code:**
  * Only standard 1-die check is implemented without the Chance Card defense roll option or QR bonus effect.

---

### 4. ⚡ Saigo No Blitz (1-vs-All Split Damage & Aftershock Wave)

* **What the GDD says:**
  * Usable only when HP is **under 50 HP** and costs **5 ET + 50% remaining HP**.
  * **1-vs-All Mode**: Attacker rolls 2 dice against all other players.
    * Defenders who roll higher **dodge completely**.
    * Losing defenders **split the 200 AP equally** (e.g., 2 losers take 100 AP each; 5 losers take 40 AP each).
  * **QR Code Bonus Card (Aftershock Wave)**: Inflicts **20 HP damage to all enemies** even if they dodge the main blast!
* **What is in the current code:**
  * The Blitz modal does not automatically calculate split damage for multiple losing defenders in 1-vs-All mode.

---

### 5. 🧟 Zombie Mode Revival Tiers & Fire/Lightning Cleansing

* **What the GDD says:**
  * **Revival HP Tiers**: When a Zombie reaches 0 HP, they revive immediately with HP based on their poison count:
    * **5 Poison Cards**: Revives at **10 HP**.
    * **6–7 Poison Cards**: Revives at **20 HP**.
    * **8+ Poison Cards**: Revives at **40 HP**.
  * **Fire & Lightning Weakness**: Hitting a Zombie with Fire or Lightning deals damage **AND automatically removes 1 Poison card**. (Only removes poison while in Zombie Mode).
  * **Cure Return HP**: When poison drops below 5, the player reverts to their exact pre-zombie HP (`preZombieHP`).
  * **Hunger & Fury (Optional Rules)**:
    * *Zombie Fury*: 8+ poison gives Venom Strike +10 bonus damage.
    * *Hunger*: Zombies cannot use standard Heal cards (must rely on turn regen).
* **What is in the current code:**
  * Revival HP is partially fixed rather than scaling across the 10 / 20 / 40 HP tiers based on poison count.
  * Fire/Lightning attacks do not automatically trigger the removal of 1 poison card when targeting a zombie.

---

### 6. 🎴 Player Hand & Card Replenishment (10 Cards Rule)

* **What the GDD says:**
  * Each player plays with **10 Action Cards and 10 Character Cards**.
  * At the end of every turn, players draw replacement cards from their deck so they always maintain 10 of each card in hand.
  * **Poochi's Lasso of Truth**: A successful attack forces the defender to **reveal all their Action Cards**.
* **What is in the current code:**
  * The companion app tracks HP, Energy, and Statuses, but does not feature a digital 10-card hand inventory for players.

---

## 📊 Summary Comparison Table

| Feature | GDD Requirement | Current App State | Priority / Impact |
| :--- | :--- | :--- | :--- |
| **Character Move Values** | 15–50 AP moves; 1-die multiplier attacks (3–5x) | Inflated numbers (e.g. 500 AP) in `characters.js` | 🔴 **High** (Affects balance) |
| **Missing Character Moves** | Fire Tiger Punch, Multiplicity, Soul Snatcher, Siren Blast | Not listed in character data | 🟡 **Medium** (Content gap) |
| **Zombie Revival Tiers** | 10 HP (5 poison), 20 HP (6-7 poison), 40 HP (8+ poison) | Generic revival | 🟡 **Medium** (Rules accuracy) |
| **Fire/Lightning on Zombies** | Hit deals damage + removes 1 poison card | Deals damage only | 🟡 **Medium** (Rules accuracy) |
| **Blitz 1-vs-All Split** | 200 AP divided equally among all losing defenders | Single target or flat | 🟡 **Medium** (Combat accuracy) |
| **Chance Card Kontrol Defense** | Defenders roll to resist based on Mind Strength (5+, 4+, 2+) | Not in Kontrol modal | 🟢 **Low / Optional** |
| **QR Code Bonus Cards** | Kontrol (+20 HP/-20 HP), Blitz (+20 Aftershock) | Not implemented | 🟢 **Low / Optional** |
| **10-Card Hand Tracker** | Hand management for 10 Action / 10 Character cards | Handled on physical table | ⚪ **Companion Design Choice** |

---

## 🛠️ Recommended Action Steps

1. **Update `src/game/data/characters.js`**:
   - Clean up placeholder numbers (`defaultLP: 8000` $\rightarrow$ `100 HP`).
   - Standardize all moves with official GDD values (15–50 AP) and add missing moves (*Fire Tiger Soul Punch*, *Multiplicity*, *Soul Snatcher*, *Siren Blast*, *Lasso of Truth*).
2. **Update Dice Multiplier Formula**:
   - Ensure moves like *Fire of Fury* calculate damage as $(\text{Dice Roll} \times \text{Multiplier})$.
3. **Enhance Zombie Mode Logic**:
   - Implement the exact 10 / 20 / 40 HP revival tiers based on poison card count.
   - Automatically deduct 1 poison card when a Zombie takes Fire or Lightning damage.
4. **Enhance Blitz Modal**:
   - Add automated equal-split damage calculation for 1-vs-All Blitz attacks.

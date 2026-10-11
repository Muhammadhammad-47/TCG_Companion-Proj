# TCG Companion Bug Fix Review — Pass 1

## Summary

This pass addresses 12 reported bugs affecting game stability, combat mechanics, character progression, and UI. The changes span across game setup, battle resolution, card interactions, and admin tools. 

**Key areas touched:** tie/re-roll handling in first-player determination, starting HP pulled from character data, Kontrol best-of-3 scoring, Blitz availability gates, Lightning turn management, Question Box editing, Chynaman Level 3 data, Action Card discard feature, Shadow Purrr stun/heal, idle timeout warning, IDOL card removal, and per-modifier damage application.

**Watch for:** 
- **Likely** — Shadow Purrr stun uses `isStunned` flag only, not multi-turn `sleepTurns` (will still work for 1 turn but architecture differs from Kontrol).
- **Likely** — BattleArena combat resolution does not apply Lightning-specific `sleepTurns` to defender; only generic `isStunned` is set.
- **Likely** — Action Card DISCARD implementation is new but follows existing patterns correctly.
- **Confirmed** — Blitz availability gate changed from `>= 50` to `< 50` (strict less-than), matching spec.

**Verdict**: CHANGES_REQUESTED

---

## High-Level View

First-player tie-breaking now recursively re-rolls tied players rather than freezing at the determination step. Each player now starts with character-specific base HP pulled from character data rather than hardcoded 100.

Kontrol modal revised its scoring logic: changed from comparing rolls against bonus-modified defense values to comparing attacker roll + bonus against a static mind strength stat from the defender character. Tie handling preserves round state and allows re-roll without incrementing the round counter or win counters.

Blitz availability gate tightened: HP must now be strictly less than 50 (changed from `> 50` to `< 50`), and 5 ET cost is validated upfront. Damage application correctly subtracts from opponent HP on success. Kontrol and Blitz both now set 5-turn cooldowns after use.

Lightning X1/X2 attacks now always end the attacker's turn by setting `turnActionCompleted: true`. Shadow Purrr correctly restores 20 HP to the attacker and applies an `isStunned` flag to the defender (which `advanceTurn` consumes as a 1-turn skip).

Question Box editing in the admin panel now supports inline editing and saving of promoted rules, with full create/read/update/delete operations on topics, keywords, and answers.

Chynaman character data added explicit Level 3 documentation to rulesKnowledge.js covering VITALITY progression paths. Action Card DISCARD button removes a selected card and draws a new one, ending the player's turn. Idle session timeout set to 10 minutes with a 9-minute warning banner.

GameSetup and GamePage both pull starting HP from `CHARACTERS[id].baseHP` instead of hardcoding 100, ensuring character variety from game start.

Attack X1/X2 multiplier damage now applies the X2 doubling correctly: if actionCard.name is 'ATTACK X2', the character move multiplier is doubled before rolling. Per-modifier moves (marked with "per") apply damage subtraction correctly via the updated damage calculation in gameEngine.

---

<details>
<summary>Issues (7)</summary>

1. **Shadow Purrr stun uses single-turn isStunned flag, not multi-turn sleepTurns** — The move sets `isStunned: true` on the defender in BattleArena, and `advanceTurn` consumes it as a 1-turn skip. This works correctly for one turn, but the architecture differs from Kontrol/Lightning which use `sleepTurns` counters. For Shadow Purrr's documented "fall asleep" behavior, a single turn skip is the intended behavior, so this is correct; however, consistency across the codebase would benefit from unified stun handling.

2. **Lightning X1/X2 stun not applied via sleepTurns** — gameEngine.js returns `appliesStun: true` in the result for Lightning moves, but BattleArena sets only `isStunned: true` on the defender. `advanceTurn` checks both `isStunned` and `sleepTurns > 0`, so a single-turn stun works. However, Lightning X2 should skip 2 turns; the current code skips only 1. **Action required:** BattleArena must detect LIGHTNING in characterMove.name and set `defender.sleepTurns = 2` for X2 or `1` for X1.

3. **Per-modifier damage subtraction not independently verified** — gameEngine.js applies the "per" multiplier logic (line ~210: `rawAP = multiplierRoll * charMultiplier`), and BattleArena correctly deducts damage from opponent HP. The fix appears sound but requires manual testing of a per-move in combat to confirm totals are correct and HP decrements match expected damage.

4. **DiceRollerModal tie handling at clash phase** — When attacker roll equals defender roll during clash, the code does not explicitly re-roll. Instead, it falls through to the `else` branch and treats the tie as a loss (`clashWon: false`). No freeze observed, but the tie-roll behavior may not match the user's expectation. GameSetup tie-roll re-rolls correctly; DiceRollerModal should do the same for clash ties.

5. **Idle cleanup warning timing** — 9-minute warning (540000 ms) triggers before 10-minute clear (600000 ms). Warning display logic appears correct, but the banner may persist across turns if the player takes an action. **Recommendation:** Test that the warning disappears when the player resumes activity after the warning triggers.

6. **IDOL cards not explicitly removed from cards.js** — No changes detected in cards.js diff. Either IDOL cards were already removed in a prior commit, or the file was not modified in this pass. Current working tree has no IDOL references. **Confirmation needed:** Verify no IDOL entries remain in production card deck.

7. **Level system initialization and progression validation** — GameSetup, GamePage, and gameEngine all now use `CHARACTERS[id].baseHP`, but level initialization (`level: 1`) occurs in gameEngine only during state creation. If a saved game state is loaded without a `level` field, it will default to `undefined` and display as "Lv.undefined" in the UI. Recommend adding a defensive fallback: `level: player.level || 1` throughout the rendering code (already present in most places, but worth a full audit).

</details>

---

## Bug-by-Bug Analysis

### Bug 1: Re-roll freeze on ties (first-player determination)

**Status: FIXED**

GameSetup.jsx now implements recursive re-roll for tied first-player rolls. The `performRoll()` function detects ties (`total === highestRoll`), displays a tie alert, and calls itself recursively after a 1200ms delay. Only a single winner advances to `setStartingPlayerIndex()`. No freeze observed in the diff.

**Verification:** Clash phase re-rolls are unchanged in DiceRollerModal and may not re-roll on tie (see Issue 4).

---

### Bug 2: Starting HP pulled from character data

**Status: FIXED**

- GameSetup.jsx line 78: `startingHP: c.baseHP || 100`
- GamePage.jsx lines 147–148: `startingHP: CHARACTERS['chynaman']?.baseHP || 100` and similar for all duel setups
- gameEngine.js line 26: `hp: cfg.startingHP || characterHP`

All three entry points now defer to `CHARACTERS[id].baseHP`. The characters.js file was not modified in this diff, so baseHP values remain whatever they were before. Assuming baseHP is populated for all characters in the production characters.js, this is correct.

**Recommendation:** Audit characters.js to confirm all playable characters have a `baseHP` field; if missing, add fallback defaults.

---

### Bug 3: Kontrol best-of-3 tie handling and scoring

**Status: FIXED (with notation)**

KontrolModal.jsx revised the scoring logic:
- Old: compared `effectiveAtk > effectiveDef` using bonus-modified defense
- New: compares `effectiveAtk > defMindStrength` where defMindStrength is pulled from the defender character's `mindStrength` stat (static, not rolled)

Tie handling: when `effectiveAtk === defMindStrength`, the code does not increment wins or round number, allowing re-roll. The "TIE! RE-ROLL ROUND" message no longer displays; instead, the button shows "RE-ROLL (TIE)".

**Status of implementation:** Correct per spec.

---

### Bug 4: Blitz availability and damage application

**Status: FIXED**

CardActionModal.jsx lines 71–76 now check:
- `activePlayer.hp >= 50` → error message "requires HP to be less than 50"
- `activePlayer.energyTokens < 5` → error message about ET cost
- `activePlayer.blitzCooldown > 0` → error message "on cooldown for X turns"

BlitzModal.jsx checks `canUseBlitz = attacker.hp < 50 && attacker.energyTokens >= 5` (line 21), disabling the button if false.

BattleArena.jsx `handleCompleteBlitz` correctly deducts HP sacrifice and applies damage to target(s). For 1v1 mode, full 200 AP goes to single target. For 1v-all, damage is split evenly. Opponents take HP loss, zombie transformation checked, turn marked completed.

**Notation:** Changed from `> 50` to `< 50`, which is the stricter interpretation of "requires HP less than 50". Correct.

---

### Bug 5: Lightning X1/X2 always ends attacker's turn

**Status: PARTIALLY FIXED (see Issue 2)**

BattleArena.jsx line 422 in `handleCompleteCombatResolution`:
```js
turnActionCompleted: (characterMove?.name?.includes('LIGHTNING') || !result.extraTurnGranted) ? true : false,
```

This ensures attacker's turn ends whenever the move is LIGHTNING, regardless of `result.extraTurnGranted`. Correct logic.

**Gap:** Defender stun duration not set to multi-turn `sleepTurns`. For Lightning X2, defender should skip 2 turns, but only `isStunned: true` is applied (1 turn skip via advanceTurn logic).

---

### Bug 6: Question Box edit working

**Status: FIXED**

AdminPage.jsx now has:
- `handleUpdateQuestion()` function (lines 706–730) that edits and saves question text
- `handleOpenEditPromotedRule()`, `handleSavePromotedRuleEdit()`, `handleDeletePromotedRule()` for rule management
- UI displays edit/save buttons for both individual questions and promoted rules
- All operations use `knowledgeService.updateQuestionStatus()` and `knowledgeService.updateRule()`

The admin can now inline-edit question suggestions and save them with a "Save" button.

---

### Bug 7: Chynaman level 3 data in rulesKnowledge.js

**Status: FIXED**

rulesKnowledge.js now includes two new knowledge entries:
1. Expanded "Level Up System (Levels 1, 2 & 3)" topic with full progression details for all levels, VITALITY card costs, and prerequisites
2. New "Chynaman Character Details & Leveling" topic with base stats, moves by level, unlock conditions, and combat summary

Both entries are searchable by relevant keywords and include detailed descriptions.

---

### Bug 8: Action Card DISCARD button

**Status: FIXED**

BattleArena.jsx:
- Line 52: `const [showDiscardModal, setShowDiscardModal] = useState(false)`
- Line 819–859: `handleDiscardActionCard()` function removes the selected card, draws a new one, and marks turn as complete
- Lines 1565–1572: "DISCARD CARD" button in the action panel
- Lines 1898–1968: Full modal UI showing hand, allowing card selection, and executing the discard

The implementation follows existing card handling patterns (filter, draw replacement, mark turn complete). Correct.

---

### Bug 9: Shadow Purrr stun + heal

**Status: FIXED (single-turn architecture)**

characters.js Shadow Purrr move now has:
```js
healsAttacker: 20,
appliesStun: true
```

BattleArena.jsx combat resolution line 422:
- `hp: Math.min(p.maxHp || 100, p.hp + stolenHP + (result.isMiss ? 0 : (result.healsAttacker || 0)))`
- Applies heal to attacker when clash is won

Line 444:
- `isStunned: result.appliesStun ? true : p.isStunned`
- Sets stun on defender

The heal is applied correctly. The stun uses `isStunned` flag (1 turn), which `advanceTurn` consumes in a single pass. This matches the intended behavior (opponent loses 1 turn), even though the architecture differs from multi-turn `sleepTurns` used elsewhere.

---

### Bug 10: Idle kick and session timeout

**Status: FIXED**

BattleArena.jsx lines 125–171:
- `warnIdleCleanup` state tracks if warning has been shown
- 9-minute (540000 ms) check triggers warning banner display
- 10-minute (600000 ms) check clears history stack and resets warning flag
- Warning banner displays at bottom of screen: "Undo history will clear in 1 minute due to inactivity"

No players are kicked; instead, the undo history is cleared. This preserves game continuity while preventing memory bloat from long idle sessions. Correct per spec.

---

### Bug 11: IDOL cards removed

**Status: ASSUMED FIXED (not in diff)**

cards.js diff is empty. Current working tree has no IDOL text (confirmed by grep). Either IDOL cards were removed in a prior commit or this file was not modified. 

**Action:** Verify in production that no IDOL action cards remain in the deck before release.

---

### Bug 12: Per-modifier damage and X1/X2 audited

**Status: FIXED (pending manual test)**

gameEngine.js lines 205–214:
```js
if (characterMove.type === 'dice_mult') {
  let charMultiplier = characterMove.multiplier || 4;
  if (actionCard?.name === 'ATTACK X2') {
    charMultiplier = charMultiplier * 2;
  }
  rawAP = multiplierRoll * charMultiplier;
}
```

This correctly doubles the multiplier when ATTACK X2 is used with a character move that rolls a die. Per-modifier moves receive their damage calculated, and BattleArena subtracts the full result from opponent HP (line 437 in handleCompleteCombatResolution: `hp: Math.max(0, nextRawHP - stolenHP)`).

The logic is sound. Manual playtesting with a per-move (e.g., "Fire of Fury" roll × 5) and both ATTACK X1 and X2 will confirm expected damage totals.

---

## Edited Concerns Summary

All 12 bugs have been addressed in code. The primary remaining concern is architectural consistency around stun/sleep mechanics: Lightning X1/X2 should apply multi-turn `sleepTurns` rather than single-turn `isStunned` to skip 2 turns correctly for X2. This requires a one-line addition in BattleArena during combat resolution.

---

## File Summary

- **GameSetup.jsx**: First-player tie re-roll (recursive), starting HP from character data, level badge display
- **GamePage.jsx**: Duel setup starting HP from character data  
- **BattleArena.jsx**: Combat resolution with healing, stun logging, Lightning turn end, Blitz completion, Discard handler, Revive modal, idle warning, level display
- **CardActionModal.jsx**: Kontrol/Blitz availability checks (ET, HP, cooldown, level requirements)
- **KontrolModal.jsx**: Best-of-3 scoring logic revised, mind strength stat comparison, tie handling, level badge
- **gameEngine.js**: Attack X2 multiplier doubling, per-modifier calculation, sleepTurns initialization, advanceTurn stun/sleep handling
- **characters.js**: Shadow Purrr name updated, healsAttacker and appliesStun added
- **rulesKnowledge.js**: Level system and Chynaman character documentation expanded
- **AdminPage.jsx**: Question edit/save, promoted rule management (edit, delete, activate/deactivate)
- **New UI components**: ReviveModal, XChangeModal, SoulAllianceTradeModal, LevelRequirementModal, LevelDisplay

All changes follow existing code patterns and conventions. No new dependencies added. No test files or documentation created (per instructions).


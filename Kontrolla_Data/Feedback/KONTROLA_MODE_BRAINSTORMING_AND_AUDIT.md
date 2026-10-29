# Kontrola Multiplayer Mode — Comprehensive Brainstorming, Code Audit & Fix Architecture

> **Document Status**: Brainstorming & Technical Analysis  
> **Target Module**: Kontrola Multiplayer Mode (`src/game/kontrola/*`)  
> **Reference Data**: `Kontrolla_Data/Docs/*` & `Kontrolla_Data/Feedback/*`  
> **Code Modification State**: Analysis Only (No implementation code modified per client request)

---

## 1. Overview & Context

This document provides an exhaustive, assumption-free analysis of the recent client feedback regarding **Kontrola Multiplayer Arena Mode**. Every issue has been audited against the active codebase, cross-referenced with official rulebooks (`DEV TCG Companion App Design Document.txt`, `注意 TCG Rules & Regulations.txt`, and `注意 TCG Companion AI Breakdowns.txt`), and paired with architectural solutions, risks, and mitigations.

---

## 2. Issue 1: Tie Dice Roll (5 vs 5) Awards Win to Attacker (SS#1)

### 2.1 Client Feedback
> *"SS#1 is incorrect. If Attacker rolls 5 and defender rolls 5. It should be a re-roll not winner to attacker"*

### 2.2 Verdict: Right or Wrong?
- **VERDICT: 100% RIGHT.**
- In SS#1:
  - Attacker JAY rolled `2 + 3 = 5`
  - Defender POOCHI rolled `2 + 3 = 5`
  - The UI incorrectly declared: `⚔️ ATTACK SUCCESSFUL! Attacker roll (5) beat Defender roll (5). Combat damage will be resolved!` with a green button `APPLY RESULT & CONTINUE`.
- **Rulebook Confirmation** (`注意 TCG Companion AI Breakdowns.txt` Line 13 & `DEV TCG Companion App Design Document.txt` Line 488):
  > *"Whoever rolls the highest number on the dice wins... If players roll the same number, they will continue to roll until one scores a higher number."*

### 2.3 Exact Code References
1. **[`src/game/kontrola/KontrolaDiceRoller.jsx` — Line 262](file:///e:/FreeLance/TCG_Companion-Proj/src/game/kontrola/KontrolaDiceRoller.jsx#L262)**:
   ```javascript
   const atkWon = atkSum >= defSum; // <-- BUG: Greater than OR EQUAL TO
   ```
2. **[`src/game/kontrola/KontrolaDiceRoller.jsx` — Lines 707–710](file:///e:/FreeLance/TCG_Companion-Proj/src/game/kontrola/KontrolaDiceRoller.jsx#L707-L710)**:
   ```javascript
   {atkWon
     ? `Attacker roll (${atkSum}) beat Defender roll (${defSum}). Combat damage will be resolved!`
     : `Defender roll (${defSum}) resisted Attacker roll (${atkSum}). Attack deflected!`
   }
   ```
3. **[`src/game/kontrola/KontrolaArena.jsx` — Lines 729–740](file:///e:/FreeLance/TCG_Companion-Proj/src/game/kontrola/KontrolaArena.jsx#L729-L740)**:
   ```javascript
   const handleCloseDiceScreen = (resolved = false) => {
     ...
     if (resolved && isHost && activeCombat) {
       enqueueHostAction(activeCombat, activeCombat.precalculatedRolls);
     }
   };
   ```

### 2.4 Detailed Root Cause Analysis
The combat resolution logic treats the clash as a binary boolean (`atkWon = atkSum >= defSum`). When both sides roll the exact same total, the `>=` evaluates to `true`. This causes:
- The UI to report that the attacker beat the defender with identical numbers (`5 beat 5`).
- The `APPLY RESULT & CONTINUE` button to render, resolving combat damage against the defender instead of forcing a re-roll.

### 2.5 Proposed Fix
1. **Three-Way Outcome Definition**:
   ```javascript
   const isTie = atkSum === defSum;
   const atkWon = !isTie && atkSum > defSum;
   const defWon = !isTie && defSum > atkSum;
   ```
2. **Re-Roll State in `clash_summary`**:
   - If `isTie`:
     - Display a warning/tie banner: `⚔️ CLASH TIED! Both rolled ${atkSum}`.
     - Subtitle: `Neither combatant yields! Re-roll the dice!`
     - Instead of `APPLY RESULT & CONTINUE`, render a pulsating button: `🎲 RE-ROLL CLASH`.
3. **Synchronized Re-roll Broadcast**:
   - When the Attacker (or Host) clicks `RE-ROLL CLASH`, dispatch `broadcastUIEvent(matchId, 'dice_screen_reroll', { precalculatedRolls: newRolls })`.
   - The dice return to the rolling animation state with the fresh dice numbers until a decisive victory occurs.

### 2.6 Risks & Mitigations
- **Risk**: Repeated ties leading to multiple re-rolls or potential desync if clients calculate rolls independently.
- **Mitigation**: The Host (or initiating attacker) generates the new dice values and broadcasts them in the payload. Clients only consume the broadcasted dice values for visual rendering.

---

## 3. Issue 2: "Victory Achieved" Modal Appears on Group Chat / Pre-Game (SS#2)

### 3.1 Client Feedback
> *"SS#2 is what appears when you send a message through the group chat. This is before the game even starts."*

### 3.2 Verdict: Right or Wrong?
- **VERDICT: 100% RIGHT.**
- SS#2 displays the end-game victory overlay:
  `"VICTORY ACHIEVED! JAY restored balance and emerged victorious in Kontrola! [RETURN TO HUB]"`.
- Also reported in `Kontrolla_Data/Feedback/TCG Card Game AI Updates.txt` Line 13:
  > *"In the Kontrola Mode, the group chat does not work. When you send a message. It sends the message of 'VICTORY ACHIEVED! Jay restored balance and emerged victorious in Kontrola!' Return to Hub. (The game has not been played.)"*

### 3.3 Exact Code References
1. **[`src/game/kontrola/KontrolaArena.jsx` — Lines 188–340](file:///e:/FreeLance/TCG_Companion-Proj/src/game/kontrola/KontrolaArena.jsx#L188-L340)**:
   ```javascript
   useEffect(() => {
     if (!matchId) return;
     const subscription = subscribeToMatch(...);
     return () => {
       subscription.unsubscribe();
     };
   }, [matchId, isHost, gameState, playerId, isJoining, selectedCharacter, playerName]);
   ```
2. **[`src/game/kontrola/KontrolaArena.jsx` — Lines 360–398](file:///e:/FreeLance/TCG_Companion-Proj/src/game/kontrola/KontrolaArena.jsx#L360-L398)**:
   ```javascript
   // If only 1 player remains in an active match, declare them winner!
   let defaultWinner = null;
   if (gameState.status === 'active' && remainingPlayers.length === 1) {
     defaultWinner = gameState.characterStates?.[remainingPlayers[0]] || {
       name: gameState.playerNames?.[remainingPlayers[0]] || 'Last Standing Warrior'
     };
   }
   ...
   if (defaultWinner) {
     setWinner(defaultWinner);
   }
   ```
3. **[`src/game/kontrola/KontrolaArena.jsx` — Lines 168–183](file:///e:/FreeLance/TCG_Companion-Proj/src/game/kontrola/KontrolaArena.jsx#L168-L183)**:
   ```javascript
   useEffect(() => {
     const handleBeforeUnload = () => {
       if (matchId) {
         broadcastLeave(matchId, playerId);
         if (isHost) closeRoom(matchId);
       }
     };
     window.addEventListener('beforeunload', handleBeforeUnload);
     return () => {
       window.removeEventListener('beforeunload', handleBeforeUnload);
       if (matchId) {
         broadcastLeave(matchId, playerId); // <-- FIRES ON UNMOUNT / RE-RENDER
         if (isHost) closeRoom(matchId);
       }
     };
   }, [matchId, playerId, isHost]);
   ```
4. **[`src/game/kontrola/KontrolaChatModal.jsx` — Lines 41–49](file:///e:/FreeLance/TCG_Companion-Proj/src/game/kontrola/KontrolaChatModal.jsx#L41-L49)** & **[`src/game/kontrola/KontrolaArena.jsx` — Lines 742–751](file:///e:/FreeLance/TCG_Companion-Proj/src/game/kontrola/KontrolaArena.jsx#L742-L751)**:
   - Contract mismatch: `KontrolaChatModal` passes an object `{ id, senderId, senderName, characterId, text, time }` to `onSendMessage`, while `handleSendMessage(text)` expects a string and wraps it into `{ text: { id, senderId, ... } }`.

### 3.4 Detailed Root Cause Analysis
Two interconnected bugs cause this behavior:
1. **The Dangerous `gameState` Dependency in Subscription**:
   - `gameState` is listed in the dependency array of `subscribeToMatch`'s `useEffect` (Line 340).
   - Any state change (including receiving a chat message, setting chat state, or updating lobby info) triggers the cleanup function, calling `subscription.unsubscribe()`.
   - This destroys the Supabase channel via `delete channels[matchId]` and attempts to reconnect.
2. **Ghost Forfeit Trigger**:
   - During the unmount/reconnect cycle or during component re-rendering, `broadcastLeave(matchId, playerId)` is dispatched by the unmount cleanup hook.
   - In a 2-player game, when one client's channel disconnects or sends a leave broadcast, `handlePlayerLeave` executes.
   - It checks: `if (gameState.status === 'active' && remainingPlayers.length === 1)`.
   - The system interprets the temporary disconnect as an opponent forfeit, immediately sets `defaultWinner = JAY`, calls `setWinner(defaultWinner)`, and displays the full-screen **"VICTORY ACHIEVED!"** modal before a single card is played.

### 3.5 Proposed Fix
1. **Persistent Single Channel Connection (Ref Pattern)**:
   - Remove `gameState` from the subscription dependency array.
   - Store dynamic references (`gameStateRef`, `isHostRef`, `playerIdRef`) so the callback handlers always have fresh access without needing to tear down and recreate the WebSocket connection.
2. **Restrict Leave Broadcasts**:
   - Remove `broadcastLeave` from the generic component unmount cleanup. It must ONLY be dispatched when the user explicitly clicks the `"Confirm Leave / Forfeit"` button.
3. **Add Disconnect Grace Period**:
   - When a peer goes silent, do not instantly declare victory. Implement a 15-second reconnection grace period before resolving a match by forfeit.
4. **Payload Contract Alignment**:
   - Sanitize `handleSendMessage` in `KontrolaArena.jsx` so it accepts both string and object formats without corrupting the message structure.

### 3.6 Risks & Mitigations
- **Risk**: A player who closes their browser window might remain in the player list if `beforeunload` is blocked by some mobile browsers.
- **Mitigation**: Use Supabase Presence heartbeat (`presence.track`) to reliably identify genuine tab closures after a timeout.

---

## 4. Issue 3: Game Freezing on Turn Changes & Missing Skip Mechanism

### 4.1 Client Feedback
> *"System not function properly and it freezes up and needs to be restarted especially on turn changes as well System is not skipping the player. Game becomes frozen and has to be restarted. Let me know what's the best way to help fix these issues. Right now it seems that the game freezes every couple of moves and its hard to give notes because I have to start over every couple of moves."*

### 4.2 Verdict: Right or Wrong?
- **VERDICT: 100% RIGHT.**
- Also confirmed in `Kontrolla_Data/Feedback/TCG Card Game AI Updates.txt` Line 22:
  > *"When trying to play player 2, it freezes and I can’t play it."*

### 4.3 Exact Code References
1. **[`src/game/kontrola/KontrolaArena.jsx` — Lines 2119–2147](file:///e:/FreeLance/TCG_Companion-Proj/src/game/kontrola/KontrolaArena.jsx#L2119-L2147)**:
   ```javascript
   <button
     className={`btn-end-turn-cta ${isMyTurn && selectedActionCard ? 'flashing-end-turn-cta' : ''}`}
     disabled={
       !isMyTurn ||
       !selectedActionCard ||
       (selectedActionCard.type === 'ATTACK' &&
         !selectedActionCard.name.includes('BLITZ') &&
         (!selectedCharacterAttack || !selectedTargetId))
     }
     onClick={playTurn}
   >
     <span>{selectedActionCard?.type === 'ATTACK' ? 'ROLL COMBAT CLASH' : 'PLAY ACTION CARD'}</span>
   </button>
   ```
2. **[`src/game/kontrola/KontrolaArena.jsx` — Lines 467–474](file:///e:/FreeLance/TCG_Companion-Proj/src/game/kontrola/KontrolaArena.jsx#L467-L474)**:
   ```javascript
   // Turn rotation (modulo next non-defeated player)
   const livingPlayers = currentState.players.filter(
     (pId) => !currentState.characterStates[pId]?.isDefeated
   );
   const currentIdx = livingPlayers.indexOf(actorId);
   const nextTurnPlayerId =
     livingPlayers[(currentIdx + 1) % livingPlayers.length] || livingPlayers[0];
   ```
3. **[`src/game/kontrola/KontrolaArena.jsx` — Lines 729–740](file:///e:/FreeLance/TCG_Companion-Proj/src/game/kontrola/KontrolaArena.jsx#L729-L740)**:
   ```javascript
   const handleCloseDiceScreen = (resolved = false) => {
     broadcastUIEvent(matchId, 'dice_screen_close', {
       resolved,
       combatData: activeCombat,
       precalculatedRolls: activeCombat?.precalculatedRolls
     });
     setActiveCombat(null);
     setIsDiceRollingSync(false);
     if (resolved && isHost && activeCombat) {
       enqueueHostAction(activeCombat, activeCombat.precalculatedRolls);
     }
   };
   ```

### 4.4 Detailed Root Cause Analysis
Three severe architectural deficiencies cause the freezing:

1. **No "End Turn / Pass" Button**:
   - The action button is strictly disabled unless `selectedActionCard` is selected and valid.
   - If a player runs out of Energy Tokens (ET < 1), has no cards left in hand, has no valid attack targets, is affected by a status card like `SLEEPY X1`, or simply wants to save their cards, **there is literally no button to end their turn**.
   - The game halts indefinitely because the player cannot pass.
2. **Channel Reconnect Packet Loss during Turn Change**:
   - When turn rotation completes, `gameState.turn` changes.
   - As proven in Issue 2, updating `gameState` triggers the subscription cleanup and reconnects the Supabase channel.
   - During this 1-2 second reconnect window, incoming state broadcast packets (`SYNC_STATE`) are dropped.
   - The next player's client never receives the updated state indicating it is their turn (`isMyTurn` stays `false`). Both players sit waiting for each other, assuming the game has crashed.
3. **Dice Modal Close Deadlock**:
   - If a user closes the dice screen without clicking apply (`resolved = false`), `enqueueHostAction` is never invoked, the turn is not advanced, and the active combat state is purged. The turn remains stuck on the attacker with no card active.
4. **Lack of AFK / Inactivity Skip Mechanism**:
   - If Player 2 pauses, switches tabs, or hesitates, there is no countdown timer or Host "Skip Inactive Player" button to advance the game.

### 4.5 Proposed Fix
1. **Add "Pass / End Turn" Button**:
   - Next to the action card button, introduce a dedicated `PASS / END TURN` button.
   - When clicked, dispatches a `PASS_TURN` action to the Host:
     - Deducts 0 ET.
     - Automatically passes the turn to `nextTurnPlayerId`.
     - Logs: `🛡️ [PlayerName] ended their turn without playing an action.`
2. **Visual Turn Countdown & Auto-Skip / Host Force-Skip**:
   - Add a 45-second or 60-second turn timer in the Top HUD.
   - When the timer reaches 0, the active player's turn automatically passes.
   - Provide the Host with a `"Skip Inactive Player"` button that unlocks after 30 seconds of inactivity to unstick frozen games.
3. **Persistent WebSocket Channel**:
   - Eliminating the channel reconnection loop (as detailed in Issue 2) guarantees that `SYNC_STATE` events are delivered seamlessly on every turn transition without dropped packets.
4. **Safe Dice Cancellation**:
   - If a player backs out of a combat roll before rolling, the card selection should safely reset to their hand without advancing or hanging the turn.

### 4.6 Risks & Mitigations
- **Risk**: Turn skip spam by a host.
- **Mitigation**: Guard the Host skip button so it only activates when the active player has been inactive for at least 30 seconds or the timer has expired.

---

## 5. Summary Matrix & Action Plan

| Issue | Root Cause Code | Difficulty | Implementation Priority |
|---|---|---|---|
| **1. Clash Tie Re-Roll** | `KontrolaDiceRoller.jsx:262` (`>=` check) | Low | **Immediate** |
| **2. Premature Victory / Chat Drop** | `KontrolaArena.jsx:340` (channel teardown loop) | Medium | **High** |
| **3. Turn Freezing & No Skip** | Missing Pass Turn button + dropped packets | Medium | **High** |

---

*This document is saved in `Kontrolla_Data/Docs/KONTROLA_MODE_BRAINSTORMING_AND_AUDIT.md` for permanent reference. Code execution will commence upon client instructions.*

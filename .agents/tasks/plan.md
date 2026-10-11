# Implementation Plan — TCG Companion Bug Fixes (5 targeted fixes)

Grounded in full reads of all affected files. Ordered by dependency.

---

## Quick Reference

| Fix | File(s) |
|-----|---------|
| FIX 1 — Lightning X2 skips 2 turns | `src/game/utils/gameEngine.js`, `src/game/components/BattleArena.jsx`, `src/game/data/cards.js` |
| FIX 2 — Kontrol/Blitz not in action deck | `src/game/data/cards.js`, `src/game/utils/gameEngine.js`, `src/game/components/BattleArena.jsx`, `src/game/components/CardActionModal.jsx` |
| FIX 3 — Kontrol correct rules | `src/game/components/KontrolModal.jsx` |
| FIX 4 — Blitz 2-use limit, 5 ET, HP < 50 | `src/game/components/BlitzModal.jsx`, `src/game/components/CardActionModal.jsx`, `src/game/utils/gameEngine.js`, `src/game/components/BattleArena.jsx` |
| FIX 5 — Admin Support Panel reply works | `src/components/AdminSupportPanel.jsx`, `src/services/supportService.js` |

---

## What I found reading the code

**FIX 1 — Lightning X2 stun duration**

`gameEngine.js` `resolveDiceCombat()` (lines ~302–315) already computes `sleepTurns`:
- `LIGHTNING X2` → `sleepTurns = 2`
- `LIGHTNING X1` → `sleepTurns = 1`

It checks `actionCard?.name` only. But `LIGHTNING X2` is **not in `ACTION_CARDS` in `cards.js`** — only `LIGHTNING X1` (`id: 'lightning_x1'`) exists. The `sleepTurns` for character Lightning moves (e.g. Chynaman's `Golden Mic Lightning`) uses a fallback branch that sets `sleepTurns = 1`.

In `BattleArena.jsx` `handleCompleteCombatResolution` (line ~444–445), the defender update is:
```js
isStunned: result.appliesStun ? true : p.isStunned,
sleepTurns: result.sleepTurns > 0 ? (p.sleepTurns || 0) + result.sleepTurns : p.sleepTurns,
```
This **adds** to existing `sleepTurns` rather than replacing, which is correct. But `isStunned` is also set separately when `appliesStun` is true, and `advanceTurn` skips the player for **either** `isStunned === true` **or** `sleepTurns > 0`. The two flags are not exclusive — Lightning moves returning both `appliesStun: true` (via `characterMove.appliesStun`) AND `sleepTurns: 1` could double-consume.

In `advanceTurn` (gameEngine.js lines ~228–235), when a stunned player is found:
```js
stunnedSkips.push(nextIndex);
continue;
// ...later:
updated.isStunned = false;
if (updated.sleepTurns && updated.sleepTurns > 0) {
  updated.sleepTurns -= 1;
}
```
Both are decremented simultaneously — so if a player has `isStunned: true` AND `sleepTurns: 2`, they skip one turn (isStunned consumed) but sleepTurns is also decremented to 1, giving only 1 more skip = 2 total. Actually this works, but it's fragile. The cleaner fix is: for Lightning, set **only `sleepTurns`** (not `isStunned`) and skip based purely on `sleepTurns > 0`.

`LIGHTNING X2` card needs to be **added to `cards.js`** so it appears in the action deck. Its `sleepTurns: 2` logic in `resolveDiceCombat` is already correct once the card exists with name `'LIGHTNING X2'`.

**FIX 2 — Kontrol/Blitz in action deck**

`cards.js` `ACTION_CARDS` array does NOT contain `kontrol_card` or `blitz_card` entries — the array only has 10 standard cards. **These are not injected from `cards.js`.**

`gameEngine.js` `drawRandomCards()` (lines 7–11) picks randomly from `ACTION_CARDS`. Since Kontrol/Blitz are not in that array, they are NOT dealt randomly.

However, `CardActionModal.jsx` has explicit handlers for `card.id === 'kontrol_card'` and `card.id === 'blitz_card'`. These would only trigger if a card with those IDs appears in `activePlayer.actionCardsHand`. Since `drawRandomCards` never draws them, **the only way they appear is if something injects them manually.**

After checking all of `BattleArena.jsx`, `gameEngine.js`, `createInitialGameState`, and `advanceTurn` — **no injection was found in the current codebase.** The `CardActionModal.jsx` dead-code handlers for `kontrol_card`/`blitz_card` are vestigial from a previous design where they were action cards. They are harmless but misleading; the `disabledForZombie` check even references them (`card.id === 'kontrol_card' || card.id === 'blitz_card'`).

The fix is to: (1) confirm no injection path exists, (2) remove the vestigial `kontrol_card`/`blitz_card` dead code from `CardActionModal.jsx`, and (3) ensure `CharacterCardModal` is the sole UI access point (it already is — `BattleArena.jsx` opens `showCharacterCardModal` from the hero card view button, and `CharacterCardModal` displays all character moves including Blitz/Kontrol for reference only).

**FIX 3 — Kontrol rules**

`KontrolModal.jsx` `handleRoll()` (lines ~50–80) has the bug: after rolling both dice, it computes:
```js
const effectiveAtk = finalAtk + atkBonus;        // attacker die + mind bonus
if (effectiveAtk > defMindStrength) { newAtkWins++ }  // BUG: comparing to static stat
```
This compares attacker's die roll against the **defender's Mind Strength stat (a static number 1–5)**, not the defender's die roll. The defender die `finalDef` is rolled but never used in the comparison.

The correct rule for standard (non-Fate-Card) mode: `finalAtk + atkBonus > finalDef` wins the round. Ties → neither wins, re-roll.

For Fate Card mode: defender rolls only their own die and must meet a threshold based on Mind Strength:
- MS 1 → must roll 5+
- MS 2 → must roll 4+
- MS 3 → must roll 3+
- MS 4 → must roll 2+
- MS 5 → must roll 1+

The UI shows the defender's "die" as a blue box displaying `targetChar?.mindStrength` (the static stat, line ~280). This needs to display the actual defender die roll in standard mode.

A Fate Card toggle checkbox must be added to switch between the two modes.

**FIX 4 — Blitz 2-use limit**

`gameEngine.js` `createInitialGameState` already initializes `blitzUsesLeft: 2` (line ~36).

`BlitzModal.jsx` checks `attacker.hp < 50 && attacker.energyTokens >= 5` in `canUseBlitz`. It does **not** check `attacker.blitzUsesLeft > 0`. When `blitzUsesLeft === 0`, the button would still be enabled if HP/ET conditions are met. Fix: add `&& attacker.blitzUsesLeft > 0` to `canUseBlitz`.

`handleCompleteBlitz` in `BattleArena.jsx` already decrements `blitzUsesLeft` (line ~582: `blitzUsesLeft: Math.max(0, (p.blitzUsesLeft ?? 2) - 1)`). That part is correct.

`CardActionModal.jsx` already checks `(activePlayer.blitzUsesLeft ?? 2) <= 0` and shows error — that guard is present. The gap is only in `BlitzModal.jsx`'s `canUseBlitz` computation and button label.

**FIX 5 — Admin Support Panel reply**

`supportService.js` `addSupportReply()` (lines ~113–142) inserts into `support_replies` using the standard `supabase` client with only the anon key. The `support_replies` table has **no RLS policies in `schema.sql`** — the schema.sql file has no `CREATE TABLE support_replies` or any associated policies. This means the table either: (a) was created manually without RLS, or (b) defaulted to blocking all access because no policies exist.

The `.env` file only has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — there is **no service-role key**. Therefore we cannot create a secondary service-role client.

The fix must: (1) add visible error state in the UI (above the reply area, not buried below), (2) log the full `replyError` object (not just the message) in `supportService.js`, (3) check whether the Supabase auth session is active before attempting the insert, (4) surface a clear actionable error message if the user is not authenticated, (5) add RLS policy SQL to `schema.sql` that allows admins to insert into `support_replies`, (6) add 'no ticket selected' guard, and (7) move `modNotice` to a floating notification at the top of the conversation panel.

---

## Implementation Steps

- [ ] 1. **FIX 1 part A — Add LIGHTNING X2 to ACTION_CARDS in cards.js**

  `LIGHTNING X2` is referenced in `gameEngine.js` `resolveDiceCombat` and in `KontrolaEngine.js` but is absent from `ACTION_CARDS` in `cards.js`. Add it after the existing `lightning_x1` entry so `drawRandomCards` can deal it.

  Files: `src/game/data/cards.js`

  Add after the `lightning_x1` entry (after line 96):
  ```js
  {
    id: 'lightning_x2',
    name: 'LIGHTNING X2',
    type: 'ATTACK',
    costET: 2,
    icon: '⚡⚡',
    color: '#ffe93d',
    desc: 'Heavy lightning strike dealing damage, removes 1 Poison card, and -2 turn penalty (2 ET).'
  }
  ```

  Verify: `npm run build` completes without errors.

---

- [ ] 2. **FIX 1 part B — Clean up sleepTurns/isStunned double-stack in gameEngine.js and BattleArena.jsx**

  **In `gameEngine.js` `resolveDiceCombat`**: The existing `sleepTurns` computation (lines ~302–315) is already correct for Lightning cards detected via `actionCard?.name`. Ensure the character-move Lightning fallback also sets `sleepTurns` correctly:

  Current code (lines ~311–314):
  ```js
  } else if (characterMove?.name?.includes('Golden Mic Lightning') || characterMove?.element === 'Lightning') {
    sleepTurns = 1;
  }
  ```
  Change element check to also detect `LIGHTNING X2` from `characterMove.name` for any future character moves. The action card path (`cardName.includes('LIGHTNING X2')`) already sets `sleepTurns = 2`. No change needed to that branch.

  **Key fix — prevent double-stacking with `isStunned`**: In `resolveDiceCombat`, the return value includes both `appliesStun` (from `characterMove?.appliesStun`) and `sleepTurns`. For Lightning moves, `characterMove.appliesStun` may be undefined/false so this is likely fine, but add a guard: if `sleepTurns > 0`, force `appliesStun: false` in the return object to prevent dual-flag behavior.

  Change the return block: add `appliesStun: sleepTurns > 0 ? false : (characterMove?.appliesStun || ...)` logic.

  **In `BattleArena.jsx` `handleCompleteCombatResolution`** (around line 444): The current code adds `sleepTurns` to existing sleep and also sets `isStunned`. Since we're now ensuring `appliesStun` is false when `sleepTurns > 0`, verify that for Lightning hits the defender gets `sleepTurns` incremented and `isStunned` left alone.

  The line:
  ```js
  sleepTurns: result.sleepTurns > 0 ? (p.sleepTurns || 0) + result.sleepTurns : p.sleepTurns,
  ```
  Should **replace** rather than **accumulate** if a new hit lands:
  ```js
  sleepTurns: result.sleepTurns > 0 ? result.sleepTurns : p.sleepTurns,
  ```
  Rationale: a second Lightning hit while already sleeping should reset the counter to the new value (the stronger hit wins), not stack to 4 turns.

  Files: `src/game/utils/gameEngine.js`, `src/game/components/BattleArena.jsx`

  Verify: `npm run build` completes without errors. Manual test: use Lightning X2 action card in combat, confirm the target's `sleepTurns` becomes 2 in the game state and they skip the next 2 turns.

---

- [ ] 3. **FIX 2 — Remove vestigial kontrol_card/blitz_card dead code from CardActionModal.jsx**

  `cards.js` does not inject these into the action deck. `drawRandomCards` cannot produce them. The `CardActionModal.jsx` has dead handlers and a dead `disabledForZombie` check for these IDs. Remove them to prevent confusion and future bugs.

  **In `CardActionModal.jsx`**:
  - Remove the `if (card.id === 'kontrol_card') { ... }` block (lines ~52–67) from `handleActionClick`.
  - Remove the `if (card.id === 'blitz_card') { ... }` block (lines ~68–88) from `handleActionClick`.
  - Change the `disabledForZombie` check:
    ```js
    // Before:
    const disabledForZombie = isZombie && (card.id === 'kontrol_card' || card.id === 'blitz_card');
    // After:
    const disabledForZombie = false; // No cards are zombie-disabled from the action deck
    ```
  - Keep `onOpenKontrol` and `onOpenBlitz` props in the component signature — they're still used by `BattleArena.jsx` via the `CharacterCardModal` flow. (Actually verify: `CharacterCardModal` is informational only and does NOT call these props. The props are passed down but only used from the now-removed dead code. Leave prop signatures intact for extensibility but they can be left unused.)

  **No changes needed to `cards.js`, `gameEngine.js`, or `BattleArena.jsx`** — the deck is already clean.

  Files: `src/game/components/CardActionModal.jsx`

  Verify: `npm run build` completes. Start a game, open Card Action Modal — Kontrol and Blitz entries should never appear in the hand grid.

---

- [ ] 4. **FIX 3 — Rewrite KontrolModal handleRoll for correct best-of-3 rules**

  The current code (line ~69): `if (effectiveAtk > defMindStrength)` compares attacker die to the static Mind Strength stat. This is wrong for standard mode.

  **Add Fate Card mode state**:
  ```js
  const [useFateCard, setUseFateCard] = useState(false);
  ```

  **Rewrite `handleRoll`** (inside the `setInterval` callback, after final rolls are set):

  Standard mode (no Fate Card):
  ```js
  const atkTotal = finalAtk + (atkChar.mindAtkBonus || 0);
  const defTotal = finalDef;  // defender rolls a real die
  if (atkTotal > defTotal) {
    newAtkWins += 1;
    setRoundResult('atk_win');
    newRoundNumber += 1;
  } else if (atkTotal < defTotal) {
    newDefWins += 1;
    setRoundResult('def_win');
    newRoundNumber += 1;
  } else {
    setRoundResult('tie');
    // round not counted, re-roll same round (no freeze)
  }
  ```

  Fate Card mode (defender rolls to resist):
  ```js
  const ms = targetChar?.mindStrength || 1;
  const threshold = Math.max(1, 6 - ms); // MS1→5, MS2→4, MS3→3, MS4→2, MS5→1
  // Only defender rolls; finalDef is used
  if (finalDef >= threshold) {
    // Defender resists — defender wins this round
    newDefWins += 1;
    setRoundResult('def_win');
    newRoundNumber += 1;
  } else {
    newAtkWins += 1;
    setRoundResult('atk_win');
    newRoundNumber += 1;
  }
  ```

  **Update the dice display area**:
  - Attacker die box: currently shows `currentAtkRoll` — keep as-is.
  - Defender die box: currently shows `targetChar?.mindStrength` (static) → change to show `currentDefRoll` in standard mode. In Fate Card mode it can still show `currentDefRoll` (the defender's rolled die) alongside the threshold text.
  - Add a label under the defender die: in standard mode show "Rolled" / in Fate Card mode show `"Need ${threshold}+"`.

  **Add Fate Card toggle UI**: Above the roll button area, add a checkbox / toggle row:
  ```
  [ ] Defender uses Fate Card (roll to resist)?
  ```
  When checked, `useFateCard` is set to `true` and the mode-specific logic applies. The toggle should only be visible before the first roll (disable/hide once rolling has started, i.e. `atkWins > 0 || defWins > 0`).

  **Fix round display in scoreboard**: The VS badge shows `ROUND {roundNumber}`. In the tie case, `roundNumber` must not increment — the current code already avoids incrementing in the tie branch, so this is correct.

  Files: `src/game/components/KontrolModal.jsx`

  Verify: `npm run build`. Manual test: Start Kontrol, roll until a tie occurs — confirm neither player gets a win point and the "RE-ROLL (TIE)" button appears without freezing. Test Fate Card mode: check the toggle, confirm defender rolls their die against the threshold table.

---

- [ ] 5. **FIX 4 — Enforce blitzUsesLeft in BlitzModal canUseBlitz check**

  `BlitzModal.jsx` computes:
  ```js
  const canUseBlitz = attacker.hp < 50 && attacker.energyTokens >= 5;
  ```
  This ignores `blitzUsesLeft`. The guard in `CardActionModal.jsx` already blocks entry when `blitzUsesLeft === 0`, but if `BlitzModal` is opened by another path in the future (or if the guard is bypassed), the button will still fire.

  **In `BlitzModal.jsx`**, change:
  ```js
  const canUseBlitz = attacker.hp < 50 && attacker.energyTokens >= 5;
  ```
  to:
  ```js
  const blitzUsesLeft = attacker.blitzUsesLeft ?? 2;
  const canUseBlitz = attacker.hp < 50 && attacker.energyTokens >= 5 && blitzUsesLeft > 0;
  ```

  Update the disabled message shown when HP >= 50 to also show a uses-exhausted message when `blitzUsesLeft === 0`:
  ```jsx
  {blitzUsesLeft === 0 && (
    <div style={{ /* same red warning style */ }}>
      <AlertOctagon size={16} />
      <span>Saigo No Blitz has been used 2/2 times this match.</span>
    </div>
  )}
  ```

  No changes needed to `gameEngine.js` (`blitzUsesLeft: 2` is already initialized in `createInitialGameState`) or `BattleArena.jsx` (`handleCompleteBlitz` already decrements it).

  Files: `src/game/components/BlitzModal.jsx`

  Verify: `npm run build`. Manual test: Use Blitz twice in a match. On the third attempt, the button should be grey/disabled and show "used 2/2 times".

---

- [ ] 6. **FIX 5 — Admin Support Panel: add RLS policy for support_replies, improve error handling**

  **Sub-step A — Add RLS SQL to `supabase/schema.sql`**:

  The `support_replies` table has no RLS policies in the schema. Add the following block at the end of `schema.sql`:
  ```sql
  -- ====================================================================
  -- SUPPORT TICKETS & REPLIES TABLES (Admin two-way messaging)
  -- ====================================================================

  create table if not exists public.support_tickets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete set null,
    username text,
    subject text not null,
    message text not null,
    screenshot_url text,
    status text default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  create table if not exists public.support_replies (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid references public.support_tickets(id) on delete cascade not null,
    message text not null,
    sender_type text not null check (sender_type in ('admin', 'player')),
    admin_id uuid references auth.users(id) on delete set null,
    admin_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  alter table public.support_tickets enable row level security;
  alter table public.support_replies enable row level security;

  -- Support tickets: anyone can submit, admins can view all, users can view own
  drop policy if exists "Anyone can submit support tickets" on public.support_tickets;
  create policy "Anyone can submit support tickets"
    on public.support_tickets for insert with check (true);

  drop policy if exists "Users can view own tickets" on public.support_tickets;
  create policy "Users can view own tickets"
    on public.support_tickets for select using (auth.uid() = user_id or user_id is null);

  drop policy if exists "Admins can view all support tickets" on public.support_tickets;
  create policy "Admins can view all support tickets"
    on public.support_tickets for select
    using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

  drop policy if exists "Admins can update support tickets" on public.support_tickets;
  create policy "Admins can update support tickets"
    on public.support_tickets for update
    using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

  drop policy if exists "Admins can delete support tickets" on public.support_tickets;
  create policy "Admins can delete support tickets"
    on public.support_tickets for delete
    using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

  -- Support replies: admins can insert and view all; players can view replies to their own tickets
  drop policy if exists "Admins can insert support replies" on public.support_replies;
  create policy "Admins can insert support replies"
    on public.support_replies for insert
    with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

  drop policy if exists "Admins can view all support replies" on public.support_replies;
  create policy "Admins can view all support replies"
    on public.support_replies for select
    using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

  drop policy if exists "Players can view replies to own tickets" on public.support_replies;
  create policy "Players can view replies to own tickets"
    on public.support_replies for select
    using (
      exists (
        select 1 from public.support_tickets
        where id = ticket_id and user_id = auth.uid()
      )
    );

  drop policy if exists "Admins can delete support replies" on public.support_replies;
  create policy "Admins can delete support replies"
    on public.support_replies for delete
    using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
  ```

  Files: `supabase/schema.sql`

  **Sub-step B — Fix `supportService.js` addSupportReply**:

  In `addSupportReply`, replace the current insert block with an enhanced version that:
  1. Checks if `supabase` is configured before proceeding.
  2. Logs the **full `replyError` object** (not just message).
  3. Checks whether the current Supabase auth session exists; if not, throws a descriptive error.

  ```js
  async addSupportReply(ticketId, message, senderType, adminId = null, adminName = null) {
    if (!supabase) throw new Error('Supabase not configured');

    // Check auth session — admin inserts require an authenticated session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      throw new Error('Not authenticated. Please log in as admin before sending replies.');
    }

    try {
      const { data: reply, error: replyError } = await supabase
        .from('support_replies')
        .insert([{
          ticket_id: ticketId,
          message,
          sender_type: senderType,
          admin_id: adminId,
          admin_name: adminName,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (replyError) {
        console.error('Full replyError object:', replyError);
        throw replyError;
      }

      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (updateError) {
        console.error('Ticket timestamp update error:', updateError);
        // Non-fatal: reply was inserted; log but don't throw
      }

      return reply;
    } catch (err) {
      console.error('Failed to add support reply:', err);
      throw err; // Re-throw so AdminSupportPanel can catch and display it
    }
  }
  ```

  Files: `src/services/supportService.js`

  **Sub-step C — Fix `AdminSupportPanel.jsx`**:

  1. Add `replyError` state for inline display:
     ```js
     const [replyError, setReplyError] = useState('');
     ```

  2. Update `handleSendReply`:
     ```js
     const handleSendReply = async () => {
       if (!replyText.trim()) return;
       if (!selectedTicket) {       // no-ticket guard
         setReplyError('No ticket selected. Please select a ticket first.');
         return;
       }
       setIsSendingReply(true);
       setReplyError('');
       setModNotice('');
       try {
         const currentUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
         await supportService.addSupportReply(
           selectedTicket.id,
           replyText,
           'admin',
           currentUser.id,
           currentUser.email || 'Support Team'
         );
         setReplyText('');
         const updated = await supportService.getSupportTicketWithReplies(selectedTicket.id);
         setSelectedTicket(updated);
         setModNotice('✓ Reply sent');
         setTimeout(() => setModNotice(''), 3000);
       } catch (err) {
         console.error('Reply send error:', err);
         setReplyError(err.message || 'Failed to send reply. Check admin login status.');
       } finally {
         setIsSendingReply(false);
       }
     };
     ```

  3. Move `modNotice` to a floating overlay at the top of the conversation panel. Replace the current bottom `modNotice` div with a floating overlay inside the conversation `<div>`. Add before the conversation content:
     ```jsx
     {modNotice && (
       <div style={{
         position: 'sticky', top: 0, zIndex: 10,
         background: modNotice.startsWith('✓') ? 'rgba(57,255,20,0.15)' : 'rgba(237,30,36,0.15)',
         border: `1px solid ${modNotice.startsWith('✓') ? '#39ff14' : '#ED1E24'}`,
         color: modNotice.startsWith('✓') ? '#39ff14' : '#ED1E24',
         padding: '8px 16px', fontSize: '0.85rem', fontWeight: 'bold', borderRadius: '6px', margin: '0 0 12px 0'
       }}>
         {modNotice}
       </div>
     )}
     ```
     Remove the old bottom `modNotice` block.

  4. Add inline `replyError` display directly above the textarea in the reply input area:
     ```jsx
     {replyError && (
       <div style={{
         marginBottom: '8px', padding: '8px 12px',
         background: 'rgba(237,30,36,0.15)', border: '1px solid #ED1E24',
         color: '#ED1E24', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 'bold'
       }}>
         ✗ {replyError}
       </div>
     )}
     <textarea ... />
     ```

  Files: `src/components/AdminSupportPanel.jsx`, `src/services/supportService.js`

  Verify: `npm run build`. Manual test: Open the Admin Panel → Support tab with an admin user logged in. Select a ticket, type a reply, and send. Reply should appear in the conversation. Test without login to confirm the error state shows "Not authenticated".

  > **Deployment note**: The RLS policies in `supabase/schema.sql` must be run in the Supabase SQL Editor for the live database before the fix is effective. The schema.sql file serves as the source of truth — run the new block in the Supabase dashboard SQL editor.

---

## Build commands

```
npm run build    # tsc + vite build — use to verify each step
npm run dev      # for manual testing
```

No test framework is configured in this project (no vitest, jest, etc.) — all verification is build-pass + manual browser test.

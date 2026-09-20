-- ====================================================================
-- ATTENTION TCG ECOSYSTEM: DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/wyraulajgkonsukrtcvq/sql
-- ====================================================================

-- 1. PROFILES TABLE (Player Identity & Stats across Companion & Sister Apps)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  username text unique not null,
  avatar_id text default 'chynaman',
  is_admin boolean default false,
  registered_app text default 'companion_hub',
  last_active_app text default 'companion_hub',
  matches_played integer default 0,
  matches_won integer default 0,
  crystals_collected integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;

create policy "Public profiles are viewable by everyone" 
  on public.profiles for select using (true);

create policy "Users can insert their own profile" 
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.profiles for update using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Automatic profile sync & Admin privilege assigner on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    username,
    avatar_id,
    is_admin,
    registered_app,
    last_active_app
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_id', 'chynaman'),
    case when lower(new.email) = 'admin@tcgcompanion.com' then true else coalesce((new.raw_user_meta_data->>'is_admin')::boolean, false) end,
    coalesce(new.raw_user_meta_data->>'registered_app', 'companion_hub'),
    coalesce(new.raw_user_meta_data->>'registered_app', 'companion_hub')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    is_admin = case when lower(excluded.email) = 'admin@tcgcompanion.com' then true else profiles.is_admin end,
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-confirm email in auth.users and ensure is_admin = true on database
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) in ('admin@tcgcompanion.com', 'admin@tcgcomapnion.com');

update public.profiles
set is_admin = true
where lower(email) in ('admin@tcgcompanion.com', 'admin@tcgcomapnion.com');


-- 2. RULES KNOWLEDGE TABLE (Dynamic Rules Knowledge Base)
create table if not exists public.rules_knowledge (
  id uuid default gen_random_uuid() primary key,
  topic text not null,
  category text not null default 'Gameplay', -- 'Setup', 'Combat', 'Characters', 'Cards', 'Lore'
  keywords text[] not null,                  -- Array of search tokens for fast matching
  short_answer text not null,                -- Concise answer for TTS voice synthesis
  details text not null,                     -- Detailed formatted text for UI chat card
  order_index integer default 0,
  is_active boolean default true,
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for rules_knowledge
alter table public.rules_knowledge enable row level security;

drop policy if exists "Anyone can view active rules knowledge" on public.rules_knowledge;
drop policy if exists "Admins can view all rules including inactive" on public.rules_knowledge;
drop policy if exists "Admins can insert rules knowledge" on public.rules_knowledge;
drop policy if exists "Admins can update rules knowledge" on public.rules_knowledge;
drop policy if exists "Admins can delete rules knowledge" on public.rules_knowledge;

create policy "Anyone can view active rules knowledge" 
  on public.rules_knowledge for select using (is_active = true);

create policy "Admins can view all rules including inactive" 
  on public.rules_knowledge for select 
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can insert rules knowledge" 
  on public.rules_knowledge for insert 
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can update rules knowledge" 
  on public.rules_knowledge for update 
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can delete rules knowledge" 
  on public.rules_knowledge for delete 
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));


-- 3. USER QUESTIONS & FEEDBACK TABLE (Continuous Learning Loop)
create table if not exists public.user_questions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_name text,
  question_text text not null,
  ai_answer text not null,
  matched_topic text,
  user_rating text check (user_rating in ('helpful', 'unhelpful', null)),
  user_suggested_answer text,                -- What the player thinks the answer should be
  admin_status text default 'pending' check (admin_status in ('pending', 'reviewed', 'approved_for_kb', 'dismissed')),
  admin_approved_answer text,
  app_source text default 'companion_hub',   -- Originating app ('companion_hub', 'sister_mobile', 'sister_tournament')
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for user_questions
alter table public.user_questions enable row level security;

drop policy if exists "Anyone can submit questions" on public.user_questions;
drop policy if exists "Users can update feedback on their questions" on public.user_questions;
drop policy if exists "Admins can view all submitted questions" on public.user_questions;
drop policy if exists "Admins can update question status and approved answers" on public.user_questions;

create policy "Anyone can submit questions" 
  on public.user_questions for insert with check (true);

create policy "Users can update feedback on their questions" 
  on public.user_questions for update 
  using (auth.uid() = user_id or user_id is null);

create policy "Admins can view all submitted questions" 
  on public.user_questions for select 
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can update question status and approved answers" 
  on public.user_questions for update 
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));


-- ====================================================================
-- SEED INITIAL 15 OFFICIAL RULES FROM rulesKnowledge.js INTO DATABASE
-- ====================================================================

insert into public.rules_knowledge (topic, category, keywords, short_answer, details, order_index)
values
(
  'Official Attention TCG Rules & Overview',
  'Gameplay',
  array['rule', 'rules', 'rule of the game', 'rules of the game', 'core rules', 'game rules', 'how to play', 'how do you play', 'overview', 'whats the rule', 'what are the rules', 'gameplay', 'basic rules', 'how does the game work', 'tell me the rules', 'begin', 'setup', 'start'],
  'In Attention TCG, players roll 2 dice for turn order, start with 5 Energy Tokens (ET), 10 Action Cards, 10 Character Cards, and 1 Stability Crystal (2 in a 2-player duel). The goal is to defeat opponents in 2-stage dice combat and be the first to collect 3 Stability Crystals to save your world!',
  'Attention TCG Core Rules Summary:

1. Game Objective:
Defeat opponents to claim their Stability Crystals. The first player to collect 3 Stability Crystals wins the match and saves their world from the evil Caca (Cacathar)!

2. Setup & Hand Size:
- Roll 2 dice to determine first player; highest roller chooses character first and decides clockwise or counterclockwise turn rotation.
- Every player maintains exactly 10 Action Cards and 10 Character Cards in hand at all times.
- Each player starts with 5 Energy Tokens (ET) and 1 Stability Crystal (2 in a 2-player game).

3. Turn Sequence:
- Active player may claim +1 free Energy Token during their turn (Use It or Lose It: no one will remind you!).
- Play an Action Card paired with a Character Card to make the action valid.
- After resolving, discard both and immediately draw replacements to keep 10 of each in hand.

4. 2-Stage Combat Clash:
- Phase 1 (The Clash): Attacker rolls 2 Red dice, Defender rolls 2 Gold dice. Attacker must roll higher to hit.
- Phase 2 (The Multiplier): If the attacker wins, they roll 1 single die for their AP multiplier.
- DP Defense: If Defender rolls 6+ on 2 dice during the clash, their DP armor reduces damage even if they lost!

5. Energy & Attacks:
- Regular Attack: 1 ET
- Super Attack: 2 ET
- Kontrol Card: 3 ET
- Saigo No Blitz: 5 ET (Usable only when HP < 50)',
  1
),
(
  'Game Lore & Objective',
  'Lore',
  array['lore', 'story', 'goal', 'objective', 'caca', 'cacathar', 'stability crystal', 'crystal', 'win', 'victory', 'universe', 'kill', 'steal', 'three crystals', '3 crystals'],
  'Defeat opponents to claim their Stability Crystals. The first warrior to hold 3 Stability Crystals saves their world from Caca (Cacathar, The Devourer of Souls) and wins!',
  'The Story:
In the Anime Series Attention, the evil grand being Caca (Cacathar, The Devourer of Souls) has sucked out and absorbed all the worlds in the universe, causing all worlds to be unstable. Each character''s mission is to obtain 3 Stability Crystals to bring life and stability back into their world.

Victory Rules:
- Each player begins with 1 Stability Crystal placed in front of them.
- In a 2-player duel, each player starts with 2 Stability Crystals.
- Defeating an opponent (reducing them to 0 HP) allows you to collect their Stability Crystal.
- The first player to obtain 3 Stability Crystals wins and saves their world.
- The winner may also choose to opt out while other players continue battling for the remaining crystals.',
  2
),
(
  'Game Setup & How to Begin',
  'Setup',
  array['setup', 'begin', 'start', 'how to play', 'first player', 'dice roll off', 'clockwise', 'counterclockwise', 'shuffle', '10 cards', 'starting', 'character select'],
  'All players roll 2 dice. Highest roll picks character first and decides clockwise or counterclockwise turn order. Each player starts with 5 ET, 1 Crystal, 10 Action Cards, and 10 Character Cards.',
  'Match Setup Procedure:
1. All players roll two dice. The player with the highest roll is the first player and decides turn rotation direction.
2. The first player shuffles the Action Card deck and passes out 10 Action Cards to each player.
3. Each player chooses one unique character. No two players can choose the same character.
4. Each player receives 10 Character Cards of their chosen character.
5. Players keep their Action Cards and Character Cards hidden.
6. Each player receives 1 Stability Crystal Card (2 Crystals in a 2-player game).
7. Each player starts with 5 Energy Tokens.

Turn Cycle:
- Active player may claim +1 ET (must request it, no one will remind them).
- Player picks an Action Card and pairs it with a Character Card to make the action valid.
- After resolving, discard the Action Card and Character Card and draw replacements.
- Players must always maintain 10 Action Cards and 10 Character Cards in hand.',
  3
),
(
  '2-Stage Clash Roll & Defense Point (DP) Rule',
  'Combat',
  array['dice', 'defense', 'roll', 'dp', 'defense point', 'defense power', 'basic defense', '6', 'gold dice', 'red dice', 'combat', 'clash', 'doubles', 'attack roll', 'two dice', 'miss'],
  'Phase 1 (Clash): Both roll 2 dice, attacker must roll higher to hit. Phase 2 (Multiplier): Attacker rolls 1 die for AP. Defender DP (-10 or -15 AP) activates if they roll 6+.',
  'Combat Resolution:
1. Phase 1 (The Clash): Attacker rolls 2 Red dice, Defender rolls 2 Gold dice. If Attacker Sum is greater than Defender Sum, the attacker wins. If the attacker loses or ties, they miss with 0 Damage.
2. Phase 2 (The Multiplier): If the attacker wins, they roll 1 single die for their AP multiplier. Example: Chynaman rolls a 3 x 5 AP = 15 AP damage.
3. Defense Point (DP) Check: If the Defender rolls 6 or higher on 2 dice during the clash, their DP armor activates and reduces incoming AP, even if they lost the clash.

DP Values by Character:
- Chynaman: -15 AP
- Katsumi: -15 AP
- Kiko the Monkey: -10 AP
- Shroomy: -10 AP
- Zabina "Bee" Solé: -10 AP
- Poochi: -10 AP
- Queeny: -10 AP

Doubles Rule: If a player rolls doubles during the clash, they claim 1 Chance Card and get a free re-roll!',
  4
),
(
  'Energy Tokens (ET) Economy',
  'Gameplay',
  array['energy', 'token', 'et', 'black', 'red', 'purple', 'gold', 'claim', 'cost', 'trade', 'economy', 'energy token', 'spend', 'use it or lose it'],
  'Players start with 5 ET and can claim +1 ET during their turn. No one will remind you! If your turn ends without claiming, it is lost until your next turn.',
  'Energy Token Mechanics:
- Token Values: Black = 1 ET, Red = 2 ET, Purple/Gold = 3 ET.
- Starting Reserve: Each player starts with 5 ET.
- Use It or Lose It: Players may claim 1 free ET at any point during their turn. No one will remind the player. Once their turn ends, they cannot receive it until the next turn.
- Move Costs:
  Regular / Basic Attack: 1 ET
  Super Attack: 2 ET
  Kontrol Card: 3 ET
  Saigo No Blitz: 5 ET
- Trade: ET may be traded to another player if they are soul alliance, or used as collateral for a Stability Crystal won from an Alliance battle.',
  5
),
(
  'Saigo No Blitz (Final Strike)',
  'Combat',
  array['saigo', 'blitz', 'saigo no blitz', '50 hp', 'sacrifice', 'devastating', 'final attack', '200 ap', '200 damage', 'critical'],
  'Saigo No Blitz unleashes an unstoppable 200 AP blast (costs 5 ET) and hits every opponent on the field. It can only be activated when your HP is below 50!',
  'Saigo No Blitz Rules:
- Prerequisite: May only be activated when the player has less than 50 HP.
- Cost: 5 Energy Tokens (ET).
- Area of Effect: Attacks all opponents on the field simultaneously.
- Power: Massive 200 AP devastation.
- High Risk / High Reward: If you activate it and do not eliminate opponents, your low HP leaves you vulnerable to elimination on the following turn.',
  6
),
(
  'Zombie Mode & Infection',
  'Characters',
  array['zombie', 'zombie mode', 'poison', '5 poison', 'undead', 'infection', 'revive zombie', 'cure zombie', 'antidote'],
  'When a player accumulates 5 Poison cards, they transform into a Zombie with 40 HP! Zombies cannot hold Stability Crystals, but gain +10 HP per turn and can infect opponents.',
  'Zombie Mode Mechanics:
- Transformation: Triggered immediately when a character is inflicted with 5 Poison cards.
- Zombie Stats: Current HP is replaced with exactly 40 HP.
- Ability - Regeneration: The Zombie recovers +10 HP automatically at the start of each of their turns.
- Ability - Venom Strike: Dealing damage to an opponent infects that opponent with 1 Poison card.
- Vulnerability: Fire and Lightning attacks cleanse 1 Poison card from the Zombie on hit.
- Crystal Restriction: Zombies are mindless beings and cannot collect or carry Stability Crystals. Any crystals they held drop to the board.
- Cure: Playing Antidote cards reduces Poison cards below 5, instantly curing the warrior back to their normal form with their restored pre-zombie HP.',
  7
)
on conflict do nothing;

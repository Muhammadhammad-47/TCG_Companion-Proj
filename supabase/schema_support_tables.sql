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

-- ====================================================================
-- ACTIVE GAME ROOMS TABLE (Multiplayer room persistence & reconnection)
-- ====================================================================

create table if not exists public.active_game_rooms (
  id uuid default gen_random_uuid() primary key,
  room_code text unique not null,
  game_state jsonb not null,
  players jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

-- Create index on room_code for faster lookups
create index if not exists idx_active_game_rooms_room_code on public.active_game_rooms(room_code);

-- Create index on expires_at for cleanup queries
create index if not exists idx_active_game_rooms_expires_at on public.active_game_rooms(expires_at);

alter table public.active_game_rooms enable row level security;

-- RLS Policy: Anyone can read rooms (for reconnection - no auth needed for local play)
drop policy if exists "Anyone can read active game rooms" on public.active_game_rooms;
create policy "Anyone can read active game rooms"
  on public.active_game_rooms for select with check (true);

-- RLS Policy: Anyone can insert rooms (for creating new games)
drop policy if exists "Anyone can create active game rooms" on public.active_game_rooms;
create policy "Anyone can create active game rooms"
  on public.active_game_rooms for insert with check (true);

-- RLS Policy: Anyone can update rooms (for game state persistence)
drop policy if exists "Anyone can update active game rooms" on public.active_game_rooms;
create policy "Anyone can update active game rooms"
  on public.active_game_rooms for update with check (true);

-- RLS Policy: Anyone can delete expired rooms (cleanup)
drop policy if exists "Anyone can delete active game rooms" on public.active_game_rooms;
create policy "Anyone can delete active game rooms"
  on public.active_game_rooms for delete with check (true);

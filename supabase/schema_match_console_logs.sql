-- =========================================================================
-- MATCH CONSOLE LOGS TABLE
-- Stores per-player browser console logs for each Kontrola Arena match
-- so admins can inspect and copy all players' logs from Match History.
-- =========================================================================

create table if not exists public.match_console_logs (
  id uuid default gen_random_uuid() primary key,
  room_code text not null,
  player_id text not null,
  player_name text default 'Player',
  role text default 'PLAYER',
  logs jsonb default '[]'::jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (room_code, player_id)
);

create index if not exists idx_match_console_logs_room_code on public.match_console_logs (room_code);
create index if not exists idx_match_console_logs_updated_at on public.match_console_logs (updated_at desc);

alter table public.match_console_logs enable row level security;

drop policy if exists "Match console logs viewable by everyone" on public.match_console_logs;
create policy "Match console logs viewable by everyone"
  on public.match_console_logs for select using (true);

drop policy if exists "Players can insert match console logs" on public.match_console_logs;
create policy "Players can insert match console logs"
  on public.match_console_logs for insert with check (true);

drop policy if exists "Players can update match console logs" on public.match_console_logs;
create policy "Players can update match console logs"
  on public.match_console_logs for update using (true);

drop policy if exists "Admins can prune old match console logs" on public.match_console_logs;
create policy "Admins can prune old match console logs"
  on public.match_console_logs for delete using (true);

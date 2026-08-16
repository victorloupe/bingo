-- ============================================================
-- Bingo 75 — Schema Supabase (sincronização local + nuvem)
-- Rode este script inteiro no "SQL Editor" do seu projeto Supabase.
-- ============================================================

create extension if not exists pgcrypto;

-- Estado atual do sorteio (uma linha por "sala" de jogo; usamos uma única
-- sala fixa 'default' pois o app roda um jogo por vez).
create table if not exists bingo_state (
  room        text primary key default 'default',
  drawn       jsonb not null default '[]'::jsonb,
  last        int,
  game_over   boolean not null default false,
  first_ts    bigint,
  last_ts     bigint,
  theme       text default 'dark',
  updated_at  timestamptz not null default now()
);

-- Ranking / vencedores registrados.
create table if not exists bingo_ranking (
  id          uuid primary key default gen_random_uuid(),
  room        text not null default 'default',
  name        text not null,
  type        text not null,
  ts          timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists bingo_ranking_room_idx on bingo_ranking (room);

alter table bingo_state   enable row level security;
alter table bingo_ranking enable row level security;

-- App sem autenticação (uso local/kiosk): libera leitura e escrita para a
-- chave anônima. Se um dia quiser múltiplos eventos isolados, troque
-- `using (true)` por uma checagem da coluna `room`.
drop policy if exists "bingo_state anon all" on bingo_state;
create policy "bingo_state anon all" on bingo_state
  for all using (true) with check (true);

drop policy if exists "bingo_ranking anon all" on bingo_ranking;
create policy "bingo_ranking anon all" on bingo_ranking
  for all using (true) with check (true);

-- REPLICA IDENTITY FULL é necessário para o Realtime conseguir filtrar
-- eventos de DELETE por "room" (sem isso, o payload de delete não traz
-- as demais colunas da linha apagada).
alter table bingo_state   replica identity full;
alter table bingo_ranking replica identity full;

-- Habilita os eventos em tempo real usados pelo app para sincronizar
-- automaticamente entre dispositivos (TV, celular do operador, etc.).
alter publication supabase_realtime add table bingo_state;
alter publication supabase_realtime add table bingo_ranking;

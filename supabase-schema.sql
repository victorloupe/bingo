-- ============================================================
-- Bingo 75 — Schema Supabase (Sincronização Nuvem + Multi-Rodadas)
-- Rode este script inteiro no "SQL Editor" do seu projeto Supabase.
-- ============================================================

create extension if not exists pgcrypto;

-- Estado do sorteio com suporte a lista completa de bingos da noite
create table if not exists bingo_state (
  room             text primary key default 'default',
  active_round_id  text not null default 'round_1',
  round_name       text not null default 'Rodada 1',
  rounds_list      jsonb not null default '[]'::jsonb,
  next_round       jsonb,
  rounds_queue     jsonb not null default '[]'::jsonb,
  drawn            jsonb not null default '[]'::jsonb,
  last             int,
  game_over        boolean not null default false,
  first_ts         bigint,
  last_ts          bigint,
  prizes           jsonb not null default '{"Terno":"1 Frango Assado","Quatro Cantos":"1 Caixa de Bombom","Cinquina":"1 Liquidificador","Cartela Cheia":"R$ 500,00"}'::jsonb,
  sponsors         jsonb not null default '[]'::jsonb,
  ad_mode          boolean not null default false,
  updated_at       timestamptz not null default now()
);

-- Migração automática para adicionar colunas se a tabela já existir
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bingo_state' and column_name='active_round_id') then
    alter table bingo_state add column active_round_id text not null default 'round_1';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bingo_state' and column_name='rounds_list') then
    alter table bingo_state add column rounds_list jsonb not null default '[]'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bingo_state' and column_name='round_name') then
    alter table bingo_state add column round_name text not null default 'Rodada 1';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bingo_state' and column_name='next_round') then
    alter table bingo_state add column next_round jsonb default '{}'::jsonb;
  else
    alter table bingo_state alter column next_round drop not null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bingo_state' and column_name='rounds_queue') then
    alter table bingo_state add column rounds_queue jsonb not null default '[]'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bingo_state' and column_name='prizes') then
    alter table bingo_state add column prizes jsonb not null default '{"Terno":"1 Frango Assado","Quatro Cantos":"1 Caixa de Bombom","Cinquina":"1 Liquidificador","Cartela Cheia":"R$ 500,00"}'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bingo_state' and column_name='sponsors') then
    alter table bingo_state add column sponsors jsonb not null default '[]'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bingo_state' and column_name='ad_mode') then
    alter table bingo_state add column ad_mode boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bingo_state' and column_name='ad_notice') then
    alter table bingo_state add column ad_notice jsonb default '{}'::jsonb;
  else
    alter table bingo_state alter column ad_notice drop not null;
  end if;
end $$;

-- Ranking / vencedores registrados
create table if not exists bingo_ranking (
  id          uuid primary key default gen_random_uuid(),
  room        text not null default 'default',
  name        text not null,
  type        text not null,
  ts          timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists bingo_ranking_room_idx on bingo_ranking (room);

-- Lotes de cartelas geradas em cartelas.html ("Cartelas Avulsas"). Antes,
-- esses lotes existiam só no localStorage do navegador onde foram gerados —
-- se a Mesa de Conferência (check.html) rodasse em outro aparelho, a busca
-- por número de série não encontrava a cartela. Agora os lotes também são
-- enviados para cá (melhor esforço, exige chave de operador) e a Mesa de
-- Conferência os busca daqui quando não os encontra localmente.
create table if not exists bingo_card_batches (
  id                    text primary key,
  room                  text not null default 'default',
  event_name            text,
  round_name            text,
  seed                  text,
  total_cards           int,
  start_serial          int,
  end_serial            int,
  cards                 jsonb not null default '[]'::jsonb,
  assigned_round_ids    jsonb not null default '[]'::jsonb,
  assigned_round_names  jsonb not null default '[]'::jsonb,
  cards_per_page        int,
  color_theme           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists bingo_card_batches_room_idx on bingo_card_batches (room);

alter table bingo_state        enable row level security;
alter table bingo_ranking      enable row level security;
alter table bingo_card_batches enable row level security;

-- ============================================================
-- SEGURANÇA — leitura pública, escrita só via função com chave
-- ============================================================
-- Antes, as políticas abaixo eram "for all using (true) with check (true)",
-- ou seja, QUALQUER pessoa com a anon key (que é pública por design, veja
-- supabase-config.js) podia inserir vencedores falsos ou apagar o estado
-- do sorteio direto pela API do Supabase, sem passar pela interface do
-- app. Como os prêmios são reais, isso é uma porta aberta para fraude.
--
-- Agora: SELECT continua público (o Telão e a Mesa de Conferência
-- precisam ler sem chave), mas INSERT/UPDATE/DELETE só acontecem através
-- das funções bingo_push_state / bingo_push_ranking abaixo, que exigem a
-- chave de operador (ver operator-key.js). Isso não é uma prova de bala
-- de canhão — a chave ainda viaja no JS do navegador do operador — mas
-- fecha o acesso trivial "abri o DevTools e chamei a API direto" que
-- qualquer participante do bingo conseguiria fazer antes.

drop policy if exists "bingo_state anon all" on bingo_state;
drop policy if exists "bingo_ranking anon all" on bingo_ranking;

drop policy if exists "bingo_state anon read" on bingo_state;
create policy "bingo_state anon read" on bingo_state for select using (true);

drop policy if exists "bingo_ranking anon read" on bingo_ranking;
create policy "bingo_ranking anon read" on bingo_ranking for select using (true);

drop policy if exists "bingo_card_batches anon read" on bingo_card_batches;
create policy "bingo_card_batches anon read" on bingo_card_batches for select using (true);

alter table bingo_state        replica identity full;
alter table bingo_ranking      replica identity full;
alter table bingo_card_batches replica identity full;

-- Tabela com a chave secreta do operador. RLS ligado e SEM nenhuma
-- política = ninguém com a anon key consegue ler ou escrever aqui
-- (só o "service role" ou o SQL Editor do dono do projeto).
create table if not exists bingo_admin_key (
  id     boolean primary key default true,
  secret text not null,
  constraint bingo_admin_key_single_row check (id)
);
alter table bingo_admin_key enable row level security;
revoke all on bingo_admin_key from anon, authenticated;

-- A chave é gerada aleatoriamente pelo próprio Postgres na primeira vez que
-- este script roda num projeto novo (nunca fica um valor fixo gravado aqui
-- no arquivo — importante porque este arquivo pode ir para um repositório
-- público no GitHub). O "on conflict do nothing" garante que, se você rodar
-- o script de novo depois (ex.: para aplicar uma atualização), a chave que
-- já está em uso NÃO é trocada — então isso é seguro rodar quantas vezes
-- precisar num projeto que já está em produção.
--
-- Depois de rodar este script pela PRIMEIRA VEZ num projeto Supabase novo,
-- pegue a chave gerada rodando no SQL Editor:
--   select secret from bingo_admin_key;
insert into bingo_admin_key (id, secret)
values (true, 'fb90cfc60a7eadaf52693d50b3817a8fb3e323053b029b3e')
on conflict (id) do update set secret = excluded.secret;

create or replace function bingo_check_key(p_key text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from bingo_admin_key
    where secret = p_key and p_key is not null and length(p_key) > 0
  );
$$;

create or replace function bingo_push_state(
  p_key             text,
  p_room            text,
  p_active_round_id text,
  p_round_name      text,
  p_rounds_list     jsonb,
  p_next_round      jsonb,
  p_rounds_queue    jsonb,
  p_drawn           jsonb,
  p_last            int,
  p_game_over       boolean,
  p_first_ts        bigint,
  p_last_ts         bigint,
  p_prizes          jsonb,
  p_sponsors        jsonb,
  p_ad_mode         boolean,
  p_ad_notice       jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not bingo_check_key(p_key) then
    raise exception 'chave de operador inválida';
  end if;

  insert into bingo_state (
    room, active_round_id, round_name, rounds_list, next_round, rounds_queue,
    drawn, last, game_over, first_ts, last_ts, prizes, sponsors, ad_mode, ad_notice, updated_at
  ) values (
    coalesce(p_room, 'default'), coalesce(p_active_round_id, 'round_1'), coalesce(p_round_name, 'Rodada 1'),
    coalesce(p_rounds_list, '[]'::jsonb), p_next_round, coalesce(p_rounds_queue, '[]'::jsonb),
    coalesce(p_drawn, '[]'::jsonb), p_last, coalesce(p_game_over, false), p_first_ts, p_last_ts,
    coalesce(p_prizes, '{}'::jsonb), coalesce(p_sponsors, '[]'::jsonb), coalesce(p_ad_mode, false), p_ad_notice,
    now()
  )
  on conflict (room) do update set
    active_round_id = excluded.active_round_id,
    round_name      = excluded.round_name,
    rounds_list     = excluded.rounds_list,
    next_round      = excluded.next_round,
    rounds_queue    = excluded.rounds_queue,
    drawn           = excluded.drawn,
    last            = excluded.last,
    game_over       = excluded.game_over,
    first_ts        = excluded.first_ts,
    last_ts         = excluded.last_ts,
    prizes          = excluded.prizes,
    sponsors        = excluded.sponsors,
    ad_mode         = excluded.ad_mode,
    ad_notice       = excluded.ad_notice,
    updated_at      = excluded.updated_at;
end;
$$;

create or replace function bingo_push_ranking(
  p_key  text,
  p_room text,
  p_rows jsonb  -- array de objetos {name, type, ts}
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not bingo_check_key(p_key) then
    raise exception 'chave de operador inválida';
  end if;

  delete from bingo_ranking where room = coalesce(p_room, 'default');

  insert into bingo_ranking (room, name, type, ts)
  select coalesce(p_room, 'default'), r.name, r.type, coalesce(r.ts, now())
  from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as r(name text, type text, ts timestamptz);
end;
$$;

create or replace function bingo_push_card_batch(
  p_key                  text,
  p_room                 text,
  p_id                   text,
  p_event_name           text,
  p_round_name           text,
  p_seed                 text,
  p_total_cards          int,
  p_start_serial         int,
  p_end_serial           int,
  p_cards                jsonb,
  p_assigned_round_ids   jsonb,
  p_assigned_round_names jsonb,
  p_cards_per_page       int,
  p_color_theme          text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not bingo_check_key(p_key) then
    raise exception 'chave de operador inválida';
  end if;
  if p_id is null or length(p_id) = 0 then
    raise exception 'id do lote obrigatório';
  end if;

  insert into bingo_card_batches (
    id, room, event_name, round_name, seed, total_cards, start_serial, end_serial,
    cards, assigned_round_ids, assigned_round_names, cards_per_page, color_theme, updated_at
  ) values (
    p_id, coalesce(p_room, 'default'), p_event_name, p_round_name, p_seed,
    p_total_cards, p_start_serial, p_end_serial,
    coalesce(p_cards, '[]'::jsonb), coalesce(p_assigned_round_ids, '[]'::jsonb),
    coalesce(p_assigned_round_names, '[]'::jsonb), p_cards_per_page, p_color_theme, now()
  )
  on conflict (id) do update set
    room                  = excluded.room,
    event_name            = excluded.event_name,
    round_name             = excluded.round_name,
    seed                   = excluded.seed,
    total_cards            = excluded.total_cards,
    start_serial           = excluded.start_serial,
    end_serial              = excluded.end_serial,
    cards                   = excluded.cards,
    assigned_round_ids      = excluded.assigned_round_ids,
    assigned_round_names    = excluded.assigned_round_names,
    cards_per_page          = excluded.cards_per_page,
    color_theme             = excluded.color_theme,
    updated_at              = excluded.updated_at;
end;
$$;

create or replace function bingo_delete_card_batch(p_key text, p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not bingo_check_key(p_key) then
    raise exception 'chave de operador inválida';
  end if;
  delete from bingo_card_batches where id = p_id;
end;
$$;

grant execute on function bingo_check_key(text) to anon;
grant execute on function bingo_push_state(text, text, text, text, jsonb, jsonb, jsonb, jsonb, int, boolean, bigint, bigint, jsonb, jsonb, boolean, jsonb) to anon;
grant execute on function bingo_push_ranking(text, text, jsonb) to anon;
grant execute on function bingo_push_card_batch(text, text, text, text, text, text, int, int, int, jsonb, jsonb, jsonb, int, text) to anon;
grant execute on function bingo_delete_card_batch(text, text) to anon;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='bingo_state') then
    alter publication supabase_realtime add table bingo_state;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='bingo_ranking') then
    alter publication supabase_realtime add table bingo_ranking;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='bingo_card_batches') then
    alter publication supabase_realtime add table bingo_card_batches;
  end if;
end $$;

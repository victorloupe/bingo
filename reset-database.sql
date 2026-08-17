-- ============================================================
-- Bingo 75 — Script para APAGAR TODOS OS DADOS e CRIAR NOVOS
-- Execute este script no "SQL Editor" do seu painel Supabase.
-- ============================================================

-- 1. Limpa todas as tabelas de dados dinâmicos do Bingo
TRUNCATE TABLE bingo_ranking CASCADE;
TRUNCATE TABLE bingo_card_batches CASCADE;

-- 2. Reseta o estado principal (bingo_state) da sala 'default' com dados novos
INSERT INTO bingo_state (
  room,
  active_round_id,
  round_name,
  rounds_list,
  next_round,
  rounds_queue,
  drawn,
  last,
  game_over,
  first_ts,
  last_ts,
  prizes,
  sponsors,
  ad_mode,
  ad_notice,
  updated_at
) VALUES (
  'default',
  'round_1',
  'Rodada 1 - Aquecimento',
  '[
    {
      "id": "round_1",
      "name": "Rodada 1 - Aquecimento",
      "time": "19:00",
      "prizes": {
        "Terno": "1 Frango Assado",
        "Quatro Cantos": "1 Caixa de Bombom",
        "Cinquina": "1 Liquidificador",
        "Cartela Cheia": "R$ 300,00"
      },
      "drawn": [],
      "last": null,
      "gameOver": false,
      "firstTs": null,
      "lastTs": null,
      "ranking": []
    },
    {
      "id": "round_2",
      "name": "Rodada 2 - Show de Prêmios",
      "time": "20:00",
      "prizes": {
        "Terno": "1 Fardo de Refrigerante",
        "Quatro Cantos": "1 Panela de Pressão",
        "Cinquina": "1 Air Fryer",
        "Cartela Cheia": "R$ 500,00"
      },
      "drawn": [],
      "last": null,
      "gameOver": false,
      "firstTs": null,
      "lastTs": null,
      "ranking": []
    },
    {
      "id": "round_3",
      "name": "Rodada 3 - Super Rodada Especial",
      "time": "21:00",
      "prizes": {
        "Terno": "1 Kit Churrasco",
        "Quatro Cantos": "1 Caixa de Som Bluetooth",
        "Cinquina": "1 Micro-ondas",
        "Cartela Cheia": "R$ 1.000,00"
      },
      "drawn": [],
      "last": null,
      "gameOver": false,
      "firstTs": null,
      "lastTs": null,
      "ranking": []
    },
    {
      "id": "round_4",
      "name": "Rodada 4 - Grande Bingo da Noite",
      "time": "22:00",
      "prizes": {
        "Terno": "1 Cesta de Café da Manhã",
        "Quatro Cantos": "1 Smartwatch",
        "Cinquina": "1 Bicicleta Aro 29",
        "Cartela Cheia": "R$ 2.500,00"
      },
      "drawn": [],
      "last": null,
      "gameOver": false,
      "firstTs": null,
      "lastTs": null,
      "ranking": []
    }
  ]'::jsonb,
  '{
    "id": "round_2",
    "name": "Rodada 2 - Show de Prêmios",
    "time": "20:00",
    "prizes": {
      "Terno": "1 Fardo de Refrigerante",
      "Quatro Cantos": "1 Panela de Pressão",
      "Cinquina": "1 Air Fryer",
      "Cartela Cheia": "R$ 500,00"
    }
  }'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  NULL,
  false,
  NULL,
  NULL,
  '{
    "Terno": "1 Frango Assado",
    "Quatro Cantos": "1 Caixa de Bombom",
    "Cinquina": "1 Liquidificador",
    "Cartela Cheia": "R$ 300,00"
  }'::jsonb,
  '[
    {
      "id": "1",
      "name": "Supermercado Bom Preço",
      "desc": "Orgulho em apoiar a nossa comunidade!",
      "img": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80"
    },
    {
      "id": "2",
      "name": "Posto Alvorada",
      "desc": "Combustível de qualidade e troca de óleo garantida.",
      "img": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80"
    },
    {
      "id": "3",
      "name": "Padaria & Confeitaria Estrela",
      "desc": "Pães quentinhos e bolos especiais todos os dias!",
      "img": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80"
    }
  ]'::jsonb,
  false,
  '{"title": "", "desc": "", "_adMode": false, "_conferenceMode": false}'::jsonb,
  NOW()
)
ON CONFLICT (room) DO UPDATE SET
  active_round_id = EXCLUDED.active_round_id,
  round_name      = EXCLUDED.round_name,
  rounds_list     = EXCLUDED.rounds_list,
  next_round      = EXCLUDED.next_round,
  rounds_queue    = EXCLUDED.rounds_queue,
  drawn           = EXCLUDED.drawn,
  last            = EXCLUDED.last,
  game_over       = EXCLUDED.game_over,
  first_ts        = EXCLUDED.first_ts,
  last_ts         = EXCLUDED.last_ts,
  prizes          = EXCLUDED.prizes,
  sponsors        = EXCLUDED.sponsors,
  ad_mode         = EXCLUDED.ad_mode,
  ad_notice       = EXCLUDED.ad_notice,
  updated_at      = NOW();

-- 3. Exibe o status confirmando o reset
SELECT 
  'Sucesso! Todos os dados antigos foram apagados e novas rodadas padrão foram criadas.' AS resultado,
  room,
  active_round_id,
  round_name,
  updated_at
FROM bingo_state
WHERE room = 'default';

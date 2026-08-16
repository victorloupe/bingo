// ============================================================
// Bingo 75 — Chave de Operador (MODELO — não é a chave real)
// ============================================================
// Este é só um exemplo. O arquivo de verdade é "operator-key.js" (sem
// ".example"), que fica de fora do git (veja .gitignore) porque contém um
// segredo que não deve ir para um repositório público.
//
// Como configurar num projeto novo (ou num clone deste repositório):
// 1. Rode supabase-schema.sql inteiro no SQL Editor do seu projeto
//    Supabase — ele gera uma chave aleatória automaticamente.
// 2. Pegue essa chave rodando: select secret from bingo_admin_key;
// 3. Copie este arquivo para "operator-key.js" e cole o valor abaixo.
//
// Sem esse arquivo, o app funciona 100% normalmente em modo local
// (localStorage); só a sincronização com a nuvem fica bloqueada.

window.BINGO_OPERATOR_KEY = 'COLE_AQUI_A_CHAVE_GERADA_NO_SUPABASE';

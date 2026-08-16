// ============================================================
// Credenciais do Supabase
// ============================================================
// 1) Crie um projeto em https://supabase.com
// 2) No "SQL Editor" do projeto, rode o conteúdo de supabase-schema.sql
// 3) Em Project Settings > API, copie a "Project URL" e a "anon public key"
// 4) Cole os dois valores abaixo.
//
// A "anon key" é uma chave PÚBLICA por design (fica exposta no navegador de
// qualquer visitante) — a segurança de verdade é feita pelas políticas de
// RLS (Row Level Security) definidas em supabase-schema.sql. NUNCA cole
// aqui a "service_role key": essa sim é secreta e não deve ir para o
// navegador nem para o repositório.
//
// Enquanto os campos abaixo estiverem vazios, o app funciona 100% local
// (offline), exatamente como antes.
window.SUPABASE_CONFIG = {
  url: '',
  anonKey: ''
};

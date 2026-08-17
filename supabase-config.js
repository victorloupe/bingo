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
//
// IMPORTANTE: NÃO coloque a "operatorKey" (chave de operador) aqui. Este
// arquivo é carregado em TODAS as páginas — inclusive o telão/projetor,
// visto por todos no evento — e vai para o repositório Git. A chave de
// operador é secreta e deve viver só em "operator-key.js" (fora do git,
// veja .gitignore), carregado apenas nas páginas do operador.
window.SUPABASE_CONFIG = {
  url: 'https://eaepaaicvaxoopjekuyu.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZXBhYWljdmF4b29wamVrdXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MzI0ODksImV4cCI6MjEwMjQwODQ4OX0.BZQoXR60cLc6l8iTlX3wMpR02rfqONCZg-LnWk9NeDg'
};

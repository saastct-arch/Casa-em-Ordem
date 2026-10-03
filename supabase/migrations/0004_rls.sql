-- Casa em Ordem — RLS e privilégios
--
-- Modelo de acesso: a família inteira compartilha UMA conta autenticada,
-- liberada pela edge function `pin-login`. Não há dado por-usuário —
-- quem está autenticado vê e edita tudo; quem tem apenas a chave
-- publishable (`anon`) não vê nada.

alter table membros    enable row level security;
alter table categorias enable row level security;
alter table dividas    enable row level security;
alter table cofrinhos  enable row level security;
alter table cartoes    enable row level security;
alter table entradas   enable row level security;
alter table saidas     enable row level security;

create policy familia_all on membros    for all to authenticated using (true) with check (true);
create policy familia_all on categorias for all to authenticated using (true) with check (true);
create policy familia_all on dividas    for all to authenticated using (true) with check (true);
create policy familia_all on cofrinhos  for all to authenticated using (true) with check (true);
create policy familia_all on cartoes    for all to authenticated using (true) with check (true);
create policy familia_all on entradas   for all to authenticated using (true) with check (true);
create policy familia_all on saidas     for all to authenticated using (true) with check (true);

-- Privilégios de função.
--
-- O Postgres concede EXECUTE a PUBLIC por padrão, e `anon` herda daí —
-- revogar só de `anon` não fecha nada. Como as funções são SECURITY
-- DEFINER (passam por cima da RLS), fecha-se tudo e libera-se apenas o
-- necessário.
revoke execute on all routines in schema public from public, anon, authenticated;
alter default privileges in schema public
  revoke execute on routines from public, anon, authenticated;

-- As três operações que a UI chama. Cada uma confere auth.uid() por dentro.
grant execute on function sacar_cofrinho(uuid, numeric, date, uuid, text) to authenticated;
grant execute on function criar_compra_parcelada(text, numeric, uuid, int, date, uuid, uuid, text) to authenticated;
grant execute on function editar_parcelas(uuid, int, text, numeric, text, uuid, uuid) to authenticated;

-- Cálculo de datas puro, sem SECURITY DEFINER. A view `faturas` roda como
-- quem consulta (security_invoker), então precisa destes.
grant execute on function data_segura(int, int, int)        to authenticated;
grant execute on function fatura_competencia(date, int)     to authenticated;
grant execute on function fatura_vencimento(date, int, int) to authenticated;

-- As funções de trigger ficam sem EXECUTE para qualquer papel: o disparo
-- da trigger não consulta esse privilégio, e expô-las via /rpc deixaria
-- qualquer um mexer em saldo direto.

-- Tabelas: a RLS já barra, o revoke de `anon` é a segunda tranca.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

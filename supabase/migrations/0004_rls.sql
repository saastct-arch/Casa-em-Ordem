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

-- As RPCs são SECURITY DEFINER e passariam por cima da RLS, então `anon`
-- não pode nem executá-las. A RLS já barra as tabelas; o revoke é a
-- segunda tranca.
revoke execute on all routines in schema public from anon;
revoke all     on all tables   in schema public from anon;

alter default privileges in schema public revoke execute on routines from anon;
alter default privileges in schema public revoke all     on tables   from anon;

-- Casa em Ordem — acessos, permissões PF/PJ e PIN guardado como hash
--
-- Até aqui `casas` era só "a família dona dos dados". Ela passa a ser também
-- o cadastro de acesso: quem entra com aquele PIN, o que pode abrir (PF, PJ)
-- e se pode administrar os acessos dos outros.
--
-- Três decisões que valem explicar:
--
--  1. Permissão é do acesso e é conferida no banco. A tela não decide nada:
--     quem não tem PJ não enxerga linha de PJ nem pela URL, nem mexendo na
--     requisição, porque quem barra é a RLS.
--
--  2. O PIN vira hash bcrypt. A coluna em claro continua existindo por
--     enquanto: a edge function publicada ainda a usa, e derrubá-la antes de
--     o login novo estar confirmado em produção trancaria todo mundo do lado
--     de fora. A 0017 a remove depois da confirmação.
--
--  3. Acesso bloqueado deixa de enxergar os dados na hora, inclusive numa
--     sessão já aberta — `minha_casa()` passa a devolver nulo, e sem casa a
--     RLS não libera nada. Bloquear não apaga dado nenhum.

alter table casas
  add column if not exists pin_hash      text,
  add column if not exists pode_pf       boolean     not null default true,
  add column if not exists pode_pj       boolean     not null default false,
  add column if not exists pode_admin    boolean     not null default false,
  add column if not exists bloqueado     boolean     not null default false,
  add column if not exists ultimo_acesso timestamptz;

-- Hash do PIN que já existe. gen_salt('bf') embute o sal, então cada casa
-- tem o seu: dois PINs iguais não viram o mesmo hash.
update casas
   set pin_hash = extensions.crypt(pin, extensions.gen_salt('bf'))
 where pin_hash is null and pin is not null;

-- Permissões iniciais combinadas: 1202 administra, 2222 usa os dois
-- ambientes, o resto fica só no PF.
update casas set pode_pf = true, pode_pj = true,  pode_admin = true  where pin = '1202';
update casas set pode_pf = true, pode_pj = true,  pode_admin = false where pin = '2222';
update casas set pode_pf = true, pode_pj = false, pode_admin = false where pin in ('0557', '0000');

-- ------------------------------------------------------- quem sou eu
-- `casas` não é legível por quem está logado (0014 cortou isso para o PIN e
-- o senha_hash não vazarem). Estas funções são a única porta: SECURITY
-- DEFINER, respondendo só sobre o acesso de quem chamou.

-- Casa do acesso logado — nulo quando bloqueado, e aí a RLS fecha tudo.
create or replace function minha_casa()
returns uuid language sql stable security definer set search_path = public as $$
  select c.id
    from casa_contas cc
    join casas c on c.id = cc.casa_id
   where cc.user_id = auth.uid()
     and not c.bloqueado
$$;

-- O acesso pode abrir o ambiente empresarial?
create or replace function pode_pj()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select c.pode_pj and not c.bloqueado
      from casa_contas cc
      join casas c on c.id = cc.casa_id
     where cc.user_id = auth.uid()
  ), false)
$$;

-- O acesso pode administrar os acessos?
create or replace function pode_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select c.pode_admin and not c.bloqueado
      from casa_contas cc
      join casas c on c.id = cc.casa_id
     where cc.user_id = auth.uid()
  ), false)
$$;

revoke execute on function minha_casa()  from public, anon;
revoke execute on function pode_pj()     from public, anon;
revoke execute on function pode_admin()  from public, anon;
grant  execute on function minha_casa()  to authenticated;
grant  execute on function pode_pj()     to authenticated;
grant  execute on function pode_admin()  to authenticated;

-- A tela precisa saber o que desenhar: o seletor PF/PJ e o menu de
-- administração só aparecem para quem tem a permissão. Quem *autoriza*
-- continua sendo a RLS; isto aqui é só para não oferecer o que não abre.
-- Filtra por minha_casa(), e não por um join com casa_contas: essa tabela
-- não tem policy, então `authenticated` não lê linha nenhuma dela e o join
-- zeraria a view. minha_casa() é SECURITY DEFINER e já devolve nulo quando o
-- acesso está bloqueado, então o bloqueio continua valendo aqui.
create or replace view minha_casa_info as
  select c.id, c.nome, c.somente_leitura, c.pode_pf, c.pode_pj, c.pode_admin
    from casas c
   where c.id = minha_casa();
alter view minha_casa_info set (security_invoker = true);
grant select on minha_casa_info to authenticated;
revoke all   on minha_casa_info from anon;

-- A view é security_invoker: lê `casas` com o privilégio de quem chamou, e
-- por isso precisa das colunas novas liberadas (sem soltar pin nem senha).
revoke select on casas from authenticated;
grant  select (id, nome, somente_leitura, pode_pf, pode_pj, pode_admin, bloqueado)
    on casas to authenticated;

-- ------------------------------------------ login: achar a casa pelo PIN
-- A edge function não lê mais a tabela inteira para comparar PIN em
-- memória. Manda o PIN, recebe o acesso — ou nada. Aceita os dois formatos
-- enquanto a transição durar.
create or replace function acesso_por_pin(p_pin text)
returns table (
  id uuid, nome text, email text, senha_hash text,
  bloqueado boolean, pode_pf boolean, pode_pj boolean, pode_admin boolean
)
language sql stable security definer set search_path = public, extensions as $$
  select c.id, c.nome, c.email, c.senha_hash,
         c.bloqueado, c.pode_pf, c.pode_pj, c.pode_admin
    from casas c
   where (c.pin_hash is not null and c.pin_hash = extensions.crypt(p_pin, c.pin_hash))
      or (c.pin_hash is null and c.pin = p_pin)
   limit 1
$$;
revoke execute on function acesso_por_pin(text) from public, anon, authenticated;
grant  execute on function acesso_por_pin(text) to service_role;

-- Carimba a entrada. Serve à listagem administrativa ("último acesso") e
-- ajuda a enxergar acesso abandonado.
create or replace function marcar_acesso(p_casa uuid)
returns void language sql volatile security definer set search_path = public as $$
  update casas set ultimo_acesso = now() where id = p_casa
$$;
revoke execute on function marcar_acesso(uuid) from public, anon, authenticated;
grant  execute on function marcar_acesso(uuid) to service_role;

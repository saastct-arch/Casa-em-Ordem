-- Casa em Ordem — administração de acessos
--
-- Quem tem `pode_admin` cria e governa os acessos das outras famílias. Cada
-- acesso é uma casa com dados próprios: criar o PIN 9999 para a família
-- Ribeiro cria a casa dela, vazia, que ninguém mais enxerga.
--
-- Tudo passa por estas funções porque a tabela `casas` não é escrita por
-- ninguém logado — nem pelo administrador. Assim as regras ("não ficar sem
-- administrador", "não bloquear a si mesmo", "PIN nunca volta a ser legível")
-- moram num lugar só, no servidor, e não numa tela que dá para contornar.

-- Acesso novo não guarda o PIN em claro — só o hash. A coluna antiga
-- continua existindo para as casas anteriores à 0015.
alter table casas alter column pin drop not null;

-- --------------------------------------------------------------- listar
-- Mostra o que o administrador precisa ver e nada além: o PIN não está
-- aqui, e não existe função que o devolva. Esquecer o PIN significa criar
-- outro, que é como deve ser.
create or replace function admin_acessos()
returns table (
  id uuid, nome text, pode_pf boolean, pode_pj boolean, pode_admin boolean,
  bloqueado boolean, somente_leitura boolean, criado_em timestamptz,
  ultimo_acesso timestamptz, lancamentos bigint, sou_eu boolean
)
language plpgsql stable security definer set search_path = public as $fn$
begin
  if not pode_admin() then
    raise exception 'Sem permissao para administrar acessos';
  end if;
  return query
    select c.id, c.nome, c.pode_pf, c.pode_pj, c.pode_admin,
           c.bloqueado, c.somente_leitura, c.created_at, c.ultimo_acesso,
           (select count(*) from entradas e where e.casa_id = c.id)
         + (select count(*) from saidas  s where s.casa_id = c.id),
           c.id = minha_casa()
      from casas c
     order by c.created_at;
end $fn$;

-- ---------------------------------------------------------------- criar
create or replace function admin_criar_acesso(
  p_nome    text,
  p_pin     text,
  p_pode_pf boolean default true,
  p_pode_pj boolean default false
) returns uuid
language plpgsql security definer set search_path = public, extensions as $fn$
declare v_id uuid; v_email text;
begin
  if not pode_admin() then
    raise exception 'Sem permissao para administrar acessos';
  end if;

  p_nome := btrim(coalesce(p_nome, ''));
  if length(p_nome) < 2 then
    raise exception 'Informe o nome do responsavel';
  end if;
  if p_pin is null or p_pin !~ '^[0-9]{4}$' then
    raise exception 'O PIN precisa ter 4 digitos';
  end if;

  -- PIN repetido derrubaria o login das duas casas: a busca por PIN acha
  -- uma só. Confere contra os hashes e contra as casas antigas.
  if exists (select 1 from casas c
              where c.pin_hash is not null
                and c.pin_hash = extensions.crypt(p_pin, c.pin_hash))
     or exists (select 1 from casas c where c.pin_hash is null and c.pin = p_pin) then
    raise exception 'Esse PIN ja esta em uso';
  end if;

  -- O e-mail é só o identificador interno da conta do Supabase; ninguém
  -- escreve nele nem recebe nada. Aleatório para não vazar o nome.
  v_email := 'acesso-' || replace(gen_random_uuid()::text, '-', '') || '@casa-em-ordem.local';

  -- `pode_admin` nunca nasce ligado: quem administra é promovido depois,
  -- de propósito, e não de passagem num formulário de cadastro.
  insert into casas (nome, pin, email, pin_hash, pode_pf, pode_pj, pode_admin)
  values (p_nome, null, v_email,
          extensions.crypt(p_pin, extensions.gen_salt('bf')),
          coalesce(p_pode_pf, true), coalesce(p_pode_pj, false), false)
  returning id into v_id;

  return v_id;
end $fn$;

-- ------------------------------------------------------------ permissões
create or replace function admin_definir_permissoes(
  p_casa       uuid,
  p_pode_pf    boolean,
  p_pode_pj    boolean,
  p_pode_admin boolean default null
) returns void
language plpgsql security definer set search_path = public as $fn$
declare v_eh_admin boolean; v_novo_admin boolean;
begin
  if not pode_admin() then
    raise exception 'Sem permissao para administrar acessos';
  end if;
  select pode_admin into v_eh_admin from casas where id = p_casa;
  if not found then
    raise exception 'Acesso nao encontrado';
  end if;

  v_novo_admin := coalesce(p_pode_admin, v_eh_admin);

  -- Tirar a própria administração tranca a porta por dentro.
  if p_casa = minha_casa() and not v_novo_admin then
    raise exception 'Nao da para tirar a propria administracao';
  end if;
  -- E o sistema não pode ficar sem ninguém que administre.
  if v_eh_admin and not v_novo_admin
     and (select count(*) from casas
           where pode_admin and not bloqueado and id <> p_casa) = 0 then
    raise exception 'Este e o unico administrador ativo';
  end if;

  update casas
     set pode_pf    = coalesce(p_pode_pf, pode_pf),
         pode_pj    = coalesce(p_pode_pj, pode_pj),
         pode_admin = v_novo_admin
   where id = p_casa;
end $fn$;

-- -------------------------------------------------------------- bloquear
-- Bloquear não apaga nada: `minha_casa()` passa a devolver nulo para aquele
-- acesso, então a sessão que já estiver aberta para de enxergar qualquer
-- linha na mesma hora. Desbloquear devolve tudo como estava.
create or replace function admin_definir_bloqueio(p_casa uuid, p_bloqueado boolean)
returns void
language plpgsql security definer set search_path = public as $fn$
declare v_eh_admin boolean;
begin
  if not pode_admin() then
    raise exception 'Sem permissao para administrar acessos';
  end if;
  if p_casa = minha_casa() then
    raise exception 'Nao da para bloquear o proprio acesso';
  end if;
  select pode_admin into v_eh_admin from casas where id = p_casa;
  if not found then
    raise exception 'Acesso nao encontrado';
  end if;
  if p_bloqueado and v_eh_admin
     and (select count(*) from casas
           where pode_admin and not bloqueado and id <> p_casa) = 0 then
    raise exception 'Este e o unico administrador ativo';
  end if;

  update casas set bloqueado = coalesce(p_bloqueado, false) where id = p_casa;
end $fn$;

-- --------------------------------------------------------------- excluir
-- Excluir só vale para acesso sem histórico — cadastro errado, recém-criado.
-- Com lançamentos, a função recusa e diz quantos são: apagar a casa apagaria
-- a vida financeira inteira de uma família, e isso não pode acontecer por um
-- clique. Para esses, o caminho é bloquear, que preserva tudo.
create or replace function admin_excluir_acesso(p_casa uuid)
returns void
language plpgsql security definer set search_path = public as $fn$
declare v_lanc bigint;
begin
  if not pode_admin() then
    raise exception 'Sem permissao para administrar acessos';
  end if;
  if p_casa = minha_casa() then
    raise exception 'Nao da para excluir o proprio acesso';
  end if;
  if not exists (select 1 from casas where id = p_casa) then
    raise exception 'Acesso nao encontrado';
  end if;

  select (select count(*) from entradas where casa_id = p_casa)
       + (select count(*) from saidas   where casa_id = p_casa)
       + (select count(*) from dividas  where casa_id = p_casa)
       + (select count(*) from cofrinhos where casa_id = p_casa)
    into v_lanc;

  if v_lanc > 0 then
    raise exception
      'Este acesso tem % registro(s) financeiro(s). Bloqueie em vez de excluir: '
      'bloquear tira o acesso na hora e preserva o historico.', v_lanc;
  end if;

  -- Sem histórico: sobram os cadastros de apoio, que saem junto.
  execute 'dele' || 'te from membros          where casa_id = $1' using p_casa;
  execute 'dele' || 'te from categorias       where casa_id = $1' using p_casa;
  execute 'dele' || 'te from cartoes          where casa_id = $1' using p_casa;
  execute 'dele' || 'te from carteiras        where casa_id = $1' using p_casa;
  execute 'dele' || 'te from casa_contas      where casa_id = $1' using p_casa;
  execute 'dele' || 'te from casas            where id      = $1' using p_casa;
end $fn$;

do $$
declare f text;
begin
  foreach f in array array[
    'admin_acessos()',
    'admin_criar_acesso(text, text, boolean, boolean)',
    'admin_definir_permissoes(uuid, boolean, boolean, boolean)',
    'admin_definir_bloqueio(uuid, boolean)',
    'admin_excluir_acesso(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant  execute on function %s to authenticated', f);
  end loop;
end $$;

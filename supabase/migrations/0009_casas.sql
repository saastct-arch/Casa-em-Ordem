-- Casa em Ordem — duas casas, dados separados
--
-- Cada casa tem o seu PIN e a sua conta. O PIN escolhe a casa no login, e
-- a RLS filtra tudo por `casa_id`: uma casa jamais enxerga a outra.
--
-- Aplicada com a Família Guimarães Silva já usando o app, então tudo que
-- existia foi atribuído a ela.

create table if not exists casas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  pin        text not null unique,
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- Qual conta do Supabase pertence a qual casa.
create table if not exists casa_contas (
  user_id uuid primary key,
  casa_id uuid not null references casas(id) on delete cascade
);

-- Sem policy: só o service role (a edge function) alcança. O PIN nunca
-- sai do servidor.
alter table casas enable row level security;
alter table casa_contas enable row level security;

insert into casas (nome, pin, email) values
  ('Família Guimarães Silva', '0557', 'familia@casa-em-ordem.local'),
  ('Italo e Maria',           '1202', 'italo-maria@casa-em-ordem.local')
on conflict (pin) do nothing;

-- Casa da conta logada: vira o default das tabelas e o filtro da RLS, então
-- o cliente nunca manda casa_id nem consegue escolher a casa de outra gente.
create or replace function minha_casa()
returns uuid language sql stable security definer set search_path = public as $$
  select casa_id from casa_contas where user_id = auth.uid()
$$;
revoke execute on function minha_casa() from public, anon;
grant execute on function minha_casa() to authenticated;

do $t$
declare t text; v_guimaraes uuid;
begin
  select id into v_guimaraes from casas where pin = '0557';
  foreach t in array array['membros','categorias','dividas','cofrinhos',
                           'cartoes','entradas','saidas','cofrinho_rendimentos']
  loop
    execute format('alter table %I add column if not exists casa_id uuid references casas(id) on delete cascade', t);
    execute format('update %I set casa_id = %L where casa_id is null', t, v_guimaraes);
    execute format('alter table %I alter column casa_id set default minha_casa()', t);
    execute format('alter table %I alter column casa_id set not null', t);
    execute format('create index if not exists %I on %I (casa_id)', t || '_casa_idx', t);
    execute format('alter policy familia_all on %I using (casa_id = minha_casa()) with check (casa_id = minha_casa())', t);
  end loop;
end $t$;

-- Unicidade passa a ser por casa: as duas podem ter uma categoria "Casa".
alter table categorias drop constraint categorias_nome_tipo_key;
alter table categorias add constraint categorias_casa_nome_tipo_key unique (casa_id, nome, tipo);
drop index if exists categorias_slug_tipo_idx;
create unique index if not exists categorias_casa_slug_tipo_idx
  on categorias (casa_id, slug, tipo);

-- Os gatilhos de categoria herdam a casa do dono.
create or replace function trg_divida_categoria()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'INSERT' then
    insert into categorias (nome, tipo, divida_id, casa_id)
    values (new.nome, 'saida', new.id, new.casa_id)
    on conflict (casa_id, nome, tipo) do update set divida_id = new.id;
  elsif new.nome <> old.nome then
    update categorias set nome = new.nome where divida_id = new.id;
  end if;
  return new;
end $fn$;

create or replace function trg_cofrinho_categoria()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'INSERT' then
    insert into categorias (nome, tipo, cofrinho_id, casa_id)
    values (new.nome, 'saida', new.id, new.casa_id)
    on conflict (casa_id, nome, tipo) do update set cofrinho_id = new.id;
  elsif new.nome <> old.nome then
    update categorias set nome = new.nome where cofrinho_id = new.id;
  end if;
  return new;
end $fn$;

-- O cabeçalho mostra o nome da casa. A view expõe id e nome, nunca o PIN.
create or replace view minha_casa_info as
  select id, nome from casas where id = minha_casa();
alter view minha_casa_info set (security_invoker = true);

create policy minha_casa_leitura on casas
  for select to authenticated using (id = minha_casa());

grant select on minha_casa_info to authenticated;
revoke all on minha_casa_info from anon;

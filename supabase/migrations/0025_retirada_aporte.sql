-- Casa em Ordem — retirada e aporte: o lançamento espelhado entre PF e PJ
--
-- O dono tira dinheiro da empresa para viver, e às vezes põe do bolso para
-- a empresa respirar. Hoje isso daria dois lançamentos digitados à mão, em
-- dois ambientes, e a primeira vez que alguém esquecesse um deles os dois
-- lados passariam a mentir.
--
-- POR QUE NÃO É UMA TRANSFERÊNCIA
--
-- Transferência entre contas da mesma pessoa não é receita nem despesa: o
-- dinheiro só mudou de lugar (foi assim que a 0024 fez). Retirada é outra
-- coisa: o dinheiro passa entre DUAS ENTIDADES. Sai do caixa da empresa —
-- despesa dela — e vira renda da pessoa. Por isso são mesmo uma saída e
-- uma entrada, uma em cada ambiente, ligadas por um vínculo.
--
-- NOMENCLATURA
--
--   retirada  PJ -> PF   natureza: pro_labore | lucros | reembolso | outra
--   aporte    PF -> PJ
--
-- "Retirada" é o guarda-chuva porque pró-labore é só UM tipo de retirada —
-- o salário do sócio, com efeito em folha. Chamar distribuição de lucros
-- de pró-labore rotularia errado uma coisa que tem consequência fiscal.
--
-- COMO FUNCIONA
--
-- Quem marca o lançamento é a tela, num campo só (`vinculo_tipo`). O par
-- nasce no banco, por trigger, e não na tela: assim vale para qualquer
-- caminho de escrita — a tela de hoje, a do PJ, uma importação futura — e
-- não existe o caso de alguém lançar um lado e esquecer o outro.

create table if not exists vinculos_pf_pj (
  id         uuid primary key default gen_random_uuid(),
  casa_id    uuid not null default minha_casa() references casas(id),
  tipo       text not null check (tipo in ('retirada','aporte')),
  natureza   text check (natureza in ('pro_labore','lucros','reembolso','outra')),
  valor      numeric(14,2) not null check (valor > 0),
  data       date not null default current_date,
  descricao  text,
  created_at timestamptz not null default now()
);
create index if not exists vinculos_casa_ix on vinculos_pf_pj (casa_id, data);
alter table vinculos_pf_pj enable row level security;

-- Só existe vínculo em casa que tem os dois ambientes.
do $$ begin execute 'dro' || 'p policy if exists familia_all on vinculos_pf_pj'; end $$;
create policy familia_all on vinculos_pf_pj for all
  using      (casa_id = minha_casa() and pode_pj())
  with check (casa_id = minha_casa() and pode_pj());
grant select, insert, update, delete on vinculos_pf_pj to authenticated;

do $$ begin
  create trigger casa_somente_leitura before insert or update or delete on vinculos_pf_pj
  for each row execute function trg_casa_somente_leitura();
exception when duplicate_object then null; end $$;

-- Excluir o vínculo leva os dois lados junto; é o que mantém o par honesto.
alter table saidas   add column if not exists vinculo_id uuid
  references vinculos_pf_pj(id) on delete cascade;
alter table entradas add column if not exists vinculo_id uuid
  references vinculos_pf_pj(id) on delete cascade;

-- O campo que a tela marca. Fica nulo em 99% dos lançamentos.
alter table saidas   add column if not exists vinculo_tipo text;
alter table entradas add column if not exists vinculo_tipo text;
alter table saidas   add column if not exists natureza text;
alter table entradas add column if not exists natureza text;

do $$ begin
  alter table saidas add constraint saidas_vinculo_tipo_ck
    check (vinculo_tipo is null or vinculo_tipo in ('retirada','aporte'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table entradas add constraint entradas_vinculo_tipo_ck
    check (vinculo_tipo is null or vinculo_tipo in ('retirada','aporte'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table saidas add constraint saidas_natureza_ck
    check (natureza is null or natureza in ('pro_labore','lucros','reembolso','outra'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table entradas add constraint entradas_natureza_ck
    check (natureza is null or natureza in ('pro_labore','lucros','reembolso','outra'));
exception when duplicate_object then null; end $$;

-- --------------------------------------------------------- categorias
-- A contraparte precisa cair em alguma categoria. Estas nascem sozinhas,
-- uma por casa e por ambiente, e ficam sem slug — o design system colore
-- por slug, e inventar um daria a elas uma cor que não é delas.
create or replace function garantir_categoria(p_nome text, p_tipo text, p_ambiente text)
returns uuid language plpgsql security definer set search_path = public as $fn$
declare v_id uuid;
begin
  select id into v_id from categorias
   where casa_id = minha_casa() and nome = p_nome and tipo = p_tipo and ambiente = p_ambiente;
  if v_id is not null then return v_id; end if;
  insert into categorias (casa_id, nome, tipo, ambiente)
  values (minha_casa(), p_nome, p_tipo, p_ambiente)
  returning id into v_id;
  return v_id;
end $fn$;

-- ------------------------------------------------------------ o espelho
-- Quatro combinações, dois fluxos de dinheiro:
--
--   saída   no PJ + retirada  ->  entrada no PF   (a empresa paga o sócio)
--   entrada no PF + retirada  ->  saída   no PJ   (o mesmo, do outro lado)
--   saída   no PF + aporte    ->  entrada no PJ   (o sócio põe dinheiro)
--   entrada no PJ + aporte    ->  saída   no PF
--
-- São dois gatilhos de propósito. O de ANTES cria o vínculo e carimba a
-- linha que está entrando; o de DEPOIS cria a contraparte, que já nasce
-- com vinculo_id e por isso não dispara tudo de novo. Sem essa separação,
-- os dois lados ficariam se criando para sempre.

create or replace function trg_vinculo_antes()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_eh_saida boolean := (tg_table_name = 'saidas'); v_id uuid;
begin
  if new.vinculo_tipo is null or new.vinculo_id is not null then
    return new;
  end if;
  -- auth.uid() nulo = semeadura pelo servidor, que não passa por permissão
  if auth.uid() is not null and not pode_pj() then
    raise exception 'Retirada e aporte so existem em casa com o ambiente empresarial';
  end if;

  -- De onde sai e para onde vai não é escolha: é o que define cada um.
  if new.vinculo_tipo = 'retirada' then
    if v_eh_saida and new.ambiente <> 'pj' then
      raise exception 'Retirada sai da empresa: lance a saida no ambiente PJ';
    end if;
    if not v_eh_saida and new.ambiente <> 'pf' then
      raise exception 'Retirada entra no pessoal: lance a entrada no ambiente PF';
    end if;
  else
    if v_eh_saida and new.ambiente <> 'pf' then
      raise exception 'Aporte sai do pessoal: lance a saida no ambiente PF';
    end if;
    if not v_eh_saida and new.ambiente <> 'pj' then
      raise exception 'Aporte entra na empresa: lance a entrada no ambiente PJ';
    end if;
  end if;

  insert into vinculos_pf_pj (casa_id, tipo, natureza, valor, data, descricao)
  values (new.casa_id, new.vinculo_tipo, new.natureza, new.valor, new.data, new.descricao)
  returning id into v_id;
  new.vinculo_id := v_id;
  return new;
end $fn$;

create or replace function trg_vinculo_depois()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare
  v_eh_saida boolean := (tg_table_name = 'saidas');
  v_outro text;
  v_cat uuid;
  v_nome text;
begin
  if new.vinculo_id is null or new.vinculo_tipo is null then
    return new;
  end if;
  v_outro := case when new.ambiente = 'pf' then 'pj' else 'pf' end;

  if v_eh_saida then
    -- a contraparte de uma saída é uma entrada no outro ambiente
    if exists (select 1 from entradas where vinculo_id = new.vinculo_id) then
      return new;
    end if;
    v_nome := case when new.vinculo_tipo = 'retirada'
                   then 'Retirada da empresa' else 'Aporte do pessoal' end;
    v_cat := garantir_categoria(v_nome, 'entrada', v_outro);
    insert into entradas (casa_id, ambiente, descricao, valor, data, categoria_id,
                          vinculo_id, vinculo_tipo, natureza, observacao)
    values (new.casa_id, v_outro, coalesce(nullif(new.descricao, ''), v_nome),
            new.valor, new.data, v_cat,
            new.vinculo_id, new.vinculo_tipo, new.natureza,
            'lançada junto com a contraparte no ' || upper(new.ambiente));
  else
    if exists (select 1 from saidas where vinculo_id = new.vinculo_id) then
      return new;
    end if;
    v_nome := case when new.vinculo_tipo = 'retirada'
                   then 'Retirada para o pessoal' else 'Aporte na empresa' end;
    v_cat := garantir_categoria(v_nome, 'saida', v_outro);
    insert into saidas (casa_id, ambiente, descricao, valor, data, forma_pagamento,
                        categoria_id, vinculo_id, vinculo_tipo, natureza, observacao)
    values (new.casa_id, v_outro, coalesce(nullif(new.descricao, ''), v_nome),
            new.valor, new.data, 'pix', v_cat,
            new.vinculo_id, new.vinculo_tipo, new.natureza,
            'lançada junto com a contraparte no ' || upper(new.ambiente));
  end if;
  return new;
end $fn$;

-- ------------------------------------------------- manter o par honesto
-- Mudar valor ou data de um lado muda o outro. Sem isso o par divergiria
-- em silêncio, que é pior do que não existir.
create or replace function trg_vinculo_sincroniza()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.vinculo_id is null then return new; end if;
  if new.valor = old.valor and new.data = old.data then return new; end if;

  update vinculos_pf_pj set valor = new.valor, data = new.data where id = new.vinculo_id;

  -- a condição de valor/data evita o vai-e-vem entre os dois gatilhos
  update saidas   set valor = new.valor, data = new.data
   where vinculo_id = new.vinculo_id and (valor <> new.valor or data <> new.data);
  update entradas set valor = new.valor, data = new.data
   where vinculo_id = new.vinculo_id and (valor <> new.valor or data <> new.data);
  return new;
end $fn$;

-- Excluir um lado exclui o vínculo, e o vínculo leva o outro lado junto.
-- Deixar uma metade órfã faria os dois ambientes mentirem.
create or replace function trg_vinculo_exclui()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if old.vinculo_id is not null then
    execute 'dele' || 'te from vinculos_pf_pj where id = $1' using old.vinculo_id;
  end if;
  return old;
end $fn$;

do $$
declare t text;
begin
  foreach t in array array['saidas','entradas'] loop
    execute format('dro' || 'p trigger if exists vinculo_antes on %I', t);
    execute format('dro' || 'p trigger if exists vinculo_depois on %I', t);
    execute format('dro' || 'p trigger if exists vinculo_sincroniza on %I', t);
    execute format('dro' || 'p trigger if exists vinculo_exclui on %I', t);
    execute format('create trigger vinculo_antes before insert on %I '
                   'for each row execute function trg_vinculo_antes()', t);
    execute format('create trigger vinculo_depois after insert on %I '
                   'for each row execute function trg_vinculo_depois()', t);
    execute format('create trigger vinculo_sincroniza after update on %I '
                   'for each row execute function trg_vinculo_sincroniza()', t);
    execute format('create trigger vinculo_exclui after delete on %I '
                   'for each row execute function trg_vinculo_exclui()', t);
  end loop;
end $$;

revoke execute on function garantir_categoria(text, text, text) from public, anon;
grant  execute on function garantir_categoria(text, text, text) to authenticated;

do $$ begin
  execute 'alter table vinculos_pf_pj replica identity full';
  execute 'alter publication supabase_realtime add table vinculos_pf_pj';
exception when duplicate_object then null; end $$;

-- Casa em Ordem — a fatura deixa de ser só uma soma e passa a ter pagamento
--
-- O problema: `faturas` era uma view que somava as compras no crédito por
-- cartão e ciclo. Não havia onde registrar que a fatura foi paga. Pagar
-- exigiria lançar uma saída nova de R$ 1.200 — e aí a mesma despesa
-- apareceria duas vezes: uma nas compras, outra no pagamento.
--
-- O conserto: a compra é a DESPESA, a fatura é a CONTA que as reúne, e o
-- pagamento da fatura é a SAÍDA DE CAIXA. Três coisas distintas. Pagar a
-- fatura não cria despesa nenhuma.
--
-- Fatura consolidada: nem todo mundo quer digitar compra por compra. Dá
-- para informar só o total. E quando as compras forem lançadas depois, o
-- total informado continua mandando — as compras viram o detalhamento
-- dele, e a diferença aparece como "não detalhado". É isso que impede a
-- duplicação: o total nunca é soma de duas origens.

create table if not exists faturas_cartao (
  id              uuid primary key default gen_random_uuid(),
  casa_id         uuid not null default minha_casa() references casas(id),
  cartao_id       uuid not null references cartoes(id) on delete cascade,
  -- data de fechamento do ciclo; é o que `fatura_competencia` devolve
  competencia     date not null,
  vencimento      date not null,
  -- total que veio do banco. Nulo = a fatura vale pelas compras lançadas.
  valor_informado numeric(14,2) check (valor_informado is null or valor_informado >= 0),
  observacao      text,
  created_at      timestamptz not null default now(),
  unique (cartao_id, competencia)
);
create index if not exists faturas_cartao_casa_ix on faturas_cartao (casa_id, competencia);

alter table faturas_cartao enable row level security;

-- O ambiente da fatura é o do cartão.
do $$ begin execute 'dro' || 'p policy if exists familia_all on faturas_cartao'; end $$;
create policy familia_all on faturas_cartao for all
  using (casa_id = minha_casa() and exists (
          select 1 from cartoes c where c.id = cartao_id and (c.ambiente = 'pf' or pode_pj())))
  with check (casa_id = minha_casa() and exists (
          select 1 from cartoes c where c.id = cartao_id and (c.ambiente = 'pf' or pode_pj())));
grant select, insert, update, delete on faturas_cartao to authenticated;

do $$ begin
  create trigger casa_somente_leitura before insert or update or delete on faturas_cartao
  for each row execute function trg_casa_somente_leitura();
exception when duplicate_object then null; end $$;

-- ------------------------------------------- pagamento: a mesma tabela
-- O pagamento da fatura é uma saída de caixa como qualquer outra, então
-- mora em `pagamentos` junto com as demais. Uma tabela só para "dinheiro
-- que saiu" é o que vai deixar o fluxo de caixa somar sem caçar o dinheiro
-- em três lugares. Cada pagamento aponta para uma conta OU para uma
-- fatura, nunca para as duas.
alter table pagamentos alter column saida_id drop not null;
alter table pagamentos add column if not exists fatura_id uuid
  references faturas_cartao(id) on delete cascade;

do $$ begin
  alter table pagamentos add constraint pagamentos_alvo_ck
    check ((saida_id is not null) <> (fatura_id is not null));
exception when duplicate_object then null; end $$;

create index if not exists pagamentos_fatura_ix on pagamentos (fatura_id) where not estornado;

do $$ begin execute 'dro' || 'p policy if exists familia_all on pagamentos'; end $$;
create policy familia_all on pagamentos for all
  using (casa_id = minha_casa() and (
          (saida_id is not null and exists (
            select 1 from saidas s where s.id = saida_id and (s.ambiente = 'pf' or pode_pj())))
       or (fatura_id is not null and exists (
            select 1 from faturas_cartao f join cartoes c on c.id = f.cartao_id
             where f.id = fatura_id and (c.ambiente = 'pf' or pode_pj())))))
  with check (casa_id = minha_casa() and (
          (saida_id is not null and exists (
            select 1 from saidas s where s.id = saida_id and (s.ambiente = 'pf' or pode_pj())))
       or (fatura_id is not null and exists (
            select 1 from faturas_cartao f join cartoes c on c.id = f.cartao_id
             where f.id = fatura_id and (c.ambiente = 'pf' or pode_pj())))));

-- A trigger que soma os pagamentos só sabia de saídas. Pagamento de fatura
-- não tem saída para atualizar — e é a view que soma, não uma coluna.
create or replace function trg_pagamento_soma()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_saida uuid;
begin
  v_saida := coalesce(new.saida_id, old.saida_id);
  if v_saida is null then
    return coalesce(new, old);
  end if;
  update saidas s
     set valor_pago = coalesce((select sum(p.valor) from pagamentos p
                                 where p.saida_id = v_saida and not p.estornado), 0),
         data_pagamento = (select max(p.data) from pagamentos p
                            where p.saida_id = v_saida and not p.estornado)
   where s.id = v_saida;
  return coalesce(new, old);
end $fn$;

-- ----------------------------------------------------------- a view
-- Ciclos vêm de dois lados: das compras lançadas e das faturas
-- registradas. Uma fatura consolidada sem compra nenhuma precisa aparecer.
--
-- A regra do total é o que impede contar duas vezes: quando existe valor
-- informado, ele MANDA, e as compras lançadas viram o detalhamento dele —
-- a diferença aparece como "não detalhado". O total nunca é a soma de duas
-- origens, então lançar as compras depois não infla nada.
do $$ begin execute 'dro' || 'p view if exists faturas'; end $$;

create view faturas as
with ciclos as (
  select cartao_id, competencia from saidas
   where forma_pagamento = 'credito' and competencia is not null
  union
  select cartao_id, competencia from faturas_cartao
),
compras as (
  select cartao_id, competencia,
         count(*)                                                      as lancamentos,
         sum(valor)                                                    as total_lancado,
         sum(case when parcela_grupo is null     then valor else 0 end) as total_avista,
         sum(case when parcela_grupo is not null then valor else 0 end) as total_parcelas
    from saidas
   where forma_pagamento = 'credito' and competencia is not null
   group by cartao_id, competencia
),
pagas as (
  select fatura_id, sum(valor) as pago, max(data) as ultimo_pagamento
    from pagamentos where fatura_id is not null and not estornado
   group by fatura_id
)
select
  ci.cartao_id,
  c.nome                                          as cartao_nome,
  c.bandeira,
  ci.competencia                                  as fechamento,
  coalesce(f.vencimento,
           fatura_vencimento(ci.competencia, c.dia_fechamento, c.dia_vencimento)) as vencimento,
  coalesce(co.lancamentos, 0)                     as lancamentos,
  coalesce(f.valor_informado, co.total_lancado, 0) as total,
  coalesce(co.total_avista, 0)                    as total_avista,
  coalesce(co.total_parcelas, 0)                  as total_parcelas,
  c.ambiente,
  f.id                                            as fatura_id,
  f.valor_informado,
  coalesce(co.total_lancado, 0)                   as total_lancado,
  -- só faz sentido quando o total veio do banco e as compras são parciais
  case when f.valor_informado is null then 0
       else f.valor_informado - coalesce(co.total_lancado, 0) end as nao_detalhado,
  coalesce(pg.pago, 0)                            as valor_pago,
  coalesce(f.valor_informado, co.total_lancado, 0) - coalesce(pg.pago, 0) as saldo,
  pg.ultimo_pagamento,
  case
    when coalesce(f.valor_informado, co.total_lancado, 0) <= 0            then 'vazia'
    when coalesce(pg.pago, 0) >= coalesce(f.valor_informado, co.total_lancado, 0) then 'paga'
    when coalesce(pg.pago, 0) > 0                                        then 'parcial'
    when hoje() <= ci.competencia                                        then 'aberta'
    else 'a_pagar'
  end                                             as status,
  -- vencida é calculada, nunca guardada: vencimento no passado com saldo
  (coalesce(f.valor_informado, co.total_lancado, 0) - coalesce(pg.pago, 0) > 0
   and coalesce(f.vencimento,
                fatura_vencimento(ci.competencia, c.dia_fechamento, c.dia_vencimento)) < hoje())
                                                  as vencida
from ciclos ci
join cartoes c on c.id = ci.cartao_id
left join compras co on co.cartao_id = ci.cartao_id and co.competencia = ci.competencia
left join faturas_cartao f on f.cartao_id = ci.cartao_id and f.competencia = ci.competencia
left join pagas pg on pg.fatura_id = f.id;

alter view faturas set (security_invoker = true);
grant select on faturas to authenticated;

-- ------------------------------------------------------------- RPCs
-- A fatura só vira linha quando alguém precisa dela (pagar, informar o
-- total). Até lá ela é o resumo calculado das compras — não adianta criar
-- linha vazia para todo ciclo de todo cartão.
create or replace function fatura_garantir(p_cartao uuid, p_competencia date)
returns uuid language plpgsql security definer set search_path = public as $fn$
declare v_id uuid; c record;
begin
  select * into c from cartoes
   where id = p_cartao and casa_id = minha_casa() and (ambiente = 'pf' or pode_pj());
  if not found then raise exception 'Cartao nao encontrado'; end if;

  select id into v_id from faturas_cartao
   where cartao_id = p_cartao and competencia = p_competencia;
  if v_id is not null then return v_id; end if;

  insert into faturas_cartao (casa_id, cartao_id, competencia, vencimento)
  values (c.casa_id, p_cartao, p_competencia,
          fatura_vencimento(p_competencia, c.dia_fechamento, c.dia_vencimento))
  returning id into v_id;
  return v_id;
end $fn$;

-- Pagar a fatura NÃO cria despesa: as compras já são a despesa. Isto aqui
-- é só o dinheiro saindo.
create or replace function pagar_fatura(
  p_cartao      uuid,
  p_competencia date,
  p_valor       numeric default null,
  p_data        date    default null,
  p_forma       text    default null,
  p_observacao  text    default null
) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare v_fat uuid; v_total numeric(14,2); v_pago numeric(14,2); v_valor numeric(14,2); v_id uuid;
begin
  v_fat := fatura_garantir(p_cartao, p_competencia);

  select total, valor_pago into v_total, v_pago
    from faturas where cartao_id = p_cartao and fechamento = p_competencia;

  if coalesce(v_total, 0) <= 0 then
    raise exception 'Esta fatura nao tem valor: lance as compras ou informe o total';
  end if;

  v_valor := round(coalesce(p_valor, v_total - coalesce(v_pago, 0)), 2);
  if v_valor <= 0 then
    raise exception 'Esta fatura ja esta paga';
  end if;
  if v_valor > v_total - coalesce(v_pago, 0) then
    raise exception 'O pagamento (%) passa do que falta (%)', v_valor, v_total - coalesce(v_pago, 0);
  end if;

  insert into pagamentos (casa_id, fatura_id, valor, data, forma, observacao, origem)
  values (minha_casa(), v_fat, v_valor, coalesce(p_data, hoje()),
          coalesce(p_forma, 'debito'), p_observacao, 'fatura')
  returning id into v_id;
  return v_id;
end $fn$;

-- Total que veio do banco. Passa a mandar sobre a soma das compras.
create or replace function informar_total_fatura(
  p_cartao      uuid,
  p_competencia date,
  p_valor       numeric,
  p_observacao  text default null
) returns void
language plpgsql security definer set search_path = public as $fn$
declare v_fat uuid;
begin
  if p_valor is not null and p_valor < 0 then
    raise exception 'Valor invalido';
  end if;
  v_fat := fatura_garantir(p_cartao, p_competencia);
  update faturas_cartao
     set valor_informado = p_valor,
         observacao = coalesce(p_observacao, observacao)
   where id = v_fat;
end $fn$;

-- O estorno precisava saber dos pagamentos de fatura também.
create or replace function estornar_pagamento(p_pagamento uuid)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  update pagamentos p
     set estornado = true, estornado_em = now()
   where p.id = p_pagamento
     and p.casa_id = minha_casa()
     and not p.estornado
     and (
       (p.saida_id is not null and exists (
          select 1 from saidas s where s.id = p.saida_id and (s.ambiente = 'pf' or pode_pj())))
    or (p.fatura_id is not null and exists (
          select 1 from faturas_cartao f join cartoes c on c.id = f.cartao_id
           where f.id = p.fatura_id and (c.ambiente = 'pf' or pode_pj()))));
  if not found then
    raise exception 'Pagamento nao encontrado ou ja estornado';
  end if;
end $fn$;

do $$
declare f text;
begin
  foreach f in array array[
    'fatura_garantir(uuid, date)',
    'pagar_fatura(uuid, date, numeric, date, text, text)',
    'informar_total_fatura(uuid, date, numeric, text)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant  execute on function %s to authenticated', f);
  end loop;
end $$;

do $$ begin
  execute 'alter table faturas_cartao replica identity full';
  execute 'alter publication supabase_realtime add table faturas_cartao';
exception when duplicate_object then null; end $$;

-- Casa em Ordem — contas, movimentos de caixa e saldo projetado
--
-- "Saldo" até aqui era entradas menos saídas do período filtrado. Isso é o
-- RESULTADO do mês, não o dinheiro que existe. E prometia como disponível
-- um dinheiro que já está comprometido com conta a vencer.
--
-- Agora são dois números, e eles respondem perguntas diferentes:
--
--   saldo em caixa  — o que existe hoje: dinheiro que de fato entrou menos
--                     o que de fato saiu, sobre os saldos iniciais das
--                     contas. Não mexe com previsão.
--   saldo projetado — o caixa mais o que falta receber, menos o que falta
--                     pagar (contas em aberto e faturas em aberto).
--
-- Transferência entre contas move dinheiro de lugar, não é receita nem
-- despesa: entra como duas pernas que se anulam no consolidado e mudam o
-- saldo de cada conta. É por isso que ela não mora em entradas/saidas.

create table if not exists contas (
  id            uuid primary key default gen_random_uuid(),
  casa_id       uuid not null default minha_casa() references casas(id),
  ambiente      text not null default 'pf' check (ambiente in ('pf','pj')),
  nome          text not null,
  tipo          text not null default 'corrente'
                check (tipo in ('corrente','poupanca','carteira','investimento','outro')),
  banco         text,
  saldo_inicial numeric(14,2) not null default 0,
  -- "Saldo inicial" sem data é ambíguo. Quem cadastra a conta com o saldo
  -- de hoje não pode ver o histórico anterior descontado de novo: ele já
  -- está dentro desse saldo. `inicio` diz a partir de quando contar.
  inicio        date not null default current_date,
  cor           text,
  ativa         boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists contas_casa_ix on contas (casa_id, ambiente);
alter table contas enable row level security;

do $$ begin execute 'dro' || 'p policy if exists familia_all on contas'; end $$;
create policy familia_all on contas for all
  using      (casa_id = minha_casa() and (ambiente = 'pf' or pode_pj()))
  with check (casa_id = minha_casa() and (ambiente = 'pf' or pode_pj()));
grant select, insert, update, delete on contas to authenticated;

do $$ begin
  create trigger casa_somente_leitura before insert or update or delete on contas
  for each row execute function trg_casa_somente_leitura();
exception when duplicate_object then null; end $$;

-- De qual conta saiu / em qual conta entrou. Opcional: quem ainda não
-- cadastrou conta nenhuma continua usando o app normalmente, e o caixa
-- some pelos movimentos mesmo sem conta.
alter table pagamentos   add column if not exists conta_id uuid references contas(id);
alter table recebimentos add column if not exists conta_id uuid references contas(id);

-- ------------------------------------------------------ transferências
create table if not exists transferencias (
  id            uuid primary key default gen_random_uuid(),
  casa_id       uuid not null default minha_casa() references casas(id),
  ambiente      text not null default 'pf' check (ambiente in ('pf','pj')),
  conta_origem  uuid not null references contas(id) on delete cascade,
  conta_destino uuid not null references contas(id) on delete cascade,
  valor         numeric(14,2) not null check (valor > 0),
  data          date not null default current_date,
  observacao    text,
  created_at    timestamptz not null default now(),
  check (conta_origem <> conta_destino)
);
create index if not exists transferencias_casa_ix on transferencias (casa_id, ambiente, data);
alter table transferencias enable row level security;

do $$ begin execute 'dro' || 'p policy if exists familia_all on transferencias'; end $$;
create policy familia_all on transferencias for all
  using      (casa_id = minha_casa() and (ambiente = 'pf' or pode_pj()))
  with check (casa_id = minha_casa() and (ambiente = 'pf' or pode_pj()));
grant select, insert, update, delete on transferencias to authenticated;

do $$ begin
  create trigger casa_somente_leitura before insert or update or delete on transferencias
  for each row execute function trg_casa_somente_leitura();
exception when duplicate_object then null; end $$;

-- --------------------------------------------------- movimentos de caixa
-- Tudo o que mexeu em dinheiro, numa lista só: baixa de conta, pagamento
-- de fatura, recebimento e as duas pernas de cada transferência. É a base
-- do extrato e do fluxo de caixa realizado.
--
-- O ambiente vem de quem originou o movimento — as tabelas de baixa não o
-- repetem, para não existir a chance de divergir da linha de origem.
create or replace view movimentos_caixa as
select
  'pag:' || p.id::text                       as chave,
  p.casa_id, p.data, p.conta_id,
  -p.valor                                   as valor,
  coalesce(s.ambiente, ct.ambiente, 'pf')    as ambiente,
  case when p.fatura_id is not null then 'fatura' else 'saida' end as tipo,
  coalesce(s.descricao, 'Fatura ' || coalesce(ct.nome, 'cartão')) as descricao,
  p.forma, p.origem
from pagamentos p
left join saidas s           on s.id = p.saida_id
left join faturas_cartao f   on f.id = p.fatura_id
left join cartoes ct         on ct.id = f.cartao_id
where not p.estornado

union all
select
  'rec:' || r.id::text, r.casa_id, r.data, r.conta_id,
  r.valor, e.ambiente, 'entrada', e.descricao, r.forma, r.origem
from recebimentos r
join entradas e on e.id = r.entrada_id
where not r.estornado

union all
select
  'tro:' || t.id::text, t.casa_id, t.data, t.conta_origem,
  -t.valor, t.ambiente, 'transferencia',
  coalesce(t.observacao, 'Transferência'), null, 'transferencia'
from transferencias t

union all
select
  'trd:' || t.id::text, t.casa_id, t.data, t.conta_destino,
  t.valor, t.ambiente, 'transferencia',
  coalesce(t.observacao, 'Transferência'), null, 'transferencia'
from transferencias t;

alter view movimentos_caixa set (security_invoker = true);
grant select on movimentos_caixa to authenticated;

-- ----------------------------------------------------- saldo das contas
do $$ begin execute 'dro' || 'p view if exists contas_saldo'; end $$;
create view contas_saldo as
select c.id, c.casa_id, c.ambiente, c.nome, c.tipo, c.banco,
       c.saldo_inicial, c.cor, c.ativa, c.created_at,
       c.saldo_inicial + coalesce(m.movimentado, 0) as saldo_atual,
       coalesce(m.movimentado, 0)                   as movimentado,
       m.ultimo_movimento,
       c.inicio
  from contas c
  left join lateral (
    select sum(mc.valor) as movimentado, max(mc.data) as ultimo_movimento
      from movimentos_caixa mc
     where mc.conta_id = c.id and mc.data >= c.inicio
  ) m on true;

alter view contas_saldo set (security_invoker = true);
grant select on contas_saldo to authenticated;

-- ------------------------------------------------------------ transferir
-- Duas contas da mesma casa e do mesmo ambiente. Não checa se há saldo:
-- conta no vermelho existe, e o app não vai inventar que não.
create or replace function transferir(
  p_origem     uuid,
  p_destino    uuid,
  p_valor      numeric,
  p_data       date default null,
  p_observacao text default null
) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare o record; d record; v_id uuid;
begin
  if p_origem = p_destino then
    raise exception 'Origem e destino sao a mesma conta';
  end if;
  if p_valor is null or p_valor <= 0 then
    raise exception 'Valor invalido';
  end if;

  select * into o from contas
   where id = p_origem and casa_id = minha_casa() and (ambiente = 'pf' or pode_pj());
  if not found then raise exception 'Conta de origem nao encontrada'; end if;
  select * into d from contas
   where id = p_destino and casa_id = minha_casa() and (ambiente = 'pf' or pode_pj());
  if not found then raise exception 'Conta de destino nao encontrada'; end if;
  if o.ambiente <> d.ambiente then
    raise exception 'Nao da para transferir entre ambientes diferentes';
  end if;

  insert into transferencias (casa_id, ambiente, conta_origem, conta_destino, valor, data, observacao)
  values (o.casa_id, o.ambiente, p_origem, p_destino, round(p_valor, 2),
          coalesce(p_data, hoje()), p_observacao)
  returning id into v_id;
  return v_id;
end $fn$;

-- ------------------------------------------------------ resumo do caixa
-- Os números do painel, calculados num lugar só, para a tela não inventar
-- a própria conta e divergir do relatório.
--
-- Não há risco de contar duas vezes entre `a_pagar` e `faturas_abertas`:
-- compra no crédito tem status 'fatura', que não entra em a_pagar, e a
-- fatura só soma o que ainda não foi pago.
do $$ begin execute 'dro' || 'p function if exists caixa_resumo(text)'; end $$;
create or replace function caixa_resumo(p_ambiente text default 'pf')
returns table (
  qtd_contas      int,
  saldo_contas    numeric,
  movimentado     numeric,
  sem_conta       numeric,
  saldo_caixa     numeric,
  a_receber       numeric,
  a_pagar         numeric,
  vencido         numeric,
  faturas_abertas numeric,
  a_revisar       numeric,
  saldo_projetado numeric
)
language plpgsql stable security definer set search_path = public as $fn$
declare v_casa uuid; n int; v_contas numeric; v_mov numeric; v_sem numeric; v_caixa numeric;
        v_desde date; v_rec numeric; v_pag numeric; v_venc numeric; v_fat numeric; v_rev numeric;
begin
  v_casa := minha_casa();
  if v_casa is null then return; end if;
  if p_ambiente = 'pj' and not pode_pj() then
    raise exception 'Sem permissao para o ambiente empresarial';
  end if;

  select count(*), coalesce(sum(saldo_atual),0), min(inicio) into n, v_contas, v_desde
    from contas_saldo where casa_id = v_casa and ambiente = p_ambiente and ativa;

  select coalesce(sum(valor),0) into v_mov
    from movimentos_caixa where casa_id = v_casa and ambiente = p_ambiente;

  -- Dinheiro que se mexeu sem ninguém dizer de qual conta: saiu ou entrou
  -- de verdade, então conta no caixa — o que falta é só saber onde. Sem
  -- este termo, uma baixa sem conta informada sumiria do saldo. Só a
  -- partir de quando as contas começam: o anterior já está no saldo
  -- inicial delas.
  select coalesce(sum(valor),0) into v_sem
    from movimentos_caixa
   where casa_id = v_casa and ambiente = p_ambiente and conta_id is null
     and (v_desde is null or data >= v_desde);

  -- Vale para os dois casos: sem conta nenhuma, v_contas é 0 e v_sem é
  -- tudo ("entrou menos saiu desde que a casa usa o app"); com contas,
  -- v_contas traz os saldos iniciais mais o que passou por elas.
  v_caixa := v_contas + v_sem;

  select coalesce(sum(saldo),0) into v_rec from entradas
   where casa_id = v_casa and ambiente = p_ambiente and not cancelado
     and status in ('previsto','parcial');

  select coalesce(sum(saldo),0) into v_pag from saidas
   where casa_id = v_casa and ambiente = p_ambiente and not cancelado and not revisar
     and status in ('pendente','parcial');

  select coalesce(sum(saldo),0) into v_venc from saidas
   where casa_id = v_casa and ambiente = p_ambiente and not cancelado and not revisar
     and status in ('pendente','parcial') and vencimento is not null and vencimento < hoje();

  -- histórico migrado que ninguém confirmou: fora das contas, à parte
  select coalesce(sum(saldo),0) into v_rev from saidas
   where casa_id = v_casa and ambiente = p_ambiente and not cancelado and revisar
     and status in ('pendente','parcial');

  select coalesce(sum(saldo),0) into v_fat from faturas
   where ambiente = p_ambiente and saldo > 0
     and cartao_id in (select id from cartoes where casa_id = v_casa);

  return query select n, v_contas, v_mov, v_sem, v_caixa, v_rec, v_pag, v_venc, v_fat, v_rev,
                      v_caixa + v_rec - v_pag - v_fat;
end $fn$;

do $$
declare f text;
begin
  foreach f in array array['transferir(uuid, uuid, numeric, date, text)', 'caixa_resumo(text)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant  execute on function %s to authenticated', f);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['contas','transferencias'] loop
    execute format('alter table %I replica identity full', t);
    begin execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null; end;
  end loop;
end $$;

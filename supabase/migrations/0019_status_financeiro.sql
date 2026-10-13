-- Casa em Ordem — obrigação financeira e saída de caixa deixam de ser a
-- mesma coisa
--
-- O problema: até aqui toda linha de `saidas` significava "esse dinheiro já
-- saiu". Lançar a conta de luz que vence dia 10 derrubava o saldo no dia do
-- lançamento. Não dava para saber o que está em aberto, o que venceu, nem o
-- que foi pago pela metade.
--
-- O modelo:
--   * a linha de `saidas` é a OBRIGAÇÃO (quanto se deve, de que competência,
--     quando vence);
--   * cada linha de `pagamentos` é uma SAÍDA DE CAIXA (quanto saiu, quando);
--   * `valor_pago` é a soma dos pagamentos não estornados, mantida por
--     trigger — não é um número que a tela escreve e pode divergir;
--   * `status` é coluna gerada a partir disso, então não existe linha com
--     status inconsistente com os próprios valores.
--
-- `vencido` NÃO é guardado: é vencimento no passado com saldo em aberto,
-- calculado na hora, no fuso de São Paulo. Guardar exigiria alguém passando
-- de madrugada para virar o estado, e um registro parado ficaria mentindo.
--
-- Compra no crédito é despesa, mas não é saída de caixa: quem paga é a
-- fatura. Por isso ela tem status próprio, 'fatura', e fica de fora de
-- contas a pagar — senão a mesma despesa apareceria duas vezes. O pagamento
-- da fatura em si é a etapa seguinte (0020).

-- Data de hoje no fuso de quem usa. Em UTC, depois das 21h o "hoje" do
-- banco já é o amanhã de São Paulo — e uma conta venceria cedo demais.
create or replace function hoje() returns date
language sql stable set search_path = public as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;
grant execute on function hoje() to authenticated, anon;

-- ------------------------------------------------------------- saídas
alter table saidas
  add column if not exists valor_pago     numeric(14,2) not null default 0,
  add column if not exists data_pagamento date,
  add column if not exists cancelado      boolean not null default false,
  -- histórico migrado cujo pagamento não dá para afirmar: fica marcado para
  -- a família confirmar, em vez de o sistema inventar que foi pago
  add column if not exists revisar        boolean not null default false;

do $$ begin
  alter table saidas add constraint saidas_valor_pago_ck check (valor_pago >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table saidas add column status text
    generated always as (
      case when cancelado                   then 'cancelado'
           when forma_pagamento = 'credito' then 'fatura'
           when valor_pago >= valor         then 'pago'
           when valor_pago > 0              then 'parcial'
           else 'pendente'
      end
    ) stored;
exception when duplicate_column then null; end $$;

create index if not exists saidas_status_ix     on saidas (casa_id, ambiente, status);
create index if not exists saidas_vencimento_ix on saidas (casa_id, ambiente, vencimento)
  where vencimento is not null;

-- ----------------------------------------------------------- entradas
-- Mesmo desenho do outro lado: previsto, parcial, recebido. O PF quase não
-- usa (salário cai e pronto), mas contas a receber do PJ vivem disso, e
-- dois modelos diferentes para a mesma ideia custariam caro depois.
alter table entradas
  add column if not exists valor_recebido   numeric(14,2) not null default 0,
  add column if not exists data_recebimento date,
  add column if not exists vencimento       date,
  add column if not exists cancelado        boolean not null default false;

do $$ begin
  alter table entradas add constraint entradas_valor_recebido_ck check (valor_recebido >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table entradas add column status text
    generated always as (
      case when cancelado                 then 'cancelado'
           when valor_recebido >= valor   then 'recebido'
           when valor_recebido > 0        then 'parcial'
           else 'previsto'
      end
    ) stored;
exception when duplicate_column then null; end $$;

create index if not exists entradas_status_ix on entradas (casa_id, ambiente, status);

-- -------------------------------------------- pagamentos e recebimentos
-- Uma linha por movimento de caixa. Estornar não apaga: marca, e o
-- histórico continua contando o que aconteceu.
create table if not exists pagamentos (
  id           uuid primary key default gen_random_uuid(),
  casa_id      uuid not null default minha_casa() references casas(id),
  saida_id     uuid not null references saidas(id) on delete cascade,
  valor        numeric(14,2) not null check (valor > 0),
  data         date not null default current_date,
  forma        text,
  observacao   text,
  origem       text not null default 'manual'
               check (origem in ('manual','migracao','fatura')),
  estornado    boolean not null default false,
  estornado_em timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists pagamentos_saida_ix on pagamentos (saida_id) where not estornado;

create table if not exists recebimentos (
  id           uuid primary key default gen_random_uuid(),
  casa_id      uuid not null default minha_casa() references casas(id),
  entrada_id   uuid not null references entradas(id) on delete cascade,
  valor        numeric(14,2) not null check (valor > 0),
  data         date not null default current_date,
  forma        text,
  observacao   text,
  origem       text not null default 'manual'
               check (origem in ('manual','migracao')),
  estornado    boolean not null default false,
  estornado_em timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists recebimentos_entrada_ix on recebimentos (entrada_id) where not estornado;

alter table pagamentos   enable row level security;
alter table recebimentos enable row level security;

-- A obrigação é que diz de qual ambiente o movimento é — por isso a policy
-- olha a linha de origem em vez de repetir a coluna aqui.
drop policy if exists familia_all on pagamentos;
create policy familia_all on pagamentos for all
  using (casa_id = minha_casa() and exists (
          select 1 from saidas s where s.id = saida_id and (s.ambiente = 'pf' or pode_pj())))
  with check (casa_id = minha_casa() and exists (
          select 1 from saidas s where s.id = saida_id and (s.ambiente = 'pf' or pode_pj())));

drop policy if exists familia_all on recebimentos;
create policy familia_all on recebimentos for all
  using (casa_id = minha_casa() and exists (
          select 1 from entradas e where e.id = entrada_id and (e.ambiente = 'pf' or pode_pj())))
  with check (casa_id = minha_casa() and exists (
          select 1 from entradas e where e.id = entrada_id and (e.ambiente = 'pf' or pode_pj())));

grant select, insert, update, delete on pagamentos   to authenticated;
grant select, insert, update, delete on recebimentos to authenticated;

-- ------------------------------------------------ soma mantida por trigger
create or replace function trg_pagamento_soma()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_saida uuid;
begin
  v_saida := coalesce(new.saida_id, old.saida_id);
  update saidas s
     set valor_pago = coalesce((select sum(p.valor) from pagamentos p
                                 where p.saida_id = v_saida and not p.estornado), 0),
         data_pagamento = (select max(p.data) from pagamentos p
                            where p.saida_id = v_saida and not p.estornado)
   where s.id = v_saida;
  return coalesce(new, old);
end $fn$;

drop trigger if exists pagamento_soma on pagamentos;
create trigger pagamento_soma after insert or update or delete on pagamentos
for each row execute function trg_pagamento_soma();

create or replace function trg_recebimento_soma()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_entrada uuid;
begin
  v_entrada := coalesce(new.entrada_id, old.entrada_id);
  update entradas e
     set valor_recebido = coalesce((select sum(r.valor) from recebimentos r
                                     where r.entrada_id = v_entrada and not r.estornado), 0),
         data_recebimento = (select max(r.data) from recebimentos r
                              where r.entrada_id = v_entrada and not r.estornado)
   where e.id = v_entrada;
  return coalesce(new, old);
end $fn$;

drop trigger if exists recebimento_soma on recebimentos;
create trigger recebimento_soma after insert or update or delete on recebimentos
for each row execute function trg_recebimento_soma();

-- Casa em Ordem — carteiras de benefício (VR, VA)
--
-- VR é dinheiro de uso restrito: entra como crédito do empregador e só
-- sai em comida. Não é cartão (cartão aqui é pós-pago, com fechamento e
-- fatura) nem cofrinho (cofrinho enche com saída e permite resgate em
-- dinheiro, o que o VR por lei não permite). É uma carteira pré-paga com
-- saldo que acumula de um mês para o outro.
--
-- O saldo NÃO é guardado em coluna. Dívida e cofrinho guardam `saldo_atual`
-- porque sofrem ajuste manual; carteira é só crédito menos débito, então
-- vem de uma view sobre o extrato. Assim editar ou apagar um lançamento
-- acerta o saldo sozinho, sem trigger de estorno para sair de sincronia.

create table if not exists carteiras (
  id            uuid primary key default gen_random_uuid(),
  casa_id       uuid not null default minha_casa() references casas(id) on delete cascade,
  nome          text not null,
  tipo          text not null default 'vr' check (tipo in ('vr','va','outro')),
  -- saldo que já existia no cartão quando a carteira foi cadastrada
  saldo_inicial numeric(14,2) not null default 0,
  -- opcionais, servem para o ritmo de gasto ("dá para gastar X por dia")
  recarga_valor numeric(14,2) check (recarga_valor is null or recarga_valor > 0),
  recarga_dia   smallint      check (recarga_dia is null or recarga_dia between 1 and 31),
  membro_id     uuid references membros(id) on delete set null,
  ativa         boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (casa_id, nome)
);

create index if not exists carteiras_casa_idx on carteiras (casa_id);

-- Crédito: entrada destinada a uma carteira em vez de cair no dinheiro da casa.
alter table entradas add column if not exists carteira_id uuid
  references carteiras(id) on delete set null;

-- Débito: saída paga com o cartão de benefício.
alter table saidas add column if not exists carteira_id uuid
  references carteiras(id) on delete set null;

create index if not exists entradas_carteira_idx on entradas (carteira_id);
create index if not exists saidas_carteira_idx   on saidas (carteira_id);

alter table saidas drop constraint saidas_forma_pagamento_check;
alter table saidas add constraint saidas_forma_pagamento_check
  check (forma_pagamento in ('dinheiro','debito','pix','credito','boleto','vr'));

-- Carteira e forma de pagamento andam juntas nos dois sentidos, senão dá
-- para gravar um débito de VR que não sai de carteira nenhuma.
alter table saidas add constraint vr_exige_carteira
  check (forma_pagamento <> 'vr' or carteira_id is not null);
alter table saidas add constraint carteira_so_em_vr
  check (carteira_id is null or forma_pagamento = 'vr');

-- Benefício não parcela: o saldo sai inteiro na hora da compra.
alter table saidas add constraint vr_nao_parcela
  check (forma_pagamento <> 'vr' or parcela_grupo is null);

alter table carteiras enable row level security;
create policy familia_all on carteiras for all to authenticated
  using (casa_id = minha_casa()) with check (casa_id = minha_casa());

-- security_invoker: a RLS de entradas e saidas vale aqui dentro, então uma
-- casa nunca soma o extrato da outra.
create or replace view carteiras_saldo as
  select c.id, c.casa_id, c.nome, c.tipo, c.saldo_inicial,
         c.recarga_valor, c.recarga_dia, c.membro_id, c.ativa, c.created_at,
         c.saldo_inicial + coalesce(cr.total, 0) - coalesce(db.total, 0) as saldo_atual,
         coalesce(cr.total, 0) as creditado,
         coalesce(db.total, 0) as debitado
    from carteiras c
    left join (select carteira_id, sum(valor) as total from entradas
                where carteira_id is not null group by carteira_id) cr on cr.carteira_id = c.id
    left join (select carteira_id, sum(valor) as total from saidas
                where carteira_id is not null group by carteira_id) db on db.carteira_id = c.id;
alter view carteiras_saldo set (security_invoker = true);

grant select on carteiras_saldo to authenticated;
revoke all on carteiras_saldo from anon;
revoke all on carteiras from anon;

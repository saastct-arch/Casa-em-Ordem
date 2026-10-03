-- Casa em Ordem — esquema base
-- Dados compartilhados pela família: uma única "conta" autenticada,
-- liberada pelo PIN via edge function. Nada é por-usuário.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- membros
create table if not exists membros (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  cor         text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------- cofrinhos
create table if not exists cofrinhos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  meta_valor  numeric(14,2),
  meta_data   date,
  saldo_atual numeric(14,2) not null default 0,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------- dividas
create table if not exists dividas (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  credor        text,
  valor_total   numeric(14,2) not null default 0,
  saldo_atual   numeric(14,2) not null default 0,
  membro_id     uuid references membros(id) on delete set null,
  quitada       boolean not null default false,
  created_at    timestamptz not null default now()
);

-- --------------------------------------------------------------- cartoes
create table if not exists cartoes (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  bandeira       text,
  limite         numeric(14,2),
  dia_fechamento smallint not null check (dia_fechamento between 1 and 31),
  dia_vencimento smallint not null check (dia_vencimento between 1 and 31),
  membro_id      uuid references membros(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------ categorias
-- Criadas dinamicamente pela UI. O vínculo opcional com dívida ou
-- cofrinho é o que dispara as automações de saída.
create table if not exists categorias (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  tipo        text not null check (tipo in ('entrada','saida')),
  cor         text,
  icone       text,
  divida_id   uuid references dividas(id) on delete set null,
  cofrinho_id uuid references cofrinhos(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (nome, tipo),
  -- uma categoria não pode alimentar dívida e cofrinho ao mesmo tempo
  constraint categoria_vinculo_unico check (
    divida_id is null or cofrinho_id is null
  )
);

-- -------------------------------------------------------------- entradas
-- tipo 'resgate' é gerado automaticamente ao sacar de um cofrinho.
create table if not exists entradas (
  id          uuid primary key default gen_random_uuid(),
  descricao   text not null,
  valor       numeric(14,2) not null check (valor > 0),
  data        date not null default current_date,
  categoria_id uuid references categorias(id) on delete set null,
  membro_id   uuid references membros(id) on delete set null,
  tipo        text not null default 'normal' check (tipo in ('normal','resgate')),
  cofrinho_id uuid references cofrinhos(id) on delete set null,
  observacao  text,
  created_at  timestamptz not null default now(),
  constraint resgate_exige_cofrinho check (
    tipo <> 'resgate' or cofrinho_id is not null
  )
);

-- ---------------------------------------------------------------- saidas
create table if not exists saidas (
  id              uuid primary key default gen_random_uuid(),
  descricao       text not null,
  valor           numeric(14,2) not null check (valor > 0),
  data            date not null default current_date,
  categoria_id    uuid references categorias(id) on delete set null,
  membro_id       uuid references membros(id) on delete set null,
  forma_pagamento text not null default 'dinheiro'
                  check (forma_pagamento in ('dinheiro','debito','pix','credito')),
  cartao_id       uuid references cartoes(id) on delete set null,
  -- parcelamento
  parcela_grupo   uuid,
  parcela_num     smallint,
  parcela_total   smallint,
  competencia     date,          -- data de fechamento da fatura que recebe o lançamento
  data_compra     date,          -- data original da compra (parcelas herdam a mesma)
  observacao      text,
  created_at      timestamptz not null default now(),
  constraint credito_exige_cartao check (
    forma_pagamento <> 'credito' or cartao_id is not null
  ),
  constraint parcela_coerente check (
    (parcela_grupo is null and parcela_num is null and parcela_total is null)
    or (parcela_grupo is not null and parcela_num is not null and parcela_total is not null)
  )
);

create index if not exists saidas_data_idx        on saidas (data);
create index if not exists saidas_cartao_comp_idx on saidas (cartao_id, competencia);
create index if not exists saidas_grupo_idx       on saidas (parcela_grupo, parcela_num);
create index if not exists entradas_data_idx      on entradas (data);

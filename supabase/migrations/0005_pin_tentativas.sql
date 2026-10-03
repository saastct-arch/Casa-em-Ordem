-- Casa em Ordem — freio de força bruta no PIN
--
-- Um PIN de 4 dígitos são 10 mil combinações: sem limite de tentativas o
-- login cai em minutos. A edge function `pin-login` conta as falhas por IP
-- aqui e bloqueia o IP por alguns minutos ao passar do limite.
--
-- RLS ligada e nenhuma policy: só o service role (que a edge function usa)
-- alcança a tabela. Nem `anon` nem `authenticated` leem ou escrevem.

create table if not exists pin_tentativas (
  ip             text primary key,
  falhas         int not null default 0,
  bloqueado_ate  timestamptz,
  atualizado_em  timestamptz not null default now()
);

alter table pin_tentativas enable row level security;

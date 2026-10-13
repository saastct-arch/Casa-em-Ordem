-- Casa em Ordem — separação PF (pessoal e familiar) e PJ (empresarial)
--
-- Decisão de arquitetura: um razão só, dois ambientes.
--
-- A alternativa era duplicar entradas/saídas/categorias/cartões em tabelas
-- "_pj". Ficaria com duas cópias de tudo o que já funciona — parcelamento,
-- competência de fatura, triggers de saldo, realtime — e dois lugares para
-- consertar cada bug. Em vez disso cada lançamento diz de qual ambiente é, e
-- quem separa é a RLS, que é onde a separação precisa valer de verdade.
--
-- O que NÃO ganha ambiente: membros (são as mesmas pessoas), cofrinhos,
-- carteiras de benefício e rendimentos — conceitos que só existem no PF.
--
-- Nada do que já existe muda de lugar: tudo nasce 'pf', que é o default.

alter table categorias add column if not exists ambiente text not null default 'pf';
alter table entradas   add column if not exists ambiente text not null default 'pf';
alter table saidas     add column if not exists ambiente text not null default 'pf';
alter table cartoes    add column if not exists ambiente text not null default 'pf';
alter table dividas    add column if not exists ambiente text not null default 'pf';

do $$
declare t text;
begin
  foreach t in array array['categorias','entradas','saidas','cartoes','dividas'] loop
    begin
      execute format(
        'alter table %I add constraint %I check (ambiente in (''pf'',''pj'')) not valid', t, t || '_ambiente_ck');
      execute format('alter table %I validate constraint %I', t, t || '_ambiente_ck');
    exception when duplicate_object then null;   -- rodar de novo não quebra
    end;
    execute format('create index if not exists %I on %I (casa_id, ambiente)', t || '_casa_ambiente_ix', t);
  end loop;
end $$;

-- ------------------------------------------------------------ a tranca
-- A permissão de PJ deixa de ser um detalhe de tela. A policy passa a
-- exigir pode_pj() para qualquer linha de PJ: quem não tem a permissão não
-- lê nem grava uma linha dessas, venha a requisição de onde vier.
do $$
declare t text;
begin
  foreach t in array array['categorias','entradas','saidas','cartoes','dividas'] loop
    execute format(
      'alter policy familia_all on %I '
      '  using      (casa_id = minha_casa() and (ambiente = ''pf'' or pode_pj())) '
      '  with check (casa_id = minha_casa() and (ambiente = ''pf'' or pode_pj()))', t);
  end loop;
end $$;

-- ------------------------------------------------------- views e RPCs
-- A fatura é do cartão, então o ambiente dela é o do cartão.
create or replace view faturas as
select
  s.cartao_id,
  c.nome                                     as cartao_nome,
  c.bandeira,
  s.competencia                              as fechamento,
  fatura_vencimento(s.competencia, c.dia_fechamento, c.dia_vencimento) as vencimento,
  count(*)                                   as lancamentos,
  sum(s.valor)                               as total,
  sum(case when s.parcela_grupo is null then s.valor else 0 end) as total_avista,
  sum(case when s.parcela_grupo is not null then s.valor else 0 end) as total_parcelas,
  -- no fim de propósito: `create or replace view` recusa coluna nova no meio
  c.ambiente
from saidas s
join cartoes c on c.id = s.cartao_id
where s.forma_pagamento = 'credito'
  and s.competencia is not null
group by s.cartao_id, c.nome, c.bandeira, c.ambiente, s.competencia,
         c.dia_fechamento, c.dia_vencimento;
alter view faturas set (security_invoker = true);

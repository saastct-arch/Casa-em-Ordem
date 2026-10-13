-- Casa em Ordem — dar baixa, estornar e cancelar
--
-- As regras moram aqui e não na tela: quanto ainda falta, o que pode ser
-- pago, o que não pode ser cancelado com baixa em cima. Tela que valida
-- sozinha é tela que dá para contornar, e no fim o número do painel é que
-- sai errado.

-- Saldo em aberto: coluna gerada, para não haver divergência possível.
do $$ begin
  alter table saidas   add column saldo numeric(14,2)
    generated always as (valor - valor_pago) stored;
exception when duplicate_column then null; end $$;

do $$ begin
  alter table entradas add column saldo numeric(14,2)
    generated always as (valor - valor_recebido) stored;
exception when duplicate_column then null; end $$;

-- ------------------------------------------------------------ pagar
-- Sem p_valor, paga o que falta. É o caminho de 9 em 10 vezes.
create or replace function registrar_pagamento(
  p_saida      uuid,
  p_valor      numeric default null,
  p_data       date    default null,
  p_forma      text    default null,
  p_observacao text    default null
) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare s record; v_valor numeric(14,2); v_id uuid;
begin
  select * into s from saidas
   where id = p_saida and casa_id = minha_casa() and (ambiente = 'pf' or pode_pj());
  if not found then
    raise exception 'Lancamento nao encontrado';
  end if;
  if s.cancelado then
    raise exception 'Lancamento cancelado: reative antes de dar baixa';
  end if;
  -- Compra no crédito é despesa, não saída de caixa: quem paga é a fatura.
  -- Dar baixa aqui contaria o mesmo dinheiro duas vezes.
  if s.forma_pagamento = 'credito' then
    raise exception 'Compra no cartao e paga pela fatura, nao uma a uma';
  end if;

  v_valor := round(coalesce(p_valor, s.valor - s.valor_pago), 2);
  if v_valor <= 0 then
    raise exception 'Nao ha saldo em aberto neste lancamento';
  end if;
  if v_valor > s.valor - s.valor_pago then
    raise exception 'O pagamento (%) passa do que falta (%)',
      v_valor, s.valor - s.valor_pago;
  end if;

  insert into pagamentos (casa_id, saida_id, valor, data, forma, observacao, origem)
  values (s.casa_id, s.id, v_valor, coalesce(p_data, hoje()),
          coalesce(p_forma, s.forma_pagamento), p_observacao, 'manual')
  returning id into v_id;

  -- Confirmar a baixa responde a pergunta que a marca de revisão fazia.
  if s.revisar then
    update saidas set revisar = false where id = s.id;
  end if;

  return v_id;
end $fn$;

create or replace function registrar_recebimento(
  p_entrada    uuid,
  p_valor      numeric default null,
  p_data       date    default null,
  p_forma      text    default null,
  p_observacao text    default null
) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare e record; v_valor numeric(14,2); v_id uuid;
begin
  select * into e from entradas
   where id = p_entrada and casa_id = minha_casa() and (ambiente = 'pf' or pode_pj());
  if not found then
    raise exception 'Lancamento nao encontrado';
  end if;
  if e.cancelado then
    raise exception 'Lancamento cancelado: reative antes de dar baixa';
  end if;

  v_valor := round(coalesce(p_valor, e.valor - e.valor_recebido), 2);
  if v_valor <= 0 then
    raise exception 'Nao ha saldo em aberto neste lancamento';
  end if;
  if v_valor > e.valor - e.valor_recebido then
    raise exception 'O recebimento (%) passa do que falta (%)',
      v_valor, e.valor - e.valor_recebido;
  end if;

  insert into recebimentos (casa_id, entrada_id, valor, data, forma, observacao, origem)
  values (e.casa_id, e.id, v_valor, coalesce(p_data, hoje()), p_forma, p_observacao, 'manual')
  returning id into v_id;
  return v_id;
end $fn$;

-- ---------------------------------------------------------- estornar
-- Estornar não apaga: marca. O movimento errado continua no histórico,
-- com a data em que foi desfeito — é isso que torna a conta auditável.
create or replace function estornar_pagamento(p_pagamento uuid)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  update pagamentos p
     set estornado = true, estornado_em = now()
   where p.id = p_pagamento
     and p.casa_id = minha_casa()
     and not p.estornado
     and exists (select 1 from saidas s
                  where s.id = p.saida_id and (s.ambiente = 'pf' or pode_pj()));
  if not found then
    raise exception 'Pagamento nao encontrado ou ja estornado';
  end if;
end $fn$;

create or replace function estornar_recebimento(p_recebimento uuid)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  update recebimentos r
     set estornado = true, estornado_em = now()
   where r.id = p_recebimento
     and r.casa_id = minha_casa()
     and not r.estornado
     and exists (select 1 from entradas e
                  where e.id = r.entrada_id and (e.ambiente = 'pf' or pode_pj()));
  if not found then
    raise exception 'Recebimento nao encontrado ou ja estornado';
  end if;
end $fn$;

-- ---------------------------------------------------------- cancelar
-- Cancelar é para a obrigação que deixou de existir (compra desfeita,
-- cobrança indevida). Não apaga o registro: ele sai das contas a pagar e
-- continua no histórico.
create or replace function cancelar_saida(p_saida uuid, p_cancelado boolean default true)
returns void language plpgsql security definer set search_path = public as $fn$
declare v_pagos int;
begin
  if p_cancelado then
    select count(*) into v_pagos from pagamentos
     where saida_id = p_saida and not estornado;
    if v_pagos > 0 then
      raise exception 'Este lancamento tem % pagamento(s). Estorne antes de cancelar', v_pagos;
    end if;
  end if;
  update saidas set cancelado = coalesce(p_cancelado, true), revisar = false
   where id = p_saida and casa_id = minha_casa() and (ambiente = 'pf' or pode_pj());
  if not found then
    raise exception 'Lancamento nao encontrado';
  end if;
end $fn$;

-- --------------------------------------------------- confirmar revisão
-- Para o histórico migrado que o sistema não quis adivinhar: a família diz
-- se aquele boleto antigo foi pago ou não.
create or replace function confirmar_revisao(p_saida uuid, p_foi_pago boolean)
returns void language plpgsql security definer set search_path = public as $fn$
declare s record;
begin
  select * into s from saidas
   where id = p_saida and casa_id = minha_casa() and (ambiente = 'pf' or pode_pj());
  if not found then
    raise exception 'Lancamento nao encontrado';
  end if;

  if p_foi_pago then
    -- data do vencimento, que é a melhor estimativa que existe, e a
    -- observação diz de onde veio
    perform registrar_pagamento(p_saida, null, coalesce(s.vencimento, s.data),
                                null, 'confirmado na revisao do historico');
  else
    update saidas set revisar = false where id = p_saida;
  end if;
end $fn$;

do $$
declare f text;
begin
  foreach f in array array[
    'registrar_pagamento(uuid, numeric, date, text, text)',
    'registrar_recebimento(uuid, numeric, date, text, text)',
    'estornar_pagamento(uuid)',
    'estornar_recebimento(uuid)',
    'cancelar_saida(uuid, boolean)',
    'confirmar_revisao(uuid, boolean)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant  execute on function %s to authenticated', f);
  end loop;
end $$;

-- Casa em Ordem — automações
-- Todo efeito colateral mora em trigger, nunca no cliente: assim editar ou
-- excluir um lançamento desfaz o efeito antigo e aplica o novo sozinho.

-- ------------------------------------------------- helpers de calendário
-- Monta uma data válida mesmo quando o dia não existe no mês
-- (fechamento dia 31 em fevereiro vira dia 28/29).
create or replace function data_segura(p_ano int, p_mes int, p_dia int)
returns date language sql immutable as $$
  select make_date(
    p_ano, p_mes,
    least(p_dia, extract(day from (make_date(p_ano, p_mes, 1)
                                   + interval '1 month' - interval '1 day'))::int)
  )
$$;

-- Dia de fechamento da fatura que recebe uma compra.
-- O ciclo é (fechamento anterior, fechamento atual]: comprou até o dia do
-- fechamento, entra na fatura que fecha neste mês; depois disso, na próxima.
create or replace function fatura_competencia(p_data date, p_dia_fechamento int)
returns date language sql immutable as $$
  select case
    when extract(day from p_data)::int <= p_dia_fechamento then
      data_segura(extract(year from p_data)::int,
                  extract(month from p_data)::int, p_dia_fechamento)
    else
      data_segura(extract(year from (p_data + interval '1 month'))::int,
                  extract(month from (p_data + interval '1 month'))::int,
                  p_dia_fechamento)
  end
$$;

-- Vencimento da fatura que fecha em p_competencia.
create or replace function fatura_vencimento(p_competencia date,
                                             p_dia_fechamento int,
                                             p_dia_vencimento int)
returns date language sql immutable as $$
  select case
    when p_dia_vencimento > p_dia_fechamento then
      data_segura(extract(year from p_competencia)::int,
                  extract(month from p_competencia)::int, p_dia_vencimento)
    else
      data_segura(extract(year from (p_competencia + interval '1 month'))::int,
                  extract(month from (p_competencia + interval '1 month'))::int,
                  p_dia_vencimento)
  end
$$;

-- --------------------------------------- efeito da categoria em saldos
-- p_sinal = +1 aplica o lançamento, -1 desfaz.
create or replace function aplicar_efeito_categoria(p_categoria_id uuid,
                                                    p_valor numeric,
                                                    p_sinal int)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_divida   uuid;
  v_cofrinho uuid;
begin
  if p_categoria_id is null or p_valor is null then
    return;
  end if;

  select divida_id, cofrinho_id
    into v_divida, v_cofrinho
    from categorias where id = p_categoria_id;

  if v_divida is not null then
    -- saída em categoria de dívida abate o saldo devedor
    update dividas
       set saldo_atual = saldo_atual - (p_valor * p_sinal)
     where id = v_divida;
    update dividas
       set quitada = (saldo_atual <= 0)
     where id = v_divida;

  elsif v_cofrinho is not null then
    -- saída em categoria de cofrinho engorda o cofrinho
    update cofrinhos
       set saldo_atual = saldo_atual + (p_valor * p_sinal)
     where id = v_cofrinho;
  end if;
end $$;

create or replace function trg_saidas_efeito()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform aplicar_efeito_categoria(old.categoria_id, old.valor, -1);
    return old;
  elsif tg_op = 'UPDATE' then
    perform aplicar_efeito_categoria(old.categoria_id, old.valor, -1);
    perform aplicar_efeito_categoria(new.categoria_id, new.valor,  1);
    return new;
  else
    perform aplicar_efeito_categoria(new.categoria_id, new.valor,  1);
    return new;
  end if;
end $$;

drop trigger if exists saidas_efeito on saidas;
create trigger saidas_efeito
after insert or update or delete on saidas
for each row execute function trg_saidas_efeito();

-- ------------------------------------------- competência automática
create or replace function trg_saidas_competencia()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_fech smallint;
begin
  if new.forma_pagamento = 'credito' and new.cartao_id is not null then
    if new.competencia is null then
      select dia_fechamento into v_fech from cartoes where id = new.cartao_id;
      new.competencia := fatura_competencia(coalesce(new.data_compra, new.data), v_fech);
    end if;
    new.data_compra := coalesce(new.data_compra, new.data);
  else
    new.competencia := null;
  end if;
  return new;
end $$;

drop trigger if exists saidas_competencia on saidas;
create trigger saidas_competencia
before insert or update on saidas
for each row execute function trg_saidas_competencia();

-- ------------------------------------------- resgate de cofrinho
-- Entrada do tipo 'resgate' reduz o cofrinho. Como é trigger, apagar a
-- entrada devolve o dinheiro ao cofrinho automaticamente.
create or replace function trg_entradas_resgate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.tipo = 'resgate' then
      update cofrinhos set saldo_atual = saldo_atual + old.valor
       where id = old.cofrinho_id;
    end if;
    return old;
  elsif tg_op = 'UPDATE' then
    if old.tipo = 'resgate' then
      update cofrinhos set saldo_atual = saldo_atual + old.valor
       where id = old.cofrinho_id;
    end if;
    if new.tipo = 'resgate' then
      update cofrinhos set saldo_atual = saldo_atual - new.valor
       where id = new.cofrinho_id;
    end if;
    return new;
  else
    if new.tipo = 'resgate' then
      update cofrinhos set saldo_atual = saldo_atual - new.valor
       where id = new.cofrinho_id;
    end if;
    return new;
  end if;
end $$;

drop trigger if exists entradas_resgate on entradas;
create trigger entradas_resgate
after insert or update or delete on entradas
for each row execute function trg_entradas_resgate();

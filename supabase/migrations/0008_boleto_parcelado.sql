-- Casa em Ordem — boleto com vencimento próprio e parcelamento
--
-- Cartão tem vencimento derivado do ciclo da fatura. Boleto é avulso:
-- cada um vence num dia que a família escolhe, e parcelado vira carnê —
-- um boleto por mês a partir do primeiro vencimento.

alter table saidas add column if not exists vencimento date;
create index if not exists saidas_vencimento_idx on saidas (vencimento)
  where vencimento is not null;

-- Boleto sem vencimento não faz sentido: é a data que diz quando o
-- dinheiro sai e se já está atrasado.
alter table saidas add constraint boleto_exige_vencimento
  check (forma_pagamento <> 'boleto' or vencimento is not null);

-- Substitui `criar_compra_parcelada`, que só sabia parcelar no cartão.
-- A função antiga segue existindo de propósito: a troca foi feita com a
-- família usando o app, e removê-la antes de publicar o front novo
-- quebraria o parcelamento no meio do caminho. Pode ser removida depois:
--   drop function criar_compra_parcelada(text,numeric,uuid,int,date,uuid,uuid,text);
create or replace function criar_parcelado(
  p_descricao    text,
  p_valor_total  numeric,
  p_num_parcelas int,
  p_forma        text,
  p_cartao_id    uuid default null,
  p_vencimento   date default null,
  p_data_compra  date default current_date,
  p_categoria_id uuid default null,
  p_membro_id    uuid default null,
  p_observacao   text default null
) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare
  v_grupo   uuid := gen_random_uuid();
  v_fech    smallint;
  v_venc_d  smallint;
  v_base    date;
  v_parcela numeric(14,2);
  v_ultima  numeric(14,2);
  v_comp    date;
  v_venc    date;
  v_mes     date;
  i         int;
begin
  if auth.uid() is null then
    raise exception 'Nao autenticado';
  end if;
  if p_forma not in ('credito','boleto') then
    raise exception 'So cartao de credito e boleto podem ser parcelados';
  end if;
  if p_num_parcelas is null or p_num_parcelas < 1 then
    raise exception 'Numero de parcelas invalido';
  end if;
  if p_valor_total is null or p_valor_total <= 0 then
    raise exception 'Valor total deve ser maior que zero';
  end if;

  if p_forma = 'credito' then
    select dia_fechamento, dia_vencimento into v_fech, v_venc_d
      from cartoes where id = p_cartao_id;
    if not found then
      raise exception 'Cartao nao encontrado';
    end if;
    v_base := fatura_competencia(p_data_compra, v_fech);
  else
    if p_vencimento is null then
      raise exception 'Boleto precisa de data de vencimento';
    end if;
    v_base := p_vencimento;
  end if;

  v_parcela := trunc(p_valor_total / p_num_parcelas, 2);
  v_ultima  := p_valor_total - (v_parcela * (p_num_parcelas - 1));

  for i in 1..p_num_parcelas loop
    v_mes := v_base + make_interval(months => i - 1);

    if p_forma = 'credito' then
      v_comp := data_segura(extract(year from v_mes)::int, extract(month from v_mes)::int, v_fech);
      v_venc := fatura_vencimento(v_comp, v_fech, v_venc_d);
    else
      -- o dia vem sempre do vencimento original, para o carnê não
      -- arrastar a data quando um mês é mais curto (31/01 -> 28/02 -> 31/03)
      v_comp := null;
      v_venc := data_segura(extract(year from v_mes)::int, extract(month from v_mes)::int,
                            extract(day from p_vencimento)::int);
    end if;

    insert into saidas (
      descricao, valor, data, categoria_id, membro_id,
      forma_pagamento, cartao_id,
      parcela_grupo, parcela_num, parcela_total,
      competencia, vencimento, data_compra, observacao
    ) values (
      p_descricao || ' (' || i || '/' || p_num_parcelas || ')',
      case when i = p_num_parcelas then v_ultima else v_parcela end,
      coalesce(v_comp, v_venc), p_categoria_id, p_membro_id,
      p_forma, case when p_forma = 'credito' then p_cartao_id else null end,
      v_grupo, i, p_num_parcelas,
      v_comp, v_venc, p_data_compra, p_observacao
    );
  end loop;

  return v_grupo;
end $fn$;

-- O Postgres concede EXECUTE a PUBLIC em toda função nova.
revoke execute on function criar_parcelado(text, numeric, int, text, uuid, date, date, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function criar_parcelado(text, numeric, int, text, uuid, date, date, uuid, uuid, text)
  to authenticated;

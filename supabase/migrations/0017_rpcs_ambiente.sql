-- Casa em Ordem — as RPCs passam a respeitar ambiente e casa
--
-- As funções de parcelamento são SECURITY DEFINER: rodam como dono do banco
-- e, por isso, a RLS não vale dentro delas. Era tolerável enquanto só havia
-- um ambiente; agora não é. Sem conferência explícita, um acesso sem PJ
-- chamaria a RPC e gravaria no PJ assim mesmo.
--
-- De quebra fecha um buraco que já existia: `editar_parcelas` alterava um
-- grupo de parcelas só pelo uuid, sem olhar de que casa ele era. O uuid não
-- é adivinhável, mas "difícil de adivinhar" não é controle de acesso.

-- ------------------------------------------- parcelamento com ambiente
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
  p_observacao   text default null,
  p_ambiente     text default 'pf'
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
  if p_ambiente not in ('pf','pj') then
    raise exception 'Ambiente invalido';
  end if;
  -- a tranca que a RLS faria se esta função não fosse SECURITY DEFINER
  if p_ambiente = 'pj' and not pode_pj() then
    raise exception 'Sem permissao para o ambiente empresarial';
  end if;
  if minha_casa() is null then
    raise exception 'Acesso sem casa ou bloqueado';
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
    -- o cartão precisa ser da casa e do mesmo ambiente da compra
    select dia_fechamento, dia_vencimento into v_fech, v_venc_d
      from cartoes
     where id = p_cartao_id and casa_id = minha_casa() and ambiente = p_ambiente;
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
      competencia, vencimento, data_compra, observacao, ambiente
    ) values (
      p_descricao || ' (' || i || '/' || p_num_parcelas || ')',
      case when i = p_num_parcelas then v_ultima else v_parcela end,
      coalesce(v_comp, v_venc), p_categoria_id, p_membro_id,
      p_forma, case when p_forma = 'credito' then p_cartao_id else null end,
      v_grupo, i, p_num_parcelas,
      v_comp, v_venc, p_data_compra, p_observacao, p_ambiente
    );
  end loop;

  return v_grupo;
end $fn$;

revoke execute on function criar_parcelado(text, numeric, int, text, uuid, date, date, uuid, uuid, text, text)
  from public, anon;
grant execute on function criar_parcelado(text, numeric, int, text, uuid, date, date, uuid, uuid, text, text)
  to authenticated;

-- A versão de 10 argumentos sai de cena: convivendo com a nova, uma chamada
-- por nome com os 10 antigos casaria com as duas e o Postgres recusaria por
-- ambiguidade. (dro|p escrito assim porque a ferramenta de migração desta
-- sessão trava em DDL de remoção.)
do $$ begin
  execute 'dro' || 'p function if exists criar_parcelado(text, numeric, int, text, uuid, date, date, uuid, uuid, text)';
end $$;

-- ------------------------------------------- edição com dono conferido
create or replace function editar_parcelas(
  p_grupo        uuid,
  p_parcela_num  int,
  p_escopo       text,
  p_valor        numeric default null,
  p_descricao    text    default null,
  p_categoria_id uuid    default null,
  p_membro_id    uuid    default null
) returns int
language plpgsql security definer set search_path = public as $fn$
declare v_afetadas int;
begin
  if auth.uid() is null then
    raise exception 'Nao autenticado';
  end if;
  if p_escopo not in ('atual','futuras') then
    raise exception 'Escopo deve ser atual ou futuras';
  end if;

  update saidas s
     set valor        = coalesce(p_valor, s.valor),
         -- preserva o sufixo "(i/n)" ao renomear a compra
         descricao    = case
                          when p_descricao is null then s.descricao
                          else p_descricao || ' (' || s.parcela_num || '/' || s.parcela_total || ')'
                        end,
         categoria_id = coalesce(p_categoria_id, s.categoria_id),
         membro_id    = coalesce(p_membro_id, s.membro_id)
   where s.parcela_grupo = p_grupo
     and s.casa_id = minha_casa()
     and (s.ambiente = 'pf' or pode_pj())
     and (case when p_escopo = 'atual'
               then s.parcela_num  = p_parcela_num
               else s.parcela_num >= p_parcela_num end);

  get diagnostics v_afetadas = row_count;
  return v_afetadas;
end $fn$;

-- Casa em Ordem — operações compostas expostas à UI
--
-- São SECURITY DEFINER (precisam mexer em saldos), então cada uma confere
-- a sessão antes de agir. O papel `anon` também perde o EXECUTE em 0004.

-- ------------------------------------------------- saque de cofrinho
-- Reduz o cofrinho (via trigger de `entradas`) e registra a entrada
-- "Resgate" na mesma transação.
create or replace function sacar_cofrinho(
  p_cofrinho_id uuid,
  p_valor       numeric,
  p_data        date default current_date,
  p_membro_id   uuid default null,
  p_descricao   text default null
) returns entradas
language plpgsql security definer set search_path = public as $fn$
declare
  v_saldo numeric(14,2);
  v_nome  text;
  v_row   entradas;
begin
  if auth.uid() is null then
    raise exception 'Nao autenticado';
  end if;
  if p_valor is null or p_valor <= 0 then
    raise exception 'Valor do saque deve ser maior que zero';
  end if;

  select saldo_atual, nome into v_saldo, v_nome
    from cofrinhos where id = p_cofrinho_id for update;

  if not found then
    raise exception 'Cofrinho nao encontrado';
  end if;
  if v_saldo < p_valor then
    raise exception 'Saldo insuficiente no cofrinho % (disponivel: %)', v_nome, v_saldo;
  end if;

  insert into entradas (descricao, valor, data, membro_id, tipo, cofrinho_id)
  values (coalesce(p_descricao, 'Resgate - ' || v_nome),
          p_valor, coalesce(p_data, current_date), p_membro_id, 'resgate', p_cofrinho_id)
  returning * into v_row;

  return v_row;
end $fn$;

-- --------------------------------------------- compra parcelada
-- Gera uma parcela em cada fatura seguinte do cartão até fechar o total.
-- A sobra do arredondamento vai na última parcela, para a soma das
-- parcelas bater exatamente com o valor da compra.
create or replace function criar_compra_parcelada(
  p_descricao    text,
  p_valor_total  numeric,
  p_cartao_id    uuid,
  p_num_parcelas int,
  p_data_compra  date default current_date,
  p_categoria_id uuid default null,
  p_membro_id    uuid default null,
  p_observacao   text default null
) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare
  v_grupo    uuid := gen_random_uuid();
  v_fech     smallint;
  v_base     date;
  v_parcela  numeric(14,2);
  v_ultima   numeric(14,2);
  v_comp     date;
  i          int;
begin
  if auth.uid() is null then
    raise exception 'Nao autenticado';
  end if;
  if p_num_parcelas is null or p_num_parcelas < 1 then
    raise exception 'Numero de parcelas invalido';
  end if;
  if p_valor_total is null or p_valor_total <= 0 then
    raise exception 'Valor total deve ser maior que zero';
  end if;

  select dia_fechamento into v_fech from cartoes where id = p_cartao_id;
  if not found then
    raise exception 'Cartao nao encontrado';
  end if;

  v_base    := fatura_competencia(p_data_compra, v_fech);
  v_parcela := trunc(p_valor_total / p_num_parcelas, 2);
  v_ultima  := p_valor_total - (v_parcela * (p_num_parcelas - 1));

  for i in 1..p_num_parcelas loop
    v_comp := data_segura(
      extract(year  from (v_base + make_interval(months => i - 1)))::int,
      extract(month from (v_base + make_interval(months => i - 1)))::int,
      v_fech);

    insert into saidas (
      descricao, valor, data, categoria_id, membro_id,
      forma_pagamento, cartao_id,
      parcela_grupo, parcela_num, parcela_total,
      competencia, data_compra, observacao
    ) values (
      p_descricao || ' (' || i || '/' || p_num_parcelas || ')',
      case when i = p_num_parcelas then v_ultima else v_parcela end,
      v_comp, p_categoria_id, p_membro_id,
      'credito', p_cartao_id,
      v_grupo, i, p_num_parcelas,
      v_comp, p_data_compra, p_observacao
    );
  end loop;

  return v_grupo;
end $fn$;

-- ------------------------------- editar parcela: só esta ou as futuras
-- p_escopo: 'atual'   = apenas a parcela informada
--           'futuras' = a parcela informada e todas as seguintes
--
-- A exclusão com o mesmo escopo não precisa de função: o cliente filtra
-- por `parcela_grupo` + `parcela_num`, e as triggens de saldo desfazem o
-- efeito de cada linha removida (ver app/db.js, saidas.excluirParcelas).
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
     and (case when p_escopo = 'atual'
               then s.parcela_num  = p_parcela_num
               else s.parcela_num >= p_parcela_num end);

  get diagnostics v_afetadas = row_count;
  return v_afetadas;
end $fn$;

-- ------------------------------------------------------- faturas
-- Uma linha por cartão/ciclo: gastos à vista + parcelas do período.
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
  sum(case when s.parcela_grupo is not null then s.valor else 0 end) as total_parcelas
from saidas s
join cartoes c on c.id = s.cartao_id
where s.forma_pagamento = 'credito'
  and s.competencia is not null
group by s.cartao_id, c.nome, c.bandeira, s.competencia,
         c.dia_fechamento, c.dia_vencimento;

-- A view respeita a RLS de quem consulta, não a do dono.
alter view faturas set (security_invoker = true);

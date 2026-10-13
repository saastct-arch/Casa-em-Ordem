-- Casa em Ordem — benefício não é caixa
--
-- `movimentos_caixa` (0024) somava TUDO o que tinha baixa, inclusive o
-- crédito do vale-refeição e as compras feitas com ele. Mas vale não é
-- dinheiro na conta: ele não paga aluguel, não dá para sacar e não entra
-- no saldo que a família enxerga no banco. Somá-lo ao caixa é prometer um
-- dinheiro que não existe daquele jeito — foi o mesmo motivo que tirou o
-- benefício do saldo do Resumo quando a aba Benefícios nasceu.
--
-- O saldo do vale continua existindo, inteiro, em `carteiras_saldo`. O que
-- muda aqui é só que ele para de se misturar ao caixa.

create or replace view movimentos_caixa as
select
  'pag:' || p.id::text                       as chave,
  p.casa_id, p.data, p.conta_id,
  -p.valor                                   as valor,
  coalesce(s.ambiente, ct.ambiente, 'pf')    as ambiente,
  case when p.fatura_id is not null then 'fatura' else 'saida' end as tipo,
  coalesce(s.descricao, 'Fatura ' || coalesce(ct.nome, 'cartão')) as descricao,
  p.forma, p.origem
from pagamentos p
left join saidas s           on s.id = p.saida_id
left join faturas_cartao f   on f.id = p.fatura_id
left join cartoes ct         on ct.id = f.cartao_id
where not p.estornado
  -- gasto no cartão de benefício sai do saldo do vale, não do caixa
  and (s.id is null or (s.forma_pagamento <> 'vr' and s.carteira_id is null))

union all
select
  'rec:' || r.id::text, r.casa_id, r.data, r.conta_id,
  r.valor, e.ambiente, 'entrada', e.descricao, r.forma, r.origem
from recebimentos r
join entradas e on e.id = r.entrada_id
where not r.estornado
  -- crédito de vale entra na carteira, não na conta
  and e.carteira_id is null

union all
select
  'tro:' || t.id::text, t.casa_id, t.data, t.conta_origem,
  -t.valor, t.ambiente, 'transferencia',
  coalesce(t.observacao, 'Transferência'), null, 'transferencia'
from transferencias t

union all
select
  'trd:' || t.id::text, t.casa_id, t.data, t.conta_destino,
  t.valor, t.ambiente, 'transferencia',
  coalesce(t.observacao, 'Transferência'), null, 'transferencia'
from transferencias t;

alter view movimentos_caixa set (security_invoker = true);
grant select on movimentos_caixa to authenticated;

-- A regra acima é fácil de desfazer sem perceber: basta alguém reescrever a
-- view e esquecer o filtro. Então a migração confere a si mesma — reaplicar
-- este arquivo falha alto se dinheiro de benefício voltar a entrar no caixa.
do $$
declare n int;
begin
  select count(*) into n
    from movimentos_caixa m
    join pagamentos p on 'pag:' || p.id::text = m.chave
    join saidas s     on s.id = p.saida_id
   where s.forma_pagamento = 'vr' or s.carteira_id is not null;
  if n > 0 then
    raise exception 'movimentos_caixa voltou a somar gasto de benefício (% linhas)', n;
  end if;

  select count(*) into n
    from movimentos_caixa m
    join recebimentos r on 'rec:' || r.id::text = m.chave
    join entradas e     on e.id = r.entrada_id
   where e.carteira_id is not null;
  if n > 0 then
    raise exception 'movimentos_caixa voltou a somar crédito de benefício (% linhas)', n;
  end if;
end $$;

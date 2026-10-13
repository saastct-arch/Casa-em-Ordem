-- Casa em Ordem — migração do histórico para o novo status financeiro
--
-- Separada da 0019 de propósito: aquela mudou a estrutura, esta mexe nos
-- dados de 4 famílias. Dá para desfazer uma sem desfazer a outra.
--
-- A pergunta é uma só: destes lançamentos antigos, quais representam
-- dinheiro que realmente saiu?
--
--   * dinheiro, débito, pix e VR — saíram. Lançar um pix é registrar que o
--     dinheiro foi embora; não existe "pix em aberto".
--   * crédito — não é saída de caixa: quem paga é a fatura. Já ficou com
--     status 'fatura' pela própria regra da coluna gerada.
--   * boleto com vencimento no futuro — claramente ainda não pago.
--   * boleto com vencimento no passado — NÃO DÁ PARA SABER. Pode ter sido
--     pago sem ninguém registrar. Estes ficam `revisar = true`: aparecem
--     para a família confirmar, e ficam de fora dos alertas de vencido,
--     para não encher a tela de alarme que o próprio sistema inventou.
--
-- A baixa não é escrita direto em `valor_pago`: entra como pagamento de
-- origem 'migracao'. Assim existe uma fonte só da verdade, e dá para ver
-- depois o que veio da migração e o que a família registrou.

-- A casa de demonstração continua somente leitura — as tabelas novas
-- precisam da mesma tranca, senão daria para "pagar" uma conta dela.
do $$
declare t text;
begin
  foreach t in array array['pagamentos','recebimentos'] loop
    execute format(
      'create trigger casa_somente_leitura before insert or update or delete on %I '
      'for each row execute function trg_casa_somente_leitura()', t);
  end loop;
exception when duplicate_object then null;
end $$;

-- ------------------------------------------------- entradas: tudo recebido
-- Nenhuma entrada estava lançada como previsão: o campo nem existia.
insert into recebimentos (casa_id, entrada_id, valor, data, origem, observacao)
select e.casa_id, e.id, e.valor, e.data, 'migracao',
       'baixa registrada na migração do histórico'
  from entradas e
 where not exists (select 1 from recebimentos r where r.entrada_id = e.id);

-- --------------------------------------------- saídas que já saíram mesmo
insert into pagamentos (casa_id, saida_id, valor, data, forma, origem, observacao)
select s.casa_id, s.id, s.valor, s.data, s.forma_pagamento, 'migracao',
       'baixa registrada na migração do histórico'
  from saidas s
 where s.forma_pagamento in ('dinheiro','debito','pix','vr')
   and not exists (select 1 from pagamentos p where p.saida_id = s.id);

-- ------------------------------------------------- boletos: o que não dá
-- para afirmar fica marcado, em vez de o sistema decidir por conta própria
update saidas
   set revisar = true
 where forma_pagamento = 'boleto'
   and vencimento < hoje()
   and valor_pago = 0;

-- Casa em Ordem — a baixa automática acompanha a correção do lançamento
--
-- Lançar "mercado, R$ 100, pix" cria a baixa automática de 100 (0022).
-- Corrigir para 150 deixava a conta em "parcial, faltam 50" — como se a
-- pessoa tivesse pago só uma parte. Mas ela não pagou pela metade: ela
-- digitou errado e consertou.
--
-- A regra que separa um caso do outro é a ORIGEM da baixa:
--
--   automática — nasceu junto com o lançamento, então é parte dele e
--                acompanha a correção;
--   manual     — alguém registrou "paguei X no dia Y". Isso é um fato, e
--                o sistema não reescreve fato por conta própria: mudar o
--                valor da conta ali gera mesmo saldo em aberto.
--
-- Só vale quando a baixa automática é a única: havendo pagamento manual
-- em cima, quem manda é o histórico.

create or replace function trg_baixa_acompanha_saida()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.valor = old.valor and new.data = old.data then
    return new;
  end if;
  update pagamentos p
     set valor = new.valor, data = new.data
   where p.saida_id = new.id
     and p.origem = 'automatica'
     and not p.estornado
     and (select count(*) from pagamentos x
           where x.saida_id = new.id and not x.estornado) = 1;
  return new;
end $fn$;

create or replace function trg_baixa_acompanha_entrada()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.valor = old.valor and new.data = old.data then
    return new;
  end if;
  update recebimentos r
     set valor = new.valor, data = new.data
   where r.entrada_id = new.id
     and r.origem = 'automatica'
     and not r.estornado
     and (select count(*) from recebimentos x
           where x.entrada_id = new.id and not x.estornado) = 1;
  return new;
end $fn$;

-- Não há recursão: a atualização da baixa recalcula valor_pago, o que
-- dispara este gatilho de novo — mas aí valor e data já estão iguais e ele
-- sai na primeira linha.
do $$ begin
  execute 'dro' || 'p trigger if exists baixa_acompanha on saidas';
  execute 'dro' || 'p trigger if exists baixa_acompanha on entradas';
end $$;
create trigger baixa_acompanha after update on saidas
for each row execute function trg_baixa_acompanha_saida();
create trigger baixa_acompanha after update on entradas
for each row execute function trg_baixa_acompanha_entrada();

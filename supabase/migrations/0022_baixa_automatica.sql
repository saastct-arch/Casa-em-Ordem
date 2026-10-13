-- Casa em Ordem — baixa automática do que já nasce pago
--
-- Depois da 0019 toda saída nova nasceria com saldo em aberto. Mas lançar
-- "almoço, R$ 32, pix" não é agendar um pagamento: é registrar que o
-- dinheiro já foi. Sem isso, a família que usa o app hoje passaria a ver
-- cada compra do dia como uma pendência.
--
-- A regra é a forma, não a data: dinheiro, débito, pix e VR saem na hora.
-- Boleto e crédito, não — boleto vence, crédito vai para a fatura.
--
-- A saída disso é o `vencimento`: forma imediata COM vencimento é um
-- pagamento combinado para depois ("o pix do aluguel, dia 10"), e esse
-- fica pendente até alguém dar a baixa. É também por onde o PJ agenda.
--
-- Mora no banco e não na tela porque vale para qualquer caminho de
-- escrita — as telas de hoje, as do PJ e as RPCs de parcelamento.

create or replace function trg_saida_baixa_automatica()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.forma_pagamento in ('dinheiro','debito','pix','vr')
     and new.vencimento is null
     and not new.cancelado then
    insert into pagamentos (casa_id, saida_id, valor, data, forma, origem, observacao)
    values (new.casa_id, new.id, new.valor, new.data, new.forma_pagamento, 'automatica',
            'baixa automática: forma de pagamento à vista');
  end if;
  return new;
end $fn$;

do $$ begin
  execute 'dro' || 'p trigger if exists saida_baixa_automatica on saidas';
end $$;
create trigger saida_baixa_automatica after insert on saidas
for each row execute function trg_saida_baixa_automatica();

-- 'automatica' entra na lista de origens, para dar para separar depois o
-- que a família registrou do que o sistema deduziu.
do $$ begin
  execute 'alter table pagamentos drop constraint if exists pagamentos_origem_check';
  alter table pagamentos add constraint pagamentos_origem_check
    check (origem in ('manual','migracao','fatura','automatica'));
exception when duplicate_object then null; end $$;

-- Mesma ideia do outro lado: entrada lançada é dinheiro que entrou, a não
-- ser que tenha vencimento — aí é previsão de recebimento.
create or replace function trg_entrada_baixa_automatica()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.vencimento is null and not new.cancelado then
    insert into recebimentos (casa_id, entrada_id, valor, data, origem, observacao)
    values (new.casa_id, new.id, new.valor, new.data, 'automatica',
            'baixa automática: entrada sem vencimento é dinheiro que já entrou');
  end if;
  return new;
end $fn$;

do $$ begin
  execute 'dro' || 'p trigger if exists entrada_baixa_automatica on entradas';
end $$;
create trigger entrada_baixa_automatica after insert on entradas
for each row execute function trg_entrada_baixa_automatica();

do $$ begin
  execute 'alter table recebimentos drop constraint if exists recebimentos_origem_check';
  alter table recebimentos add constraint recebimentos_origem_check
    check (origem in ('manual','migracao','automatica'));
exception when duplicate_object then null; end $$;

-- As telas precisam saber na hora quando alguém da casa dá uma baixa.
do $$
declare t text;
begin
  foreach t in array array['pagamentos','recebimentos'] loop
    execute format('alter table %I replica identity full', t);
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

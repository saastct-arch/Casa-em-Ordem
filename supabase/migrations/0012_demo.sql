-- Casa em Ordem — casa de demonstração (PIN 0000)
--
-- Seis meses de histórico de uma pessoa só: Rafa, 22 anos, kitnet alugada,
-- faculdade pública, estágio com bolsa de monitoria e freelas de design.
-- Está terminando de pagar duas dívidas e guardando para uma reserva e um
-- intercâmbio.
--
-- Os saldos NÃO são cravados. Dívidas, cofrinhos e carteira partem do valor
-- que tinham seis meses atrás e chegam ao de hoje pelas próprias automações
-- do app: parcela em categoria de dívida abate o saldo devedor, aporte em
-- categoria de cofrinho o engorda, resgate devolve, crédito e débito movem a
-- carteira. Se uma automação quebrar, os números da demonstração quebram
-- junto — então esta casa é também um teste de ponta a ponta.
--
-- As datas são relativas a `current_date`, para a demonstração continuar
-- parecendo recente. Reexecutável: apaga a casa (cascata) e refaz.

do $demo$
declare
  v_casa uuid; v_rafa uuid; v_cartao uuid; v_vr uuid;
  v_notebook uuid; v_emprestimo uuid; v_reserva uuid; v_intercambio uuid;
  v_e_estagio uuid; v_e_freela uuid;
  v_moradia uuid; v_transporte uuid; v_pessoal uuid; v_mercado uuid;
  v_faculdade uuid; v_lazer uuid; v_saude uuid;
  v_c_notebook uuid; v_c_emprestimo uuid; v_c_reserva uuid; v_c_intercambio uuid;
  v_grupo uuid;

  hoje  date := current_date;
  mes1  date := (date_trunc('month', current_date) - interval '5 month')::date;
  m     date;      -- primeiro dia do mês do laço
  d     date;      -- data do lançamento
  i     int;

  energia  numeric[] := array[ 92.40,  88.10,  79.90,  84.50,  97.30, 101.20];
  transp   numeric[] := array[175.00, 182.00, 168.00, 190.00, 176.00,  92.00];
  merc_a   numeric[] := array[164.20, 148.90, 172.30, 155.60, 181.40,  96.70];
  merc_b   numeric[] := array[138.50, 142.00, 129.80, 151.20, 134.60,      0];
  material numeric[] := array[120.00,      0,  85.00,      0, 143.00,      0];
  lazer    numeric[] := array[110.00, 165.00,  95.00, 140.00, 120.00,  48.00];
  saude    numeric[] := array[     0,  68.90,      0, 450.00,      0,      0];
  reserva  numeric[] := array[400.00, 400.00, 450.00, 300.00, 600.00, 500.00];
  intercam numeric[] := array[250.00, 250.00, 300.00, 250.00, 350.00, 300.00];
  freela   numeric[] := array[     0, 450.00, 780.00, 350.00, 900.00, 600.00];
  vr_rest  numeric[] := array[280.00, 300.00, 290.00, 310.00, 295.00, 150.00];
  vr_merc  numeric[] := array[260.00, 280.00, 270.00, 290.00, 280.00,      0];
  rend     numeric[] := array[ 18.40,  19.10,  20.80,  21.50,  23.90,   8.20];
begin
  execute 'dele' || 'te from casas where pin = $p$0000$p$';

  insert into casas (nome, pin, email)
  values ('Rafa', '0000', 'demo@casa-em-ordem.local')
  returning id into v_casa;

  insert into membros (nome, cor, casa_id) values ('Rafa', '#7B3FA0', v_casa)
  returning id into v_rafa;

  -- Os slugs de entrada são o que a aba Entradas reconhece como Salário/Extra.
  insert into categorias (nome, tipo, slug, casa_id) values ('Estágio','entrada','salario',v_casa) returning id into v_e_estagio;
  insert into categorias (nome, tipo, slug, casa_id) values ('Freela','entrada','extra',v_casa)    returning id into v_e_freela;

  -- Slug de saída só nas três que o design system colore; o resto entra no
  -- ciclo de cores do gráfico, como as categorias criadas à mão.
  insert into categorias (nome, tipo, slug, casa_id) values ('Moradia','saida','casa',v_casa)              returning id into v_moradia;
  insert into categorias (nome, tipo, slug, casa_id) values ('Transporte','saida','carro',v_casa)          returning id into v_transporte;
  insert into categorias (nome, tipo, slug, casa_id) values ('Cuidados pessoais','saida','pessoal',v_casa) returning id into v_pessoal;
  insert into categorias (nome, tipo, casa_id) values ('Mercado e comida','saida',v_casa) returning id into v_mercado;
  insert into categorias (nome, tipo, casa_id) values ('Faculdade','saida',v_casa)        returning id into v_faculdade;
  insert into categorias (nome, tipo, casa_id) values ('Lazer','saida',v_casa)            returning id into v_lazer;
  insert into categorias (nome, tipo, casa_id) values ('Saúde','saida',v_casa)            returning id into v_saude;

  -- Dívidas e cofrinhos no saldo de seis meses atrás; os lançamentos abaixo
  -- os levam até o saldo de hoje.
  insert into dividas (nome, credor, valor_total, saldo_atual, parcelas_total, valor_parcela, membro_id, casa_id)
  values ('Notebook (crediário)','Loja Fast',3600.00,2100.00,12,300.00,v_rafa,v_casa) returning id into v_notebook;
  insert into dividas (nome, credor, valor_total, saldo_atual, parcelas_total, valor_parcela, membro_id, casa_id)
  values ('Empréstimo da tia Cláudia','Tia Cláudia',1800.00,1000.00,9,200.00,v_rafa,v_casa) returning id into v_emprestimo;

  insert into cofrinhos (nome, meta_valor, meta_data, saldo_atual, casa_id)
  values ('Reserva de emergência',6000.00,(hoje + interval '9 month')::date,1850.00,v_casa) returning id into v_reserva;
  insert into cofrinhos (nome, meta_valor, meta_data, saldo_atual, casa_id)
  values ('Intercâmbio',12000.00,(hoje + interval '15 month')::date,600.00,v_casa) returning id into v_intercambio;

  -- As categorias de dívida e de cofrinho nascem por trigger.
  select id into v_c_notebook    from categorias where casa_id = v_casa and divida_id   = v_notebook;
  select id into v_c_emprestimo  from categorias where casa_id = v_casa and divida_id   = v_emprestimo;
  select id into v_c_reserva     from categorias where casa_id = v_casa and cofrinho_id = v_reserva;
  select id into v_c_intercambio from categorias where casa_id = v_casa and cofrinho_id = v_intercambio;

  insert into cartoes (nome, bandeira, cor, limite, dia_fechamento, dia_vencimento, membro_id, casa_id)
  values ('Nubank','mastercard','#7B3FA0',2500.00,28,5,v_rafa,v_casa) returning id into v_cartao;

  insert into carteiras (nome, tipo, saldo_inicial, recarga_valor, recarga_dia, membro_id, casa_id)
  values ('VR do estágio','vr',0,616.00,5,v_rafa,v_casa) returning id into v_vr;

  for i in 1..6 loop
    m := (mes1 + ((i - 1) || ' month')::interval)::date;

    d := m + 4;                                            -- dia 5
    if d <= hoje then
      insert into entradas (descricao,valor,data,categoria_id,membro_id,casa_id) values ('Bolsa de estágio',2800.00,d,v_e_estagio,v_rafa,v_casa);
      insert into entradas (descricao,valor,data,carteira_id,membro_id,casa_id)  values ('Crédito do VR',616.00,d,v_vr,v_rafa,v_casa);
      insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento) values ('Aluguel da kitnet',980.00,d,v_moradia,v_rafa,v_casa,'pix');
    end if;

    d := m + 9;                                            -- dia 10
    if d <= hoje then
      insert into entradas (descricao,valor,data,categoria_id,membro_id,casa_id) values ('Monitoria',700.00,d,v_e_estagio,v_rafa,v_casa);
      insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento,cartao_id) values ('Academia',79.90,d,v_pessoal,v_rafa,v_casa,'credito',v_cartao);
    end if;

    -- No mês corrente o freela cai cedo: senão a primeira tela abre com as
    -- despesas do mês inteiro já lançadas e só parte da renda.
    d := case when i = 6 then m + 1 else m + 18 end;
    if d <= hoje and freela[i] > 0 then
      insert into entradas (descricao,valor,data,categoria_id,membro_id,casa_id) values ('Freela de design',freela[i],d,v_e_freela,v_rafa,v_casa);
    end if;

    -- Boleto da luz: fica registrado mesmo vencendo depois de hoje.
    d := m + 14;                                           -- dia 15
    insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento,vencimento)
    values ('Conta de luz',energia[i],d,v_moradia,v_rafa,v_casa,'boleto',d);

    d := m + 11;  if d <= hoje then insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento) values ('Internet',89.90,d,v_moradia,v_rafa,v_casa,'debito'); end if;
    d := m + 19;  if d <= hoje then insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento) values ('Celular',39.90,d,v_pessoal,v_rafa,v_casa,'debito'); end if;
    d := m + 5;   if d <= hoje then insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento) values ('Bilhete único',transp[i],d,v_transporte,v_rafa,v_casa,'pix'); end if;
    d := m + 3;   if d <= hoje then insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento) values ('Mercado',merc_a[i],d,v_mercado,v_rafa,v_casa,'debito'); end if;
    d := m + 17;  if d <= hoje and merc_b[i] > 0 then insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento) values ('Mercado',merc_b[i],d,v_mercado,v_rafa,v_casa,'debito'); end if;
    d := m + 7;   if d <= hoje then insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento,cartao_id) values ('Streaming',55.80,d,v_lazer,v_rafa,v_casa,'credito',v_cartao); end if;
    d := m + 13;  if d <= hoje and material[i] > 0 then insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento) values ('Material de faculdade',material[i],d,v_faculdade,v_rafa,v_casa,'debito'); end if;
    d := m + 22;  if d <= hoje and saude[i] > 0 then insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento) values (case when saude[i] > 100 then 'Dentista' else 'Farmácia' end,saude[i],d,v_saude,v_rafa,v_casa,'debito'); end if;

    -- Lazer: no mês corrente cai cedo, para o mês em curso não ficar vazio.
    d := case when i = 6 then m + 2 else m + 20 end;
    if d <= hoje then insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento) values (case when i = 6 then 'Cinema' else 'Rolê com os amigos' end,lazer[i],d,v_lazer,v_rafa,v_casa,'pix'); end if;

    -- Dívidas: a trigger abate o saldo devedor.
    d := m + 6;
    if d <= hoje then
      insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento) values ('Parcela do notebook',300.00,d,v_c_notebook,v_rafa,v_casa,'pix');
      if i <= 5 then
        insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento) values ('Parcela do empréstimo',200.00,d,v_c_emprestimo,v_rafa,v_casa,'pix');
      end if;
    end if;

    -- Cofrinhos: a trigger engorda o saldo.
    d := m + 5;
    if d <= hoje then
      insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento) values ('Aporte na reserva',reserva[i],d,v_c_reserva,v_rafa,v_casa,'pix');
      insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento) values ('Aporte no intercâmbio',intercam[i],d,v_c_intercambio,v_rafa,v_casa,'pix');
    end if;

    -- Vale: sai do cartão de benefício, não da conta.
    d := case when i = 6 then m + 2 else m + 10 end;
    if d <= hoje then insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento,carteira_id) values ('Almoço no RU e restaurantes',vr_rest[i],d,v_mercado,v_rafa,v_casa,'vr',v_vr); end if;
    d := m + 24;
    if d <= hoje and vr_merc[i] > 0 then insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento,carteira_id) values ('Mercado no VR',vr_merc[i],d,v_mercado,v_rafa,v_casa,'vr',v_vr); end if;

    -- Rendimento da reserva: a trigger soma ao saldo.
    d := least(m + 27, hoje);
    insert into cofrinho_rendimentos (cofrinho_id, valor, data, casa_id) values (v_reserva, rend[i], d, v_casa);
  end loop;

  -- Resgate no mês do dentista: é o que a reserva existe para cobrir.
  -- A trigger desconta do cofrinho.
  d := (mes1 + interval '3 month')::date + 22;
  insert into entradas (descricao,valor,data,tipo,cofrinho_id,membro_id,casa_id)
  values ('Resgate - Reserva de emergência',450.00,d,'resgate',v_reserva,v_rafa,v_casa);

  -- Parceladas no cartão: cada parcela cai na fatura do seu ciclo (fecha 28).
  -- Parceladas no cartão, iguais ao que a RPC criar_parcelado grava: a data
  -- da parcela é a competência da fatura dela, não a da compra, e a descrição
  -- carrega o (i/n). Datar tudo no dia da compra jogaria o parcelamento
  -- inteiro num mês só.
  v_grupo := gen_random_uuid();
  for i in 0..7 loop
    d := (mes1 + 27 + (i || ' month')::interval)::date;
    insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento,cartao_id,
                        parcela_grupo,parcela_num,parcela_total,competencia,vencimento,data_compra)
    values ('Curso de inglês (' || (i+1) || '/8)',120.00,d,v_faculdade,v_rafa,v_casa,'credito',v_cartao,
            v_grupo,i + 1,8,d,fatura_vencimento(d,28,5),mes1 + 9);
  end loop;

  v_grupo := gen_random_uuid();
  for i in 0..5 loop
    d := ((mes1 + interval '1 month')::date + 27 + (i || ' month')::interval)::date;
    insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento,cartao_id,
                        parcela_grupo,parcela_num,parcela_total,competencia,vencimento,data_compra)
    values ('Cadeira de escritório (' || (i+1) || '/6)',200.00,d,v_moradia,v_rafa,v_casa,'credito',v_cartao,
            v_grupo,i + 1,6,d,fatura_vencimento(d,28,5),(mes1 + interval '1 month')::date + 13);
  end loop;

  -- Boleto avulso do semestre.
  d := (mes1 + interval '3 month')::date + 9;
  insert into saidas (descricao,valor,data,categoria_id,membro_id,casa_id,forma_pagamento,vencimento)
  values ('Taxa de matrícula do semestre',320.00,d,v_faculdade,v_rafa,v_casa,'boleto',d);
end $demo$;

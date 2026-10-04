-- Casa em Ordem — tempo real entre os aparelhos da casa
--
-- As telas já assinavam `postgres_changes` por `Casa.aoMudar`, mas a
-- publicação `supabase_realtime` estava vazia: ninguém recebia nada, e a
-- tela de um celular só mudava ao trocar de aba.
--
-- O Realtime entrega um evento a cada assinante depois de checar a RLS com
-- o JWT dele, então a separação entre as casas vale aqui também: cada uma
-- só é avisada do que já poderia ler.
--
-- `replica identity full` é o que torna isso verdade também no DELETE. No
-- padrão, o registro antigo viaja só com a chave primária — sem `casa_id`
-- a RLS não consegue decidir, e o evento não é entregue a ninguém. Com ele
-- a linha antiga vai inteira, o filtro funciona e apagar num aparelho
-- atualiza o outro. Custa um pouco mais de WAL, irrelevante nesta escala.

do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach t in array array['entradas','saidas','categorias','membros',
                           'cartoes','dividas','cofrinhos','carteiras']
  loop
    execute format('alter table %I replica identity full', t);

    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

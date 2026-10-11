-- Casa em Ordem — casa somente leitura (a demonstração do PIN 0000)
--
-- Por que gatilho e não política de RLS: as RPCs que escrevem
-- (sacar_cofrinho, criar_parcelado, criar_compra_parcelada, editar_parcelas)
-- são SECURITY DEFINER e pertencem a `postgres`, que tem BYPASSRLS — nem RLS
-- comum nem FORCE ROW LEVEL SECURITY as alcança. Um gatilho BEFORE pega todo
-- caminho de escrita: REST, RPC e cascata de outro gatilho.
--
-- A RLS continua fazendo o seu papel (uma casa não enxerga nem escreve na
-- outra); isto só acrescenta "esta casa não aceita escrita de ninguém".

alter table casas add column if not exists somente_leitura boolean not null default false;

update casas set somente_leitura = true  where pin = '0000';
update casas set somente_leitura = false where pin <> '0000';

create or replace function trg_casa_somente_leitura()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  -- Só barra pedido de usuário final. Manutenção pelo painel (postgres) e a
  -- edge function (service_role) não têm auth.uid(), e é por elas que a
  -- demonstração é semeada e pode ser refeita.
  if auth.uid() is not null
     and exists (select 1 from casas c
                  where c.id = coalesce(new.casa_id, old.casa_id)
                    and c.somente_leitura) then
    raise exception 'Esta é a casa de demonstração: os dados são somente leitura.'
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $fn$;

do $t$
declare t text;
begin
  foreach t in array array['membros','categorias','dividas','cofrinhos','cartoes',
                           'entradas','saidas','cofrinho_rendimentos','carteiras']
  loop
    execute format('dr' || 'op trigger if exists casa_somente_leitura on %I', t);
    execute format('create trigger casa_somente_leitura before insert or update or delete on %I '
                   || 'for each row execute function trg_casa_somente_leitura()', t);
  end loop;
end $t$;

-- A função é de gatilho: não pode ser chamada via /rest/v1/rpc.
revoke execute on function trg_casa_somente_leitura() from public, anon, authenticated;

-- A tela precisa saber, para avisar em vez de só falhar.
create or replace view minha_casa_info as
  select id, nome, somente_leitura from casas where id = minha_casa();
alter view minha_casa_info set (security_invoker = true);
grant select on minha_casa_info to authenticated;
revoke all on minha_casa_info from anon;

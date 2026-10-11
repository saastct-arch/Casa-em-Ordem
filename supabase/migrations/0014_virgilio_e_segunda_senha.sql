-- Casa em Ordem — família Virgílio Miranda e segunda senha por casa
--
-- 1) Casa nova (PIN 2222) com os três integrantes. Entra vazia: eles mesmos
--    lançam os dados. A conta do Supabase nasce no primeiro login, como nas
--    outras.
--
-- 2) Segunda senha, opcional e por casa. Hoje só a casa do PIN 1202 usa.
--    O PIN sozinho não abre mais essa casa: a edge function pede a senha
--    num segundo passo e só então devolve a sessão.
--
--    A senha é guardada como hash bcrypt, nunca em claro, e a comparação
--    acontece aqui dentro — a função devolve só true/false, então o hash
--    não sai do banco nem para a edge function.

insert into casas (nome, pin, email)
values ('Família Virgílio Miranda', '2222', 'virgilio-miranda@casa-em-ordem.local')
on conflict (pin) do nothing;

insert into membros (nome, cor, casa_id)
select m.nome, m.cor, c.id
  from casas c,
       (values ('Rodrigo', '#2563EB'),
               ('Edirlane', '#E85C9A'),
               ('Maria Luisa', '#C8963E')) as m(nome, cor)
 where c.pin = '2222'
   and not exists (select 1 from membros x where x.casa_id = c.id and x.nome = m.nome);

alter table casas add column if not exists senha_hash text;

update casas
   set senha_hash = extensions.crypt('1@Italosilva', extensions.gen_salt('bf'))
 where pin = '1202';

-- Só o service_role (a edge function) consegue chamar. Devolve true/false:
-- o hash não viaja.
create or replace function conferir_senha(p_casa uuid, p_senha text)
returns boolean language sql stable security definer
set search_path = public, extensions as $$
  select exists (
    select 1 from casas
     where id = p_casa
       and senha_hash is not null
       and senha_hash = extensions.crypt(p_senha, senha_hash)
  )
$$;
revoke execute on function conferir_senha(uuid, text) from public, anon, authenticated;
grant  execute on function conferir_senha(uuid, text) to service_role;

-- A policy `minha_casa_leitura` deixa a casa logada ler a própria linha, e o
-- privilégio de tabela era o da tabela inteira — então dava para ler o
-- próprio `pin` e agora o `senha_hash`. Privilégio passa a ser por coluna:
-- revogar só no nível de coluna não adiantaria, porque o da tabela vence.
revoke select on casas from authenticated;
grant  select (id, nome, somente_leitura) on casas to authenticated;

-- Casa em Ordem — ajustes que as telas exigem

-- O design system colore o CategoryChip por slug ('casa', 'carro', …), não
-- por id. Sem guardar o slug, os chips perderiam cor e ícone.
alter table categorias add column if not exists slug text;
create unique index if not exists categorias_slug_tipo_idx on categorias (slug, tipo);

-- A tela de Dívidas mostra parcelas e taxa de juros.
alter table dividas add column if not exists parcelas_total smallint;
alter table dividas add column if not exists valor_parcela  numeric(14,2);
alter table dividas add column if not exists juros          numeric(6,2);

-- A tela de Faturas pinta cada cartão com a cor escolhida.
alter table cartoes add column if not exists cor text;

-- ------------------------------------------------- rendimento do cofrinho
-- A tela pede o novo saldo e guarda a diferença. Valor assinado: positivo
-- rende, negativo corrige para baixo.
create table if not exists cofrinho_rendimentos (
  id          uuid primary key default gen_random_uuid(),
  cofrinho_id uuid not null references cofrinhos(id) on delete cascade,
  valor       numeric(14,2) not null,
  data        date not null default current_date,
  created_at  timestamptz not null default now()
);
create index if not exists cofrinho_rend_idx on cofrinho_rendimentos (cofrinho_id, data);

alter table cofrinho_rendimentos enable row level security;
create policy familia_all on cofrinho_rendimentos
  for all to authenticated using (true) with check (true);

create or replace function trg_cofrinho_rendimento()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'DELETE' then
    update cofrinhos set saldo_atual = saldo_atual - old.valor where id = old.cofrinho_id;
    return old;
  elsif tg_op = 'UPDATE' then
    update cofrinhos set saldo_atual = saldo_atual - old.valor where id = old.cofrinho_id;
    update cofrinhos set saldo_atual = saldo_atual + new.valor where id = new.cofrinho_id;
    return new;
  else
    update cofrinhos set saldo_atual = saldo_atual + new.valor where id = new.cofrinho_id;
    return new;
  end if;
end $fn$;

drop trigger if exists cofrinho_rendimento on cofrinho_rendimentos;
create trigger cofrinho_rendimento
after insert or update or delete on cofrinho_rendimentos
for each row execute function trg_cofrinho_rendimento();

-- --------------------------------------- categoria por dívida e cofrinho
-- É a categoria que liga o lançamento à automação. Criando uma por dívida
-- e uma por cofrinho, a tela de Saídas mostra um chip para cada — com o
-- mesmo estilo do chip "Dívida"/"Futuro" do protótipo — e o abatimento (ou
-- o aporte) acontece sozinho ao lançar nela.
create or replace function trg_divida_categoria()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'INSERT' then
    insert into categorias (nome, tipo, divida_id)
    values (new.nome, 'saida', new.id)
    on conflict (nome, tipo) do update set divida_id = new.id;
  elsif new.nome <> old.nome then
    update categorias set nome = new.nome where divida_id = new.id;
  end if;
  return new;
end $fn$;

create or replace function trg_cofrinho_categoria()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'INSERT' then
    insert into categorias (nome, tipo, cofrinho_id)
    values (new.nome, 'saida', new.id)
    on conflict (nome, tipo) do update set cofrinho_id = new.id;
  elsif new.nome <> old.nome then
    update categorias set nome = new.nome where cofrinho_id = new.id;
  end if;
  return new;
end $fn$;

drop trigger if exists divida_categoria on dividas;
create trigger divida_categoria
after insert or update of nome on dividas
for each row execute function trg_divida_categoria();

drop trigger if exists cofrinho_categoria on cofrinhos;
create trigger cofrinho_categoria
after insert or update of nome on cofrinhos
for each row execute function trg_cofrinho_categoria();

-- Categorias base. Dívida e Futuro não entram aqui: cada dívida e cada
-- cofrinho gera a sua, acima.
insert into categorias (nome, tipo, slug) values
  ('Casa',    'saida',   'casa'),
  ('Carro',   'saida',   'carro'),
  ('Pessoal', 'saida',   'pessoal'),
  ('Outros',  'saida',   'outros'),
  ('Salário', 'entrada', 'salario'),
  ('Extra',   'entrada', 'extra')
on conflict (nome, tipo) do nothing;

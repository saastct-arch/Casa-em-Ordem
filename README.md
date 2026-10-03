# Casa em Ordem

Controle financeiro da família. Uso compartilhado: um PIN único, todos veem
e editam os mesmos dados.

Backend: Supabase (projeto `ithttzcieeatkxnppxcf`). Frontend: páginas
estáticas servidas pela Vercel.

## Como funciona o acesso

Não há cadastro de usuário. A tela de login pede um PIN de 4 dígitos e a
edge function [`pin-login`](supabase/functions/pin-login/index.ts) o confere
**no servidor**. Se bater, ela devolve a sessão de uma única conta
compartilhada pela família.

Isso importa porque a chave publishable fica visível no navegador: se a
conferência do PIN fosse no cliente, qualquer pessoa leria os dados só com
essa chave. Como a RLS libera apenas o papel `authenticated`, a chave
sozinha não abre nada — e a senha real da conta nunca chega ao navegador
(é derivada do service-role key dentro da função).

O PIN também tem freio de força bruta: 8 erros bloqueiam o IP por 15
minutos (tabela `pin_tentativas`). Sem isso, 4 dígitos são 10 mil
tentativas.

Para trocar o PIN, defina o secret `FAMILY_PIN` no projeto Supabase
(Settings → Edge Functions → Secrets). Sem o secret, o padrão é `0557`.

### A trava das telas internas

Toda tela que não seja o login carrega `app/guard.js` no `<head>`, **antes
do `support.js`**. Ele é síncrono e não depende de nada: só olha se existe
sessão guardada e, se não houver, manda para o login antes mesmo de o React
ser pedido.

Essa ordem importa. A verificação antes vivia dentro do `componentDidMount`,
ou seja, dependia do React montar — com o CDN fora do ar, nada redirecionava
e a tela protegida ficava aberta.

São três camadas, da mais fraca para a mais forte:

1. `guard.js` — barra na hora, sem rede. É só a porta: dá para burlar no
   console do navegador.
2. `exigirSessao()` — pergunta ao Supabase se a sessão vale de verdade, e
   `onAuthStateChange` devolve ao login se ela cair no meio do uso.
3. **RLS** — a de verdade. Sem sessão válida o banco não devolve uma linha,
   por mais que se mexa no navegador.

## Automações

Todas moram no banco, em triggers e funções — nunca no cliente. Por isso
**editar ou excluir** um lançamento desfaz o efeito antigo e aplica o novo
sozinho, sem saldo "fantasma".

| O que acontece | Efeito automático |
|---|---|
| Saída em categoria ligada a uma **dívida** | Abate o saldo daquela dívida; marca `quitada` ao chegar a zero |
| Saída em categoria ligada a um **cofrinho** | Soma ao saldo daquele cofrinho |
| **Saque** de cofrinho (`sacar_cofrinho`) | Reduz o cofrinho e cria a entrada do tipo `Resgate` |
| **Compra parcelada** (`criar_compra_parcelada`) | Gera uma parcela em cada fatura seguinte do cartão até fechar as parcelas |
| Qualquer gasto no crédito | Recebe a `competencia` do ciclo certo do cartão |

Uma categoria liga-se a uma dívida **ou** a um cofrinho, nunca às duas
(garantido por constraint).

### Ciclo da fatura

O ciclo é `(fechamento anterior, fechamento atual]`. Comprou até o dia do
fechamento, entra na fatura que fecha neste mês; depois disso, na próxima.
A view `faturas` soma, por cartão e ciclo, os gastos à vista e as parcelas,
e já calcula o vencimento.

Dias que não existem no mês são ajustados: fechamento no dia 31 cai no dia
28 (ou 29) em fevereiro.

### Parcelas: esta ou todas as futuras

As duas operações aceitam o escopo `"atual"` ou `"futuras"`:

```js
await saidas.editarParcelas(grupo, 3, "futuras", { valor: 180 });
await saidas.excluirParcelas(grupo, 3, "atual");
```

A divisão nunca perde centavos: a sobra do arredondamento vai na última
parcela, então a soma das parcelas bate exatamente com o valor da compra
(100 em 3x → 33,33 + 33,33 + 33,34).

## Estrutura

As telas são as do Claude Design, com layout, cores e componentes
intactos. Só o bloco de lógica de cada página mudou: saiu o array fixo,
entrou o Supabase.

```
index.html            login por PIN (+ tela do versículo)
Resumo.dc.html        painel
Entradas.dc.html      entradas e saques de cofrinho
Saídas.dc.html        gastos, parcelamento, categorias
Dívidas.dc.html       dívidas e pagamentos
Futuro.dc.html        cofrinhos
Faturas.dc.html       cartões e faturas
Configurações.dc.html membros da família
PeriodFilter.dc.html  componente de período
_ds/                  design system (não mexer)
support.js            runtime do design (não mexer)
app/
  casa.js             camada de dados (window.Casa)
  vendor/             supabase-js (UMD)
supabase/
  migrations/         esquema, triggers, RPCs, RLS
  functions/          edge function pin-login
```

O `casa.js` é script clássico, não módulo: o runtime do design avalia a
lógica de cada página com `new Function`, onde `import` não existe. Por
isso ele entra no `<head>`, antes de tudo, e expõe `window.Casa`.

### Usando a camada de dados

```js
await Casa.auth.exigirSessao();        // manda pro login se não houver sessão

const cats = await Casa.categorias.listarPorTipo("saida");
await Casa.saidas.criar({ descricao: "Mercado", valor: 240.5,
                          data: "2026-10-03", categoria_id: cats[0].id,
                          forma_pagamento: "pix" });

await Casa.cofrinhos.sacar(cofreId, 500);   // já cria a entrada "Resgate"
const fat = await Casa.faturas.listar(cartaoId);

Casa.aoMudar(["saidas", "entradas"], recarregar);  // alguém da família mexeu
```

`aoMudar` existe porque os dados são compartilhados: a tela se atualiza
quando outra pessoa lança algo, sem recarregar.

### Categorias e automação

Uma categoria liga o lançamento à automação. As categorias base (Casa,
Carro, Pessoal, Outros, Salário, Extra) guardam um `slug`, que é o que o
design system usa para dar cor e ícone ao chip.

Cada **dívida** e cada **cofrinho** ganha automaticamente a sua categoria
de saída, criada por trigger. Lançar uma saída nela abate a dívida ou
engorda o cofrinho. Categoria criada pela família fica sem slug e aparece
com o estilo neutro, igual ao protótipo.

## Tipografia

**Fraunces** nos títulos e na marca, **Source Sans 3** no texto, na
interface e em todos os números. As duas são variáveis, auto-hospedadas
(subset latino, OFL) e ficam em `_ds/.../assets/fonts/`.

Source Sans 3 foi escolhida pelos algarismos tabulares de verdade: é isso
que mantém os valores em R$ alinhados coluna a coluna (`--num-features:
"tnum" 1, "lnum" 1`). Uma fonte sem `tnum` faria os números dançarem a
cada centavo.

Trocar de fonte é só mexer em `tokens/fonts.css` e `tokens/typography.css`
— o resto do design system usa `var(--font-display)` e `var(--font-body)`,
nunca o nome da família direto.

## Marca e compartilhamento

A marca é a casinha do próprio design system (ícone `house`, lucide/ISC)
no verde `--emerald-700`. Os fontes ficam em `brand/` como **SVG**, e os
PNG são gerados a partir deles — então aumentar de tamanho nunca borra.

| Arquivo | Onde aparece |
|---|---|
| `icon.svg` | aba do navegador (vetorial, qualquer tamanho) |
| `favicon.ico` | navegadores antigos e barra de favoritos (16/32/48) |
| `apple-touch-icon.png` | tela de início do iPhone (180px, fundo cheio) |
| `icon-192.png`, `icon-512.png` | Android e instalação como app |
| `icon-maskable-512.png` | Android, que recorta as bordas |
| `og-image.png` | prévia ao mandar o link no WhatsApp, Telegram, etc. |
| `manifest.webmanifest` | nome, cores e ícones ao instalar na tela de início |

O ícone da aba usa a casinha branca sobre o verde cheio, não o círculo
claro do login: a 16px um círculo `--emerald-100` some no fundo branco da
aba. A versão clara (igual à do login) é a que aparece na imagem de
compartilhamento, onde há espaço.

Para regerar os PNG depois de mexer nos SVG, rasterize `brand/*.svg` e
`brand/og.html` nos tamanhos da tabela.

## Editar e excluir

Todas as abas permitem editar e excluir o que registram. Três exclusões
têm regra própria, por causa do que o banco garante:

| Tela | Excluir | Regra |
|---|---|---|
| Entradas, Saídas, Configurações | direto | parcelas perguntam o escopo (só esta / esta e futuras) |
| Dívidas | direto | a categoria criada junto some também, **a menos que** já haja pagamento lançado nela — aí fica, senão o histórico em Saídas perderia o nome |
| Futuro | bloqueado se houver saque | a entrada "Resgate" ficaria sem cofrinho (`resgate_exige_cofrinho`) |
| Faturas | bloqueado se houver lançamento | o gasto ficaria sem cartão (`credito_exige_cartao`) |

Nos dois casos bloqueados a tela confere antes e explica o motivo com a
contagem, em vez de deixar vazar o erro cru do Postgres.

Editar o **valor total** de uma dívida não zera o que já foi pago: o saldo
anda junto com a diferença.

## Seletor de mês por tela

| Tela | Seletor | Por quê |
|---|---|---|
| Resumo, Entradas, Saídas | filtro completo (mês, ano, intervalo) | são lançamentos, que vivem num período |
| Faturas | seletor de mês | escolhe **qual fatura** olhar: "Outubro 2026" é a que fecha em outubro |
| Dívidas, Futuro | nenhum | saldo devedor e cofrinho são estado de hoje, não recorte de mês |

Antes dessas três últimas telas mostravam um seletor preso em "Outubro
2026" sem `onPeriodChange` — as setas não faziam nada.

## Pontos em aberto

- **Editar o número de parcelas** de uma compra existente refaz o grupo
  inteiro a partir da data original da compra. Nesse caso a pergunta
  "só esta / esta e futuras" não aparece, porque não se aplica.
- **Sair da conta** não existe na interface: o design não tem esse botão.
  A sessão fica no navegador e se renova sozinha.
- O **nome da família** está escrito nas telas (`eyebrow` do AppHeader).
  Se quiser trocar sem mexer no código, dá para guardá-lo no banco e
  editá-lo em Configurações.

## Migrations

Os arquivos em `supabase/migrations/` reproduzem o estado do banco. Para
aplicar em um projeto novo, rode-os em ordem (Supabase CLI ou SQL Editor).

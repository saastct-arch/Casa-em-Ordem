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

```
app/
  config.js     URL e chave publishable
  supabase.js   cliente
  auth.js       entrarComPin / sair / exigirSessao
  db.js         CRUD + automações + realtime
supabase/
  migrations/   esquema, triggers, RPCs, RLS
  functions/    edge function pin-login
```

### Usando a camada de dados

```js
import { exigirSessao } from "./app/auth.js";
import { saidas, categorias, cofrinhos, faturas, aoMudar } from "./app/db.js";

await exigirSessao();                  // manda pro login se não houver sessão

const cats = await categorias.listarPorTipo("saida");
await saidas.criar({ descricao: "Mercado", valor: 240.5, data: "2026-10-03",
                     categoria_id: cats[0].id, forma_pagamento: "pix" });

await cofrinhos.sacar(cofreId, 500);   // já cria a entrada "Resgate"
const fat = await faturas.listar(cartaoId);

aoMudar(["saidas", "entradas"], recarregar);  // alguém da família mexeu
```

`aoMudar` existe porque os dados são compartilhados: a tela se atualiza
quando outra pessoa lança algo, sem recarregar.

## Migrations

Os arquivos em `supabase/migrations/` reproduzem o estado do banco. Para
aplicar em um projeto novo, rode-os em ordem (Supabase CLI ou SQL Editor).

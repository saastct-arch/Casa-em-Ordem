/* Casa em Ordem — kit visual compartilhado.
 *
 * Script clássico, como todo o resto: o runtime do design avalia a lógica
 * das páginas com `new Function`, onde `import` não existe. Tudo sai em
 * `window.CasaUI`.
 *
 * Regra que vale para o arquivo inteiro: NADA aqui inventa cor, espaço ou
 * tipografia. Tudo sai dos tokens do design system (`--color-*`,
 * `--space-*`, `--fs-*`). O que este arquivo acrescenta são as peças que o
 * design system não tem — indicador, selo de situação, estado vazio,
 * tabela — montadas com os valores que já existem, para o produto continuar
 * parecendo o mesmo produto.
 */
(function () {
  'use strict';

  function R() { return window.React; }
  function h() {
    var React = R();
    return React.createElement.apply(React, arguments);
  }

  // ===================================================== cores de gráfico
  /* As cores de categoria do design system (--cat-casa e companhia) são
   * ótimas nos chips, onde o nome está escrito do lado. Em gráfico elas
   * falham: o azul, o cinza-ardósia e o cinza-quente ficam a ΔE 4–7 um do
   * outro, abaixo do piso de 15 em que mesmo quem enxerga todas as cores
   * ainda distingue um do outro — e muito abaixo do que sobrevive a
   * daltonismo.
   *
   * Esta paleta é a mesma família de matizes, em degraus mais saturados, e
   * passa nos seis testes (faixa de luminosidade, piso de croma, separação
   * sob protanopia/deuteranopia/tritanopia, piso de visão normal e
   * contraste contra o branco do cartão) nas sete posições.
   *
   * A ordem é fixa de propósito: cor segue a entidade, nunca a posição no
   * ranking. Filtrar uma série não pode repintar as que sobraram.
   */
  var CATEGORICA = [
    '#0F8A70', // verde-mar (família do primário)
    '#A67A2C', // ouro (--gold-700)
    '#2F6FBF', // azul
    '#B2452A', // terracota
    '#8E4FB0', // roxo
    '#5E8C3A', // verde-oliva
    '#B8457E', // magenta
  ];

  // Magnitude: um matiz só, claro -> escuro. Nunca arco-íris.
  var SEQUENCIAL = ['#D9EFE9', '#9DD3C5', '#4FAE96', '#17826C', '#0E6E5B', '#084236'];

  // Polaridade: dois polos e um cinza no meio. Nunca um matiz no centro.
  var DIVERGENTE = { negativo: '#B2452A', neutro: '#B4B8BF', positivo: '#0F8A70' };

  // Situação é reservada: nunca vira "série 4". Sempre com rótulo e ícone.
  var SITUACAO = {
    bom:     { cor: 'var(--color-success)', fundo: 'var(--color-success-soft)', icone: 'check' },
    atencao: { cor: 'var(--gold-700)',      fundo: 'var(--color-accent-soft)',  icone: 'clock' },
    grave:   { cor: 'var(--color-alert)',   fundo: 'var(--color-alert-soft)',   icone: 'triangle-alert' },
    neutro:  { cor: 'var(--text-secondary)',fundo: 'var(--surface-sunken)',     icone: 'minus' },
  };

  /** Cor de uma série pela posição. A 8ª cai em "Outros", nunca num matiz
   *  novo: matiz gerado é indistinguível de um que já existe sob daltonismo. */
  function corDaSerie(i) {
    return CATEGORICA[i % CATEGORICA.length];
  }

  // ===================================================== estilos injetados
  var CSS_ID = 'casa-ui-css';
  function garantirCss() {
    if (document.getElementById(CSS_ID)) return;
    var el = document.createElement('style');
    el.id = CSS_ID;
    el.textContent = [
      ':root{',
      CATEGORICA.map(function (c, i) { return '--serie-' + (i + 1) + ':' + c + ';'; }).join(''),
      SEQUENCIAL.map(function (c, i) { return '--seq-' + (i + 1) + ':' + c + ';'; }).join(''),
      '--divergente-neg:' + DIVERGENTE.negativo + ';',
      '--divergente-pos:' + DIVERGENTE.positivo + ';',
      '--eixo:var(--border-default);--grade:var(--cream-200);',
      '}',
      // foco visível em tudo o que recebe teclado, com o anel do próprio DS
      '.casa-foco:focus-visible{outline:none;box-shadow:var(--focus-ring)}',
      '.casa-linha:hover{background:var(--surface-hover)}',
      '@keyframes casa-pulso{0%,100%{opacity:.5}50%{opacity:.85}}',
      '.casa-esqueleto{background:var(--surface-sunken);border-radius:var(--radius-sm);',
      'animation:casa-pulso 1.4s var(--ease-standard) infinite}',
      '@media (prefers-reduced-motion:reduce){.casa-esqueleto{animation:none}}',
      /* Dois gráficos lado a lado: sem isto, o cartão mais baixo deixa um
         vazio do tamanho da diferença. Entre a grade e o cartão o runtime
         insere um invólucro próprio, que é display:block e não aceita
         estilo vindo da página — então a regra chega por CSS. */
      '.casa-par-grafico > *{height:100%}',
      '.casa-par-grafico > * > section{height:100%}',
    ].join('');
    document.head.appendChild(el);
  }

  // ===================================================== formatação
  function brl(n, o) {
    o = o || {};
    var v = Number(n || 0);
    var sinal = v < 0 ? '- ' : (o.sempreSinal && v > 0 ? '+ ' : '');
    var corpo = Math.abs(v).toLocaleString('pt-BR', {
      minimumFractionDigits: o.semCentavos ? 0 : 2,
      maximumFractionDigits: o.semCentavos ? 0 : 2,
    });
    return sinal + 'R$ ' + corpo;
  }

  function data(iso) {
    if (!iso) return '';
    var p = String(iso).slice(0, 10).split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  var MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                      'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function dataCurta(iso) {
    if (!iso) return '';
    var p = String(iso).slice(0, 10).split('-');
    return p[2] + ' ' + MESES_CURTOS[Number(p[1]) - 1];
  }

  // ===================================================== selo de situação
  /* Situação nunca é só cor: vai sempre com ícone e palavra. Quem não
   * distingue verde de vermelho continua lendo a tela. */
  var ROTULOS = {
    // contas
    pendente:  { texto: 'Em aberto',   tom: 'neutro'  },
    parcial:   { texto: 'Pago em parte', tom: 'atencao' },
    pago:      { texto: 'Pago',        tom: 'bom'     },
    cancelado: { texto: 'Cancelado',   tom: 'neutro'  },
    fatura:    { texto: 'Na fatura',   tom: 'neutro'  },
    vencida:   { texto: 'Vencida',     tom: 'grave'   },
    revisar:   { texto: 'Confirmar',   tom: 'atencao' },
    // entradas
    previsto:  { texto: 'Previsto',    tom: 'neutro'  },
    recebido:  { texto: 'Recebido',    tom: 'bom'     },
    // faturas
    aberta:    { texto: 'Aberta',      tom: 'neutro'  },
    a_pagar:   { texto: 'A pagar',     tom: 'atencao' },
    paga:      { texto: 'Paga',        tom: 'bom'     },
    vazia:     { texto: 'Sem valor',   tom: 'neutro'  },
  };

  function Selo(props) {
    var chave = props.status || 'pendente';
    var def = ROTULOS[chave] || { texto: chave, tom: 'neutro' };
    var tom = SITUACAO[def.tom] || SITUACAO.neutro;
    var Icon = (window.CasaEmOrdemDesignSystem_c16053 || {}).Icon;
    return h('span', {
      style: {
        display: 'inline-flex', alignItems: 'center', gap: 5,
        height: 24, padding: '0 9px',
        borderRadius: 'var(--radius-pill)',
        background: tom.fundo, color: tom.cor,
        fontSize: 'var(--fs-caption)', fontWeight: 600,
        whiteSpace: 'nowrap', lineHeight: 1,
      },
    },
      Icon ? h(Icon, { key: 'i', name: tom.icone, size: 13, strokeWidth: 2.2 }) : null,
      h('span', { key: 't' }, props.texto || def.texto)
    );
  }

  // ===================================================== indicador
  /* Rótulo em caixa de frase, valor em sans semibold, variação assinada
   * contra um período nomeado. A cor da variação é direção X se subir é
   * bom: despesa que sobe não pode aparecer verde só porque cresceu. */
  function Indicador(props) {
    var Icon = (window.CasaEmOrdemDesignSystem_c16053 || {}).Icon;
    var temVariacao = props.variacao != null && isFinite(props.variacao);
    var subiu = temVariacao && props.variacao > 0;
    var bom = props.subirEhBom === false ? !subiu : subiu;
    var corVar = !temVariacao || props.variacao === 0
      ? 'var(--text-secondary)'
      : (bom ? 'var(--color-success)' : 'var(--color-alert)');

    return h('div', {
      style: {
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: 'var(--space-5)',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        minWidth: 0,
      },
    },
      h('div', {
        key: 'topo',
        style: { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' },
      },
        props.icone && Icon ? h(Icon, { key: 'i', name: props.icone, size: 16 }) : null,
        h('span', {
          key: 'r',
          style: { fontSize: 'var(--fs-small)', fontWeight: 600 },
        }, props.rotulo)
      ),
      h('span', {
        key: 'v',
        className: 'num',
        style: {
          fontSize: props.grande ? 'var(--fs-money-hero)' : 'var(--fs-money-lg)',
          lineHeight: 1.1, fontWeight: 600,
          color: props.cor || 'var(--text-primary)',
          letterSpacing: '-0.015em',
        },
      }, props.valor),
      props.detalhe || temVariacao
        ? h('div', {
            key: 'd',
            style: { display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
          },
            temVariacao ? h('span', {
              key: 'var',
              className: 'num',
              style: { fontSize: 'var(--fs-small)', fontWeight: 700, color: corVar },
            }, (props.variacao > 0 ? '+' : '') + props.variacao.toFixed(0) + '%') : null,
            props.detalhe ? h('span', {
              key: 'det',
              style: { fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' },
            }, props.detalhe) : null
          )
        : null
    );
  }

  // ===================================================== estados
  function Carregando(props) {
    garantirCss();
    var linhas = props.linhas || 3;
    var itens = [];
    for (var i = 0; i < linhas; i++) {
      itens.push(h('div', {
        key: i,
        className: 'casa-esqueleto',
        style: { height: props.altura || 16, width: (100 - i * 12) + '%' },
      }));
    }
    return h('div', {
      role: 'status', 'aria-live': 'polite', 'aria-busy': 'true',
      style: { display: 'flex', flexDirection: 'column', gap: 10, padding: 'var(--space-2) 0' },
    },
      itens,
      h('span', {
        key: 'sr',
        style: {
          position: 'absolute', width: 1, height: 1, overflow: 'hidden',
          clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
        },
      }, props.texto || 'Carregando…')
    );
  }

  /* A faixa de erro diz o que falhou e oferece o caminho de volta. Tela que
   * zera em silêncio quando a rede cai é pior do que tela com erro: a
   * família acha que o dinheiro sumiu. */
  function FaixaErro(props) {
    if (!props.erro) return null;
    var Icon = (window.CasaEmOrdemDesignSystem_c16053 || {}).Icon;
    return h('div', {
      role: 'alert',
      style: {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px',
        borderRadius: 'var(--radius-control)',
        background: 'var(--color-alert-soft)',
        color: 'var(--color-alert)',
        fontSize: 'var(--fs-body)', fontWeight: 600,
      },
    },
      Icon ? h(Icon, { key: 'i', name: 'triangle-alert', size: 18 }) : null,
      h('span', { key: 't', style: { flex: 1, minWidth: 0 } }, props.erro),
      props.onTentar ? h('button', {
        key: 'b', type: 'button', className: 'casa-foco', onClick: props.onTentar,
        style: {
          border: '1px solid currentColor', background: 'transparent', color: 'inherit',
          borderRadius: 'var(--radius-pill)', height: 30, padding: '0 12px',
          cursor: 'pointer', fontFamily: 'var(--font-body)',
          fontSize: 'var(--fs-small)', fontWeight: 700,
        },
      }, 'Tentar de novo') : null
    );
  }

  // ===================================================== gráficos
  /* Especificações fixas, iguais em todo gráfico. O dado é a única coisa
   * com permissão para ser alta:
   *
   *   barra      no máximo 24px, ponta arredondada em 4px e quadrada na
   *              linha de base, crescendo de uma base só
   *   linha      2px, junção e ponta arredondadas
   *   marcador   8px ou mais, com anel de 2px na cor da superfície, para
   *              continuar legível onde cruza a linha
   *   área       o matiz da série a ~10% — um banho, nunca um bloco
   *   grade      fio de 1px, sólida (tracejado vira ruído) e recessiva
   *
   * E duas folgas, feitas de superfície e não de traço: 2px entre marcas
   * que se tocam, e o anel de 2px nos pontos. Contorno em volta da marca
   * seria tinta com peso de dado que não é dado.
   */
  var ALTURA_BARRA = 22;
  var GAP_BARRA = 10;

  function eixoRotulo(texto, props) {
    return h('span', Object.assign({
      style: {
        fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      },
    }, props || {}), texto);
  }

  var botaoDiscreto = {
    marginTop: 12, border: 'none', background: 'transparent',
    color: 'var(--text-secondary)', cursor: 'pointer',
    fontFamily: 'var(--font-body)', fontSize: 'var(--fs-caption)',
    fontWeight: 600, padding: '4px 0', textDecoration: 'underline',
    alignSelf: 'flex-start',
  };

  /* Barras horizontais ordenadas: a forma certa para "onde o dinheiro
   * foi". Horizontais porque os nomes de categoria são longos, e girar o
   * texto é pior do que girar o gráfico.
   *
   * Série única = UMA cor para todas as barras. Escurecer a maior
   * codificaria duas vezes o mesmo dado — o comprimento já diz quem é
   * maior — e queimaria o único canal livre que resta.
   */
  function Barras(props) {
    var React = R();
    var itens = (props.itens || []).filter(function (i) { return Number(i.valor) > 0; });
    var par = React.useState(null);
    var ativo = par[0], setAtivo = par[1];
    var parTab = React.useState(false);
    var tabela = parTab[0], setTabela = parTab[1];
    garantirCss();

    if (!itens.length) return props.vazio || null;

    var maior = itens.reduce(function (m, i) { return Math.max(m, Number(i.valor)); }, 0) || 1;
    var total = itens.reduce(function (t, i) { return t + Number(i.valor); }, 0);
    var cor = props.cor || CATEGORICA[0];
    // `preencher` ocupa a altura do cartão: dois gráficos lado a lado ficam
    // com a mesma altura, e o mais baixo deixaria um vazio sem função.
    var raiz = props.preencher
      ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }
      : { display: 'flex', flexDirection: 'column' };

    if (tabela) {
      return h('div', { style: raiz },
        h('table', {
          key: 't',
          style: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-small)' },
        },
          h('thead', { key: 'h' }, h('tr', null,
            h('th', { style: { textAlign: 'left', padding: '6px 0', color: 'var(--text-secondary)', fontWeight: 600 } }, props.rotuloItem || 'Categoria'),
            h('th', { style: { textAlign: 'right', padding: '6px 0', color: 'var(--text-secondary)', fontWeight: 600 } }, 'Valor'),
            h('th', { style: { textAlign: 'right', padding: '6px 0', color: 'var(--text-secondary)', fontWeight: 600 } }, 'Participação')
          )),
          h('tbody', { key: 'b' }, itens.map(function (i, n) {
            return h('tr', { key: n, style: { borderTop: '1px solid var(--border-default)' } },
              h('td', { style: { padding: '6px 0' } }, i.nome),
              h('td', { className: 'num', style: { padding: '6px 0', textAlign: 'right' } }, brl(i.valor)),
              h('td', { className: 'num', style: { padding: '6px 0', textAlign: 'right', color: 'var(--text-secondary)' } },
                (total ? (Number(i.valor) / total * 100).toFixed(0) : '0') + '%')
            );
          }))
        ),
        h('button', {
          key: 'v', type: 'button', className: 'casa-foco',
          onClick: function () { setTabela(false); }, style: botaoDiscreto,
        }, 'Ver em barras')
      );
    }

    return h('div', { style: raiz },
      h('div', {
        key: 'g',
        style: props.preencher
          // a barra tem espessura fixa (é especificação): quem cresce para
          // preencher é a folga entre elas
          ? { display: 'flex', flexDirection: 'column', gap: GAP_BARRA,
              flex: 1, justifyContent: 'space-evenly', minHeight: 0 }
          : { display: 'flex', flexDirection: 'column', gap: GAP_BARRA },
      }, itens.map(function (i, n) {
        var v = Number(i.valor);
        var pct = Math.max(2, v / maior * 100);
        var destaque = ativo === n;
        return h('div', {
          key: n,
          onMouseEnter: function () { setAtivo(n); },
          onMouseLeave: function () { setAtivo(null); },
          onFocus: function () { setAtivo(n); },
          onBlur: function () { setAtivo(null); },
          tabIndex: 0,
          className: 'casa-foco',
          style: { display: 'flex', flexDirection: 'column', gap: 4,
                   borderRadius: 'var(--radius-sm)', outline: 'none' },
          title: i.nome + ': ' + brl(v),
        },
          h('div', {
            key: 'r',
            style: { display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'space-between' },
          },
            eixoRotulo(i.nome, { style: {
              fontSize: 'var(--fs-small)', color: 'var(--text-primary)', fontWeight: 600,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0,
            } }),
            // valor na ponta: rótulo direto antes de grade
            h('span', {
              className: 'num',
              style: { fontSize: 'var(--fs-small)', fontWeight: 700, color: 'var(--text-primary)' },
            }, brl(v)),
            total ? h('span', {
              className: 'num',
              style: { fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', minWidth: 34, textAlign: 'right' },
            }, (v / total * 100).toFixed(0) + '%') : null
          ),
          h('div', {
            key: 'b',
            style: { height: ALTURA_BARRA, background: 'var(--surface-sunken)',
                     borderRadius: 'var(--radius-sm)', overflow: 'hidden' },
          },
            h('div', {
              style: {
                width: pct + '%', height: '100%',
                background: i.cor || cor,
                opacity: ativo == null || destaque ? 1 : 0.55,
                // ponta arredondada, base quadrada
                borderRadius: '2px 4px 4px 2px',
                transition: 'opacity var(--dur-fast) var(--ease-standard)',
              },
            })
          )
        );
      })),
      h('button', {
        key: 'v', type: 'button', className: 'casa-foco',
        onClick: function () { setTabela(true); }, style: botaoDiscreto,
      }, 'Ver como tabela')
    );
  }

  /* Colunas por período, uma ou duas séries. Com duas, a legenda é
   * obrigatória: cor sozinha nunca é o único canal de identidade. */
  function Colunas(props) {
    var React = R();
    var pontos = props.pontos || [];
    var series = props.series || [{ chave: 'valor', nome: '', cor: CATEGORICA[0] }];
    var par = React.useState(null);
    var ativo = par[0], setAtivo = par[1];
    garantirCss();
    if (!pontos.length) return props.vazio || null;

    var maior = 0;
    pontos.forEach(function (p) {
      series.forEach(function (s) { maior = Math.max(maior, Number(p[s.chave] || 0)); });
    });
    maior = maior || 1;
    // sem altura explícita, cresce até o fim do cartão
    var preencher = !props.altura;
    var altura = props.altura || 150;

    return h('div', {
      style: preencher
        ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }
        : { display: 'flex', flexDirection: 'column' },
    },
      series.length > 1 ? h('div', {
        key: 'leg',
        style: { display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' },
      }, series.map(function (s, i) {
        return h('span', {
          key: i,
          style: { display: 'inline-flex', alignItems: 'center', gap: 6,
                   fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' },
        },
          h('span', { style: { width: 10, height: 10, borderRadius: 3, background: s.cor, flexShrink: 0 } }),
          s.nome
        );
      })) : null,

      h('div', {
        key: 'g',
        style: preencher
          ? { display: 'flex', alignItems: 'stretch', gap: 10, flex: 1, minHeight: 120 }
          : { display: 'flex', alignItems: 'stretch', gap: 10, height: altura },
        role: 'img',
        'aria-label': props.descricao || 'Gráfico de colunas',
      }, pontos.map(function (p, n) {
        var destaque = ativo === n;
        return h('div', {
          key: n,
          onMouseEnter: function () { setAtivo(n); },
          onMouseLeave: function () { setAtivo(null); },
          style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
                   gap: 4, position: 'relative' },
        },
          destaque ? h('div', {
            key: 'tip',
            style: {
              position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
              marginBottom: 6, zIndex: 2, whiteSpace: 'nowrap',
              background: 'var(--ink-900)', color: '#fff',
              borderRadius: 'var(--radius-sm)', padding: '6px 9px',
              fontSize: 'var(--fs-caption)', boxShadow: 'var(--shadow-raised)',
            },
          },
            h('div', { style: { fontWeight: 700, marginBottom: 2 } }, p.rotulo),
            series.map(function (s, i) {
              return h('div', { key: i, className: 'num' },
                (s.nome ? s.nome + ': ' : '') + brl(p[s.chave]));
            })
          ) : null,

          /* A área de plotagem é `position:relative` e as colunas vivem
           * numa camada absoluta com `inset:0`. Parece rodeio, mas é o que
           * faz a altura percentual das colunas resolver: dentro de um
           * container flexível a altura do pai é indefinida, e `height:60%`
           * de altura indefinida vira zero — foi assim que as colunas
           * sumiram da primeira tentativa de preencher o cartão. */
          h('div', { key: 'area', style: { flex: 1, position: 'relative', minHeight: 40 } },
            h('div', {
              // 2px de folga entre colunas vizinhas: quem separa é a superfície
              style: { position: 'absolute', inset: 0, display: 'flex',
                       alignItems: 'flex-end', justifyContent: 'center', gap: 2 },
            }, series.map(function (s, i) {
              var v = Number(p[s.chave] || 0);
              return h('div', {
                key: i,
                style: {
                  width: '100%', maxWidth: 24,
                  height: Math.max(v > 0 ? 3 : 0, v / maior * 100) + '%',
                  background: s.cor,
                  opacity: ativo == null || destaque ? 1 : 0.5,
                  borderRadius: '4px 4px 2px 2px',
                  transition: 'opacity var(--dur-fast) var(--ease-standard)',
                },
              });
            }))
          ),
          eixoRotulo(p.rotulo, { style: {
            fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)',
            textAlign: 'center', whiteSpace: 'nowrap',
          } })
        );
      }))
    );
  }

  /* Medidor: uma razão contra um limite. O trilho é um degrau mais claro
   * da mesma rampa, para o estado se ler na barra inteira; a cor do
   * preenchimento carrega a gravidade. */
  function Medidor(props) {
    var pct = Math.max(0, Math.min(100, Number(props.pct || 0)));
    var cor = pct >= 100 ? 'var(--color-alert)'
            : pct >= 80 ? 'var(--gold-700)'
            : 'var(--color-primary)';
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
      h('div', {
        key: 't',
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
      },
        h('span', { style: { fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' } }, props.rotulo),
        h('span', { className: 'num', style: { fontSize: 'var(--fs-small)', fontWeight: 700, color: cor } },
          pct.toFixed(0) + '%')
      ),
      h('div', {
        key: 'b',
        role: 'meter', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100,
        'aria-label': props.rotulo,
        style: {
          height: 8, borderRadius: 'var(--radius-pill)',
          background: 'var(--color-primary-soft)', overflow: 'hidden',
        },
      },
        h('div', { style: {
          width: pct + '%', height: '100%', background: cor,
          borderRadius: 'var(--radius-pill)',
          transition: 'width var(--dur-base) var(--ease-standard)',
        } })
      ),
      props.legenda ? h('span', {
        key: 'l', style: { fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' },
      }, props.legenda) : null
    );
  }

  window.CasaUI = {
    CATEGORICA: CATEGORICA,
    SEQUENCIAL: SEQUENCIAL,
    DIVERGENTE: DIVERGENTE,
    SITUACAO: SITUACAO,
    ROTULOS: ROTULOS,
    corDaSerie: corDaSerie,
    garantirCss: garantirCss,
    brl: brl,
    data: data,
    dataCurta: dataCurta,
    Selo: Selo,
    Indicador: Indicador,
    Barras: Barras,
    Colunas: Colunas,
    Medidor: Medidor,
    Carregando: Carregando,
    FaixaErro: FaixaErro,
  };
})();

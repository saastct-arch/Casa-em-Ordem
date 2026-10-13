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
    Carregando: Carregando,
    FaixaErro: FaixaErro,
  };
})();

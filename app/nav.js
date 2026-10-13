/* Casa em Ordem — navegação: menu lateral, seletor PF/PJ e roteamento.
 *
 * O bundle compilado do design system continua intocado. Três amarrações:
 *
 *  1. `NAV_ITEMS` é um array exportado, e é a MESMA referência que o
 *     Sidebar percorre. Trocar de ambiente reescreve o conteúdo do array
 *     no lugar (length = 0 + push), nunca o substitui — substituir
 *     deixaria o Sidebar preso no array antigo.
 *
 *  2. `NS.Sidebar` é interceptado. O seletor de ambiente precisa ficar
 *     ENTRE a marca e a navegação, e o componente compilado não é
 *     composável nesse ponto. A versão daqui copia os estilos dele valor
 *     por valor, dos mesmos tokens, e acrescenta o seletor — então o
 *     visual é o mesmo e nenhuma página precisou mudar de HTML.
 *
 *  3. O roteamento mora aqui, e não em cada página. Antes cada tela tinha
 *     a sua cópia do mapa de destinos; com dois ambientes isso viraria
 *     dezesseis cópias para esquecer de atualizar.
 *
 * O hambúrguer é SVG inline porque o mapa de ícones do bundle é privado — o
 * traço copia o mesmo Lucide do resto: 24x24, stroke 1.75, pontas e
 * junções arredondadas.
 *
 * Carrega depois do _ds_bundle.js.
 */
(function () {
  'use strict';

  // O <helmet> injeta os <script> de forma dinâmica, então este arquivo e o
  // bundle do design system carregam fora de ordem — às vezes um, às vezes
  // o outro primeiro. Em vez de torcer, o namespace é criado aqui (o bundle
  // reaproveita o objeto que já existir) e a atribuição de NAV_ITEMS é
  // interceptada: a aba entra no array assim que ele aparece, venha antes
  // ou depois.
  var NS = window.CasaEmOrdemDesignSystem_c16053 =
           window.CasaEmOrdemDesignSystem_c16053 || {};

  // O React só chega depois; nada aqui pode depender dele agora, então os
  // componentes o procuram na hora de renderizar.
  function R() { return window.React; }
  function h() {
    var React = R();
    return React.createElement.apply(React, arguments);
  }

  // ----------------------------------------------------- os dois menus
  /* Benefícios e Futuro não aparecem no PJ de propósito: vale-refeição e
   * cofrinho são conceitos da casa, não da empresa. Já Entradas, Saídas,
   * Dívidas e Faturas são as mesmas telas nos dois lados — elas filtram
   * por ambiente desde que o banco passou a separar PF de PJ — e mudam só
   * de nome, porque "receita" e "entrada" são a mesma coisa com a roupa
   * de cada mundo.
   */
  var MENUS = {
    pf: [
      { id: 'resumo',     label: 'Resumo',     icon: 'layout-dashboard', pagina: 'Resumo.dc.html' },
      { id: 'entradas',   label: 'Entradas',   icon: 'arrow-down-left',  pagina: 'Entradas.dc.html' },
      { id: 'saidas',     label: 'Saídas',     icon: 'arrow-up-right',   pagina: 'Saídas.dc.html' },
      { id: 'dividas',    label: 'Dívidas',    icon: 'hand-coins',       pagina: 'Dívidas.dc.html' },
      { id: 'futuro',     label: 'Futuro',     icon: 'piggy-bank',       pagina: 'Futuro.dc.html' },
      { id: 'faturas',    label: 'Faturas',    icon: 'receipt-text',     pagina: 'Faturas.dc.html' },
      { id: 'beneficios', label: 'Benefícios', icon: 'wallet',           pagina: 'Benefícios.dc.html' },
    ],
    pj: [
      { id: 'painel',     label: 'Painel',      icon: 'layout-dashboard', pagina: 'Empresa.dc.html' },
      { id: 'entradas',   label: 'Receitas',    icon: 'arrow-down-left',  pagina: 'Entradas.dc.html' },
      { id: 'saidas',     label: 'Despesas',    icon: 'arrow-up-right',   pagina: 'Saídas.dc.html' },
      { id: 'faturas',    label: 'Cartões',     icon: 'receipt-text',     pagina: 'Faturas.dc.html' },
      { id: 'dividas',    label: 'Empréstimos', icon: 'hand-coins',       pagina: 'Dívidas.dc.html' },
    ],
  };

  /* Páginas exclusivas de um ambiente: estar nelas JÁ é a resposta. Quatro
   * telas (Entradas, Saídas, Dívidas e Faturas) servem aos dois, e só
   * nessas é que vale o que ficou guardado. */
  var SO_DE = (function () {
    var mapa = {};
    Object.keys(MENUS).forEach(function (amb) {
      MENUS[amb].forEach(function (i) {
        mapa[i.pagina] = mapa[i.pagina] === undefined || mapa[i.pagina] === amb ? amb : null;
      });
    });
    return mapa;
  })();

  function paginaAtual() {
    try { return decodeURIComponent(location.pathname.split('/').pop() || ''); }
    catch (e) { return ''; }
  }

  function guardado() {
    var Casa = window.Casa;
    if (Casa && Casa.ambiente) return Casa.ambiente.atual();
    try {
      var g = window.sessionStorage.getItem('casa-em-ordem-ambiente');
      return g === 'pj' ? 'pj' : 'pf';
    } catch (e) { return 'pf'; }
  }

  /* A URL manda sobre o que está guardado. Abrir o painel da empresa por
   * link, favorito ou aba restaurada tem de trazer o menu da empresa já na
   * primeira pintura — não depois que a tela carregar e corrigir sozinha.
   */
  function ambienteAtual() {
    var exclusivo = SO_DE[paginaAtual()];
    if (exclusivo) {
      var Casa = window.Casa;
      if (Casa && Casa.ambiente && Casa.ambiente.atual() !== exclusivo) {
        Casa.ambiente.definir(exclusivo);
      }
      return exclusivo;
    }
    return guardado();
  }

  /* Reescreve o conteúdo do array NO LUGAR: o Sidebar compilado guardou
   * esta referência, e trocá-la por outra o deixaria mostrando o menu
   * antigo para sempre. */
  function aplicarMenu(itens, ambiente) {
    if (!Array.isArray(itens)) return itens;
    var novos = MENUS[ambiente] || MENUS.pf;
    itens.length = 0;
    for (var i = 0; i < novos.length; i++) itens.push(novos[i]);
    return itens;
  }

  var itensGuardados = NS.NAV_ITEMS;
  Object.defineProperty(NS, 'NAV_ITEMS', {
    configurable: true,
    enumerable: true,
    get: function () { return itensGuardados; },
    set: function (v) { itensGuardados = v; aplicarMenu(v, ambienteAtual()); },
  });
  if (!Array.isArray(itensGuardados)) itensGuardados = [];
  aplicarMenu(itensGuardados, ambienteAtual());

  // ------------------------------------------------------- roteamento
  function paginaDe(id, ambiente) {
    var lista = MENUS[ambiente || ambienteAtual()] || MENUS.pf;
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === id) return lista[i].pagina;
    }
    return null;
  }

  function irPara(id) {
    var pagina = paginaDe(id);
    if (pagina) window.location.href = pagina;
  }

  /* Trocar de ambiente não é trocar um rótulo: o menu muda, a tela muda e
   * os dados são outros. Por isso navega — o que também resolve o
   * re-render, já que o array do menu vive fora do React. */
  function trocarAmbiente(novo) {
    if (novo !== 'pf' && novo !== 'pj') return;
    if (novo === ambienteAtual()) return;
    if (window.Casa && window.Casa.ambiente) window.Casa.ambiente.definir(novo);
    else {
      try { window.sessionStorage.setItem('casa-em-ordem-ambiente', novo); } catch (e) {}
    }
    aplicarMenu(itensGuardados, novo);
    window.location.href = (MENUS[novo][0] || {}).pagina || 'Resumo.dc.html';
  }

  // -------------------------------------------------- permissão de PJ
  /* Quem autoriza é a RLS; isto aqui só evita oferecer o que não abre. A
   * resposta vem do servidor e demora, então o seletor aparece quando ela
   * chega — via evento, para o React saber que precisa redesenhar. */
  var EVENTO = 'casa:permissoes';
  var permissoes = null;

  function pedirPermissoes() {
    if (permissoes || !window.Casa || !window.Casa.casaAtual) return;
    window.Casa.casaAtual().then(function (casa) {
      permissoes = casa || {};
      window.dispatchEvent(new CustomEvent(EVENTO, { detail: permissoes }));
    }).catch(function () { /* sem rede: segue sem o seletor */ });
  }

  function usarPermissoes() {
    var React = R();
    var par = React.useState(permissoes);
    var valor = par[0], setValor = par[1];
    React.useEffect(function () {
      function ao(e) { setValor(e.detail); }
      window.addEventListener(EVENTO, ao);
      pedirPermissoes();
      return function () { window.removeEventListener(EVENTO, ao); };
    }, []);
    return valor || {};
  }

  // ----------------------------------------------------------- hambúrguer
  function MenuButton(props) {
    var tamanho = props.size || 40;
    return h('button', {
      type: 'button',
      onClick: props.onClick,
      'aria-label': 'Abrir menu',
      'aria-haspopup': 'menu',
      style: {
        width: tamanho, height: tamanho, flexShrink: 0, padding: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', borderRadius: 'var(--radius-control)',
        border: '1px solid var(--border-default)',
        background: 'var(--surface-card)', color: 'var(--text-primary)'
      }
    }, h('svg', {
      width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', strokeWidth: 1.75,
      strokeLinecap: 'round', strokeLinejoin: 'round',
      'aria-hidden': true, style: { display: 'block' }
    },
      h('path', { key: 'a', d: 'M4 6h16' }),
      h('path', { key: 'b', d: 'M4 12h16' }),
      h('path', { key: 'c', d: 'M4 18h16' })
    ));
  }

  // ----------------------------------------------------------- animação
  var CSS_ID = 'casa-nav-css';
  function garantirCss() {
    if (document.getElementById(CSS_ID)) return;
    var el = document.createElement('style');
    el.id = CSS_ID;
    el.textContent =
      '@keyframes casa-drawer-in{from{transform:translateX(-100%)}to{transform:none}}' +
      '@keyframes casa-veu-in{from{opacity:0}to{opacity:1}}' +
      '@media (prefers-reduced-motion:reduce){' +
        '.casa-drawer,.casa-veu{animation:none!important}}';
    document.head.appendChild(el);
  }

  // ------------------------------------------------ seletor PF / PJ
  /* Controle segmentado, não um menu suspenso: são duas opções e o estado
   * precisa ficar lido de relance — a pessoa tem de saber em qual dinheiro
   * está mexendo sem procurar. Fica logo abaixo da marca, com peso menor
   * que ela, para não brigar pela atenção.
   */
  function SeletorAmbiente(props) {
    var atual = props.ambiente || ambienteAtual();
    var Icon = (window.CasaEmOrdemDesignSystem_c16053 || {}).Icon;

    function Opcao(chave, rotulo, icone, descricao) {
      var ativo = atual === chave;
      return h('button', {
        key: chave,
        type: 'button',
        className: 'casa-foco',
        onClick: function () { trocarAmbiente(chave); },
        'aria-pressed': ativo,
        title: descricao,
        style: {
          flex: 1, minWidth: 0, height: 34,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          border: 'none', cursor: ativo ? 'default' : 'pointer',
          borderRadius: 'calc(var(--radius-control) - 3px)',
          background: ativo ? 'var(--surface-card)' : 'transparent',
          color: ativo ? 'var(--emerald-800)' : 'var(--text-secondary)',
          boxShadow: ativo ? 'var(--shadow-card)' : 'none',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--fs-small)',
          fontWeight: ativo ? 700 : 500,
          transition: 'background var(--dur-fast) var(--ease-standard)',
        },
      },
        Icon ? h(Icon, { key: 'i', name: icone, size: 15, strokeWidth: ativo ? 2.2 : 1.75 }) : null,
        h('span', { key: 'r' }, rotulo)
      );
    }

    return h('div', {
      role: 'group',
      'aria-label': 'Ambiente',
      style: {
        display: 'flex', gap: 3, padding: 3,
        borderRadius: 'var(--radius-control)',
        background: 'var(--surface-sunken)',
      },
    },
      Opcao('pf', 'Pessoal', 'house', 'Finanças pessoais e da família'),
      Opcao('pj', 'Empresa', 'briefcase', 'Finanças da atividade profissional')
    );
  }

  // --------------------------------------------------------- sidebar
  /* Cópia fiel do Sidebar compilado — mesmos tokens, mesmas medidas — com
   * o seletor entre a marca e a navegação. Reimplementar foi a saída
   * porque o componente do bundle não aceita conteúdo no meio dele, e a
   * alternativa (empilhar o seletor acima da marca) deixaria o seletor
   * disputando o topo com o nome do produto.
   *
   * O seletor só aparece para quem tem os dois ambientes. Esconder botão
   * não é controle de acesso — quem barra continua sendo a RLS —, é só não
   * oferecer o que não abre.
   */
  function Sidebar(props) {
    var React = R();
    var NSb = window.CasaEmOrdemDesignSystem_c16053 || {};
    var Icon = NSb.Icon;
    var perm = usarPermissoes();
    var amb = ambienteAtual();
    var itens = NS.NAV_ITEMS || [];
    var ativo = props.active || (itens[0] || {}).id;

    function ItemMenu(item) {
      var eAtivo = item.id === ativo;
      return h('button', {
        key: item.id,
        type: 'button',
        className: 'casa-foco',
        'aria-current': eAtivo ? 'page' : undefined,
        onClick: function () { if (props.onSelect) props.onSelect(item.id); },
        style: {
          display: 'flex', alignItems: 'center', gap: 12,
          height: 44, padding: '0 12px',
          borderRadius: 'var(--radius-control)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          fontFamily: 'var(--font-body)', fontSize: 14,
          fontWeight: eAtivo ? 700 : 500,
          background: eAtivo ? 'var(--color-primary-soft)' : 'transparent',
          color: eAtivo ? 'var(--emerald-800)' : 'var(--text-secondary)',
        },
      },
        Icon ? h(Icon, { name: item.icon, size: 19, strokeWidth: eAtivo ? 2 : 1.75 }) : null,
        item.label
      );
    }

    return h('aside', {
      style: Object.assign({
        width: 'var(--sidebar-w)', flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: 20,
        padding: '28px 16px',
        background: 'var(--surface-card)',
        borderRight: '1px solid var(--border-default)',
        minHeight: '100%',
      }, props.style || {}),
    },
      // marca
      h('div', {
        key: 'marca',
        style: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px' },
      },
        h('span', {
          key: 'i',
          style: {
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--color-primary)', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          },
        }, Icon ? h(Icon, { name: 'house', size: 18, strokeWidth: 2 }) : null),
        h('span', {
          key: 'n',
          style: {
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 16, letterSpacing: '-0.015em',
          },
        }, 'Casa em Ordem')
      ),

      perm.pode_pj ? h(SeletorAmbiente, { key: 'sel', ambiente: amb }) : null,

      h('nav', {
        key: 'nav',
        'aria-label': amb === 'pj' ? 'Seções da empresa' : 'Seções pessoais',
        style: { display: 'flex', flexDirection: 'column', gap: 2 },
      }, itens.map(ItemMenu)),

      h('div', {
        key: 'pe',
        style: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 2 },
      },
        h('button', {
          type: 'button',
          className: 'casa-foco',
          onClick: props.onSettings,
          style: {
            display: 'flex', alignItems: 'center', gap: 12,
            height: 44, padding: '0 12px',
            borderRadius: 'var(--radius-control)',
            border: 'none', background: 'transparent', cursor: 'pointer',
            textAlign: 'left', fontFamily: 'var(--font-body)',
            fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
          },
        },
          Icon ? h(Icon, { name: 'settings', size: 19 }) : null,
          'Configurações'
        )
      )
    );
  }

  // O bundle pode carregar depois deste arquivo: a interceptação garante
  // que a versão com seletor vença, venha ela antes ou depois.
  var SidebarDoBundle = NS.Sidebar;
  Object.defineProperty(NS, 'Sidebar', {
    configurable: true,
    enumerable: true,
    get: function () { return Sidebar; },
    set: function (v) { SidebarDoBundle = v; },
  });

  // ----------------------------------------------------------- menu
  function NavDrawer(props) {
    var aberto = !!props.open;
    var fechar = props.onClose;

    R().useEffect(function () {
      if (!aberto) return;
      garantirCss();
      function naTecla(e) { if (e.key === 'Escape' && fechar) fechar(); }
      document.addEventListener('keydown', naTecla);
      // trava a rolagem do fundo enquanto o menu está aberto
      var antes = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return function () {
        document.removeEventListener('keydown', naTecla);
        document.body.style.overflow = antes;
      };
    }, [aberto, fechar]);

    if (!aberto) return null;

    function ir(id) {
      if (fechar) fechar();
      if (props.onSelect) props.onSelect(id);
    }
    function configurar() {
      if (fechar) fechar();
      if (props.onSettings) props.onSettings();
    }

    return h('div', {
      className: 'casa-veu',
      role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu',
      onClick: fechar,
      style: {
        position: 'fixed', inset: 0, zIndex: 80, display: 'flex',
        background: 'rgba(34,38,43,0.45)', animation: 'casa-veu-in .18s ease-out'
      }
    },
      h('div', {
        className: 'casa-drawer',
        onClick: function (e) { e.stopPropagation(); },
        style: {
          position: 'relative', width: 'min(84vw, 300px)', height: '100%',
          animation: 'casa-drawer-in .22s cubic-bezier(.2,.8,.3,1)',
          boxShadow: '0 0 40px rgba(34,38,43,.18)'
        }
      },
        // o próprio Sidebar do design system: o menu nasce com o visual certo
        // e ganha qualquer aba nova sem precisar de manutenção aqui.
        h(NS.Sidebar, {
          active: props.active,
          onSelect: ir,
          onSettings: configurar,
          style: {
            width: '100%', height: '100%', borderRight: 'none',
            overflowY: 'auto', boxSizing: 'border-box'
          }
        }),
        h('div', { style: { position: 'absolute', top: 24, right: 12, zIndex: 1 } },
          h(NS.IconButton, {
            icon: 'x', label: 'Fechar menu', size: 36, bordered: true, onClick: fechar
          }))
      )
    );
  }

  NS.MenuButton = MenuButton;
  NS.NavDrawer = NavDrawer;
  NS.SeletorAmbiente = SeletorAmbiente;

  // As telas chamam `CasaNav.irPara(id)` em vez de cada uma guardar a sua
  // cópia do mapa de destinos.
  window.CasaNav = {
    MENUS: MENUS,
    ambiente: ambienteAtual,
    irPara: irPara,
    paginaDe: paginaDe,
    trocar: trocarAmbiente,
    permissoes: function () { return permissoes || {}; },
  };
})();

/* Casa em Ordem — navegação em menu lateral no celular.
 *
 * O design system continua intocado. `NAV_ITEMS` é exportado como array e é
 * a mesma referência que o Sidebar percorre, então a aba nova entra por aqui
 * e aparece sozinha nos dois lugares. O hambúrguer é SVG inline porque o
 * mapa de ícones do bundle é privado — o traço copia o mesmo Lucide do
 * resto: 24x24, stroke 1.75, pontas e junções arredondadas.
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

  // ----------------------------------------------------------- aba nova
  var ABA = { id: 'beneficios', label: 'Benefícios', icon: 'wallet' };

  function acrescentarAba(itens) {
    if (!Array.isArray(itens)) return;
    for (var i = 0; i < itens.length; i++) {
      if (itens[i] && itens[i].id === ABA.id) return;
    }
    itens.push(ABA);
  }

  var itensGuardados = NS.NAV_ITEMS;
  Object.defineProperty(NS, 'NAV_ITEMS', {
    configurable: true,
    enumerable: true,
    get: function () { return itensGuardados; },
    set: function (v) { itensGuardados = v; acrescentarAba(v); },
  });
  acrescentarAba(itensGuardados);

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
})();

/* @ds-bundle: {"format":4,"namespace":"CasaEmOrdemDesignSystem_c16053","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"ICON_NAMES","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"CATEGORIES","sourcePath":"components/core/shared.js"},{"name":"NAV_ITEMS","sourcePath":"components/core/shared.js"},{"name":"Card","sourcePath":"components/data/Card.jsx"},{"name":"CategoryChip","sourcePath":"components/data/CategoryChip.jsx"},{"name":"EmptyState","sourcePath":"components/data/EmptyState.jsx"},{"name":"ListItem","sourcePath":"components/data/ListItem.jsx"},{"name":"ProgressBar","sourcePath":"components/data/ProgressBar.jsx"},{"name":"SummaryCard","sourcePath":"components/data/SummaryCard.jsx"},{"name":"MoneyInput","sourcePath":"components/forms/MoneyInput.jsx"},{"name":"TextInput","sourcePath":"components/forms/TextInput.jsx"},{"name":"AppHeader","sourcePath":"components/navigation/AppHeader.jsx"},{"name":"BottomNav","sourcePath":"components/navigation/BottomNav.jsx"},{"name":"PeriodSelector","sourcePath":"components/navigation/PeriodSelector.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"}],"sourceHashes":{"components/core/Button.jsx":"1d208bb5e701","components/core/Icon.jsx":"94f03212df3d","components/core/IconButton.jsx":"30ca58b1ebc7","components/core/shared.js":"bfe007fa13dc","components/data/Card.jsx":"28fd626e63e1","components/data/CategoryChip.jsx":"f42db4f6362c","components/data/EmptyState.jsx":"a2fcef046ae7","components/data/ListItem.jsx":"3cf9db353aca","components/data/ProgressBar.jsx":"e2564de243ce","components/data/SummaryCard.jsx":"a9e9b3768ca8","components/forms/MoneyInput.jsx":"d58dae19782e","components/forms/TextInput.jsx":"a1d175a78cbf","components/navigation/AppHeader.jsx":"a41dd493b771","components/navigation/BottomNav.jsx":"f87dbf84c9b8","components/navigation/PeriodSelector.jsx":"5be20617daa1","components/navigation/Sidebar.jsx":"da04de918cfe","ui_kits/web-app/ConfigScreen.jsx":"0f37dc2eeb0f","ui_kits/web-app/DividasScreen.jsx":"8d240aaeb2d9","ui_kits/web-app/FuturoScreen.jsx":"e9095cdc1082","ui_kits/web-app/ResumoScreen.jsx":"ee0906a32426","ui_kits/web-app/TransactionScreen.jsx":"c14fe11367b2","ui_kits/web-app/shared.jsx":"8db7c728e3d6"},"inlinedExternals":[],"unexposedExports":[{"name":"formatBRL","sourcePath":"components/core/shared.js"}]} */

(() => {

const __ds_ns = (window.CasaEmOrdemDesignSystem_c16053 = window.CasaEmOrdemDesignSystem_c16053 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Lucide icons (v0.460.0, ISC) — copied from lucide-static. Line style, round caps/joins.
// Raw SVGs live in assets/icons/.
const ICONS = {
  "house": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\" /><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\" />",
  "car": "<path d=\"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2\" /><circle cx=\"7\" cy=\"17\" r=\"2\" /><path d=\"M9 17h6\" /><circle cx=\"17\" cy=\"17\" r=\"2\" />",
  "user-round": "<circle cx=\"12\" cy=\"8\" r=\"5\" /><path d=\"M20 21a8 8 0 0 0-16 0\" />",
  "hand-coins": "<path d=\"M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17\" /><path d=\"m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9\" /><path d=\"m2 16 6 6\" /><circle cx=\"16\" cy=\"9\" r=\"2.9\" /><circle cx=\"6\" cy=\"5\" r=\"3\" />",
  "piggy-bank": "<path d=\"M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z\" /><path d=\"M2 9v1c0 1.1.9 2 2 2h1\" /><path d=\"M16 11h.01\" />",
  "ellipsis": "<circle cx=\"12\" cy=\"12\" r=\"1\" /><circle cx=\"19\" cy=\"12\" r=\"1\" /><circle cx=\"5\" cy=\"12\" r=\"1\" />",
  "layout-dashboard": "<rect width=\"7\" height=\"9\" x=\"3\" y=\"3\" rx=\"1\" /><rect width=\"7\" height=\"5\" x=\"14\" y=\"3\" rx=\"1\" /><rect width=\"7\" height=\"9\" x=\"14\" y=\"12\" rx=\"1\" /><rect width=\"7\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\" />",
  "arrow-down-left": "<path d=\"M17 7 7 17\" /><path d=\"M17 17H7V7\" />",
  "arrow-up-right": "<path d=\"M7 7h10v10\" /><path d=\"M7 17 17 7\" />",
  "landmark": "<line x1=\"3\" x2=\"21\" y1=\"22\" y2=\"22\" /><line x1=\"6\" x2=\"6\" y1=\"18\" y2=\"11\" /><line x1=\"10\" x2=\"10\" y1=\"18\" y2=\"11\" /><line x1=\"14\" x2=\"14\" y1=\"18\" y2=\"11\" /><line x1=\"18\" x2=\"18\" y1=\"18\" y2=\"11\" /><polygon points=\"12 2 20 7 4 7\" />",
  "receipt-text": "<path d=\"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z\" /><path d=\"M14 8H8\" /><path d=\"M16 12H8\" /><path d=\"M13 16H8\" />",
  "settings": "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\" /><circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\" />",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\" />",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\" />",
  "pencil": "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\" /><path d=\"m15 5 4 4\" />",
  "trash-2": "<path d=\"M3 6h18\" /><path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\" /><path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\" /><line x1=\"10\" x2=\"10\" y1=\"11\" y2=\"17\" /><line x1=\"14\" x2=\"14\" y1=\"11\" y2=\"17\" />",
  "plus": "<path d=\"M5 12h14\" /><path d=\"M12 5v14\" />",
  "wallet": "<path d=\"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1\" /><path d=\"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4\" />",
  "inbox": "<polyline points=\"22 12 16 12 14 15 10 15 8 12 2 12\" /><path d=\"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z\" />",
  "check": "<path d=\"M20 6 9 17l-5-5\" />",
  "x": "<path d=\"M18 6 6 18\" /><path d=\"m6 6 12 12\" />",
  "calendar": "<path d=\"M8 2v4\" /><path d=\"M16 2v4\" /><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /><path d=\"M3 10h18\" />",
  "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\" /><path d=\"M12 9v4\" /><path d=\"M12 17h.01\" />",
  "trending-up": "<polyline points=\"22 7 13.5 15.5 8.5 10.5 2 17\" /><polyline points=\"16 7 22 7 22 13\" />",
  "trending-down": "<polyline points=\"22 17 13.5 8.5 8.5 13.5 2 7\" /><polyline points=\"16 17 22 17 22 11\" />",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"m9 12 2 2 4-4\" />",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M12 16v-4\" /><path d=\"M12 8h.01\" />",
  "log-out": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\" /><polyline points=\"16 17 21 12 16 7\" /><line x1=\"21\" x2=\"9\" y1=\"12\" y2=\"12\" />",
  "bell": "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" /><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" />",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\" /><path d=\"m21 21-4.3-4.3\" />",
  "target": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><circle cx=\"12\" cy=\"12\" r=\"6\" /><circle cx=\"12\" cy=\"12\" r=\"2\" />",
  "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /><path d=\"M10 9H8\" /><path d=\"M16 13H8\" /><path d=\"M16 17H8\" />",
  "shopping-cart": "<circle cx=\"8\" cy=\"21\" r=\"1\" /><circle cx=\"19\" cy=\"21\" r=\"1\" /><path d=\"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12\" />",
  "zap": "<path d=\"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z\" />",
  "graduation-cap": "<path d=\"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z\" /><path d=\"M22 10v6\" /><path d=\"M6 12.5V16a6 3 0 0 0 12 0v-3.5\" />",
  "heart-pulse": "<path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\" /><path d=\"M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27\" />",
  "utensils": "<path d=\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2\" /><path d=\"M7 2v20\" /><path d=\"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7\" />"
};
function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
  title,
  ...rest
}) {
  const body = ICONS[name];
  if (!body) return null;
  return /*#__PURE__*/React.createElement("svg", _extends({
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": title ? undefined : true,
    role: title ? 'img' : undefined,
    style: {
      flexShrink: 0,
      display: 'block',
      ...style
    }
  }, rest, {
    dangerouslySetInnerHTML: {
      __html: (title ? '<title>' + title + '</title>' : '') + body
    }
  }));
}
const ICON_NAMES = Object.keys(ICONS);
Object.assign(__ds_scope, { Icon, ICON_NAMES });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    h: 'var(--control-h-sm)',
    px: 14,
    fs: 13,
    icon: 16
  },
  md: {
    h: 'var(--control-h)',
    px: 18,
    fs: 14,
    icon: 18
  },
  lg: {
    h: 'var(--control-h-lg)',
    px: 22,
    fs: 15,
    icon: 20
  }
};
const VARIANTS = {
  primary: {
    bg: 'var(--color-primary)',
    hover: 'var(--color-primary-hover)',
    active: 'var(--color-primary-active)',
    fg: 'var(--text-on-primary)',
    border: 'transparent',
    shadow: 'var(--shadow-button)'
  },
  secondary: {
    bg: 'var(--surface-card)',
    hover: 'var(--surface-hover)',
    active: 'var(--surface-sunken)',
    fg: 'var(--text-primary)',
    border: 'var(--border-strong)',
    shadow: 'none'
  },
  soft: {
    bg: 'var(--color-primary-soft)',
    hover: '#CBE7DF',
    active: '#BEE0D6',
    fg: 'var(--emerald-800)',
    border: 'transparent',
    shadow: 'none'
  },
  ghost: {
    bg: 'transparent',
    hover: 'var(--surface-sunken)',
    active: 'var(--cream-300)',
    fg: 'var(--color-primary)',
    border: 'transparent',
    shadow: 'none'
  },
  danger: {
    bg: 'var(--color-alert)',
    hover: 'var(--terra-700)',
    active: 'var(--terra-700)',
    fg: '#fff',
    border: 'transparent',
    shadow: 'none'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth,
  disabled,
  children,
  style,
  onClick,
  type = 'button',
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const bg = disabled ? 'var(--surface-sunken)' : press ? v.active : hover ? v.hover : v.bg;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: s.h,
      padding: `0 ${s.px}px`,
      width: fullWidth ? '100%' : undefined,
      borderRadius: 'var(--radius-control)',
      border: `1px solid ${disabled ? 'var(--border-default)' : v.border}`,
      background: bg,
      color: disabled ? 'var(--text-muted)' : v.fg,
      boxShadow: disabled ? 'none' : v.shadow,
      fontFamily: 'var(--font-body)',
      fontSize: s.fs,
      fontWeight: 600,
      letterSpacing: '0.005em',
      whiteSpace: 'nowrap',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transform: press && !disabled ? 'translateY(1px)' : 'none',
      transition: 'background var(--dur-fast) var(--ease-standard), transform var(--dur-fast)',
      outline: 'none',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon,
    strokeWidth: 2
  }), children, iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.icon,
    strokeWidth: 2
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    fg: 'var(--text-secondary)',
    hoverFg: 'var(--text-primary)',
    hoverBg: 'var(--surface-sunken)'
  },
  primary: {
    fg: 'var(--color-primary)',
    hoverFg: 'var(--color-primary-hover)',
    hoverBg: 'var(--color-primary-soft)'
  },
  danger: {
    fg: 'var(--text-secondary)',
    hoverFg: 'var(--color-alert)',
    hoverBg: 'var(--color-alert-soft)'
  }
};
function IconButton({
  icon,
  label,
  tone = 'neutral',
  size = 40,
  iconSize,
  bordered = false,
  disabled,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: size,
      height: size,
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-control)',
      border: bordered ? '1px solid var(--border-default)' : '1px solid transparent',
      background: hover && !disabled ? t.hoverBg : bordered ? 'var(--surface-card)' : 'transparent',
      color: disabled ? 'var(--ink-300)' : hover ? t.hoverFg : t.fg,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background var(--dur-fast), color var(--dur-fast)',
      padding: 0,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: iconSize || Math.round(size * 0.48)
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/shared.js
try { (() => {
// Shared helpers (not components).
function formatBRL(value, {
  sign = false,
  cents = true
} = {}) {
  const n = Number(value) || 0;
  const s = Math.abs(n).toLocaleString('pt-BR', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0
  });
  const prefix = n < 0 ? '− ' : sign && n > 0 ? '+ ' : '';
  return prefix + 'R$ ' + s;
}
const CATEGORIES = {
  casa: {
    label: 'Casa',
    icon: 'house',
    color: 'var(--cat-casa)',
    bg: 'var(--cat-casa-bg)'
  },
  carro: {
    label: 'Carro',
    icon: 'car',
    color: 'var(--cat-carro)',
    bg: 'var(--cat-carro-bg)'
  },
  pessoal: {
    label: 'Pessoal',
    icon: 'user-round',
    color: 'var(--cat-pessoal)',
    bg: 'var(--cat-pessoal-bg)'
  },
  divida: {
    label: 'Dívida',
    icon: 'hand-coins',
    color: 'var(--cat-divida)',
    bg: 'var(--cat-divida-bg)'
  },
  futuro: {
    label: 'Futuro',
    icon: 'piggy-bank',
    color: 'var(--cat-futuro)',
    bg: 'var(--cat-futuro-bg)'
  },
  outros: {
    label: 'Outros',
    icon: 'ellipsis',
    color: 'var(--cat-outros)',
    bg: 'var(--cat-outros-bg)'
  }
};
const NAV_ITEMS = [{
  id: 'resumo',
  label: 'Resumo',
  icon: 'layout-dashboard'
}, {
  id: 'entradas',
  label: 'Entradas',
  icon: 'arrow-down-left'
}, {
  id: 'saidas',
  label: 'Saídas',
  icon: 'arrow-up-right'
}, {
  id: 'dividas',
  label: 'Dívidas',
  icon: 'hand-coins'
}, {
  id: 'futuro',
  label: 'Futuro',
  icon: 'piggy-bank'
}, {
  id: 'faturas',
  label: 'Faturas',
  icon: 'receipt-text'
}];
Object.assign(__ds_scope, { formatBRL, CATEGORIES, NAV_ITEMS });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/shared.js", error: String((e && e.message) || e) }); }

// components/data/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  title,
  subtitle,
  action,
  padding = 24,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      minWidth: 0,
      ...style
    }
  }, rest), (title || action) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 17,
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.3
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)'
    }
  }, subtitle)), action), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/CategoryChip.jsx
try { (() => {
function CategoryChip({
  category,
  label,
  size = 'md',
  active = true,
  onClick,
  style
}) {
  const def = __ds_scope.CATEGORIES[category];
  const text = label || def?.label || category;
  const icon = def?.icon;
  const color = active ? def?.color || 'var(--ink-700)' : 'var(--text-secondary)';
  const bg = active ? def?.bg || 'var(--cream-200)' : 'var(--cream-200)';
  const sm = size === 'sm';
  const Comp = onClick ? 'button' : 'span';
  return /*#__PURE__*/React.createElement(Comp, {
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: sm ? 5 : 7,
      height: sm ? 26 : 32,
      padding: sm ? '0 10px' : '0 14px',
      borderRadius: 'var(--radius-pill)',
      background: bg,
      color,
      border: 'none',
      cursor: onClick ? 'pointer' : 'default',
      fontFamily: 'var(--font-body)',
      fontSize: sm ? 12 : 13,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: sm ? 13 : 15,
    strokeWidth: 2
  }), text);
}
Object.assign(__ds_scope, { CategoryChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/CategoryChip.jsx", error: String((e && e.message) || e) }); }

// components/data/EmptyState.jsx
try { (() => {
function EmptyState({
  icon = 'inbox',
  title = 'Nenhum lançamento ainda',
  description,
  action,
  tone = 'primary',
  compact,
  style
}) {
  const bg = tone === 'accent' ? 'var(--gold-50)' : tone === 'alert' ? 'var(--terra-50)' : 'var(--emerald-50)';
  const ring = tone === 'accent' ? 'var(--gold-100)' : tone === 'alert' ? 'var(--terra-100)' : 'var(--emerald-100)';
  const fg = tone === 'accent' ? 'var(--gold-700)' : tone === 'alert' ? 'var(--color-alert)' : 'var(--color-primary)';
  const d = compact ? 72 : 104;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 16,
      padding: compact ? '24px 16px' : '40px 24px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: d,
      height: d,
      borderRadius: '50%',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: d * 0.64,
      height: d * 0.64,
      borderRadius: '50%',
      background: ring,
      color: fg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: compact ? 24 : 32,
    strokeWidth: 1.5
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      maxWidth: 300
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: compact ? 15 : 17,
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, title), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--text-secondary)',
      textWrap: 'pretty'
    }
  }, description)), action);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/data/ListItem.jsx
try { (() => {
function ListItem({
  title,
  meta,
  category,
  amount,
  kind = 'out',
  onEdit,
  onDelete,
  divider = true,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const def = __ds_scope.CATEGORIES[category];
  const formatted = typeof amount === 'number' ? __ds_scope.formatBRL(amount, {
    sign: kind === 'in'
  }) : amount;
  const amountColor = kind === 'in' ? 'var(--money-in)' : kind === 'debt' ? 'var(--money-debt)' : 'var(--text-primary)';
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 4px',
      borderBottom: divider ? '1px solid var(--border-default)' : 'none',
      background: hover ? 'var(--surface-hover)' : 'transparent',
      borderRadius: 10,
      transition: 'background var(--dur-fast)',
      ...style
    }
  }, def && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      flexShrink: 0,
      borderRadius: 12,
      background: def.bg,
      color: def.color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: def.icon,
    size: 19
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--text-primary)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)'
    }
  }, meta)), /*#__PURE__*/React.createElement("span", {
    className: "num",
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: amountColor,
      whiteSpace: 'nowrap'
    }
  }, formatted), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2,
      opacity: hover ? 1 : 0,
      transition: 'opacity var(--dur-fast)',
      width: hover ? undefined : 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "pencil",
    label: "Editar",
    size: 32,
    onClick: onEdit
  }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "trash-2",
    label: "Excluir",
    size: 32,
    tone: "danger",
    onClick: onDelete
  })));
}
Object.assign(__ds_scope, { ListItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ListItem.jsx", error: String((e && e.message) || e) }); }

// components/data/ProgressBar.jsx
try { (() => {
function ProgressBar({
  value,
  max = 100,
  current,
  target,
  tone = 'primary',
  label,
  caption,
  height = 8,
  style
}) {
  const pct = current !== undefined && target ? current / target * 100 : value / max * 100;
  const clamped = Math.max(0, Math.min(100, pct));
  const color = tone === 'accent' ? 'var(--color-accent)' : tone === 'alert' ? 'var(--color-alert)' : tone === 'success' ? 'var(--color-success)' : 'var(--color-primary)';
  const autoCaption = caption || (current !== undefined && target ? `R$ ${current.toLocaleString('pt-BR')} de R$ ${target.toLocaleString('pt-BR')}` : null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)',
      fontWeight: 500
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "num",
    style: {
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, Math.round(clamped), "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      height,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--cream-200)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${clamped}%`,
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: color,
      transition: 'width var(--dur-slow) var(--ease-standard)'
    }
  })), autoCaption && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--text-secondary)'
    }
  }, autoCaption));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/data/SummaryCard.jsx
try { (() => {
const TONES = {
  default: {
    bg: 'var(--surface-card)',
    fg: 'var(--text-primary)',
    sub: 'var(--text-secondary)',
    iconBg: 'var(--color-primary-soft)',
    iconFg: 'var(--color-primary)',
    border: 'var(--border-default)'
  },
  primary: {
    bg: 'var(--color-primary)',
    fg: '#FFFFFF',
    sub: 'rgba(255,255,255,.78)',
    iconBg: 'rgba(255,255,255,.14)',
    iconFg: '#FFFFFF',
    border: 'var(--color-primary)'
  },
  accent: {
    bg: 'var(--surface-card)',
    fg: 'var(--text-primary)',
    sub: 'var(--text-secondary)',
    iconBg: 'var(--color-accent-soft)',
    iconFg: 'var(--gold-700)',
    border: 'var(--border-default)'
  },
  alert: {
    bg: 'var(--surface-card)',
    fg: 'var(--text-primary)',
    sub: 'var(--text-secondary)',
    iconBg: 'var(--color-alert-soft)',
    iconFg: 'var(--color-alert)',
    border: 'var(--border-default)'
  }
};
function SummaryCard({
  label,
  value,
  icon,
  tone = 'default',
  delta,
  deltaTone,
  footer,
  size = 'lg',
  style
}) {
  const t = TONES[tone] || TONES.default;
  const lg = size === 'lg';
  const formatted = typeof value === 'number' ? __ds_scope.formatBRL(value) : value;
  const [cur, ...rest] = String(formatted).split(' ');
  const hasPrefix = cur === 'R$' || cur === '−';
  const dColor = tone === 'primary' ? '#fff' : deltaTone === 'down' ? 'var(--color-alert)' : deltaTone === 'up' ? 'var(--color-success)' : 'var(--text-secondary)';
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: t.bg,
      color: t.fg,
      border: `1px solid ${t.border}`,
      borderRadius: 'var(--radius-card)',
      boxShadow: tone === 'primary' ? 'var(--shadow-raised)' : 'var(--shadow-card)',
      padding: lg ? 24 : 20,
      display: 'flex',
      flexDirection: 'column',
      gap: lg ? 14 : 10,
      minWidth: 0,
      containerType: 'inline-size',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minWidth: 0
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      flexShrink: 0,
      borderRadius: 10,
      background: t.iconBg,
      color: t.iconFg,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: t.sub,
      letterSpacing: '0.01em',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontFeatureSettings: 'var(--num-features)',
      fontVariantNumeric: 'tabular-nums',
      fontWeight: 600,
      fontSize: lg ? 'clamp(22px, 11cqw, 40px)' : 'clamp(17px, 9cqw, 24px)',
      letterSpacing: '-0.025em',
      lineHeight: 1.05,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'baseline',
      gap: '0.25em',
      minWidth: 0
    }
  }, hasPrefix ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.5em',
      fontWeight: 500,
      color: t.sub,
      letterSpacing: 0
    }
  }, formatted.startsWith('−') ? '− R$' : 'R$'), /*#__PURE__*/React.createElement("span", null, formatted.replace(/^(− )?R\$ /, ''))) : formatted), delta && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      color: dColor,
      fontWeight: 500
    }
  }, deltaTone && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: deltaTone === 'down' ? 'trending-down' : 'trending-up',
    size: 16
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: tone === 'primary' ? 'rgba(255,255,255,.85)' : undefined
    }
  }, delta)), footer);
}
Object.assign(__ds_scope, { SummaryCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/SummaryCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/MoneyInput.jsx
try { (() => {
function toDisplay(n) {
  return (Number(n) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function MoneyInput({
  label,
  value,
  defaultValue = 0,
  onChange,
  hint,
  error,
  size = 'md',
  disabled,
  id,
  tone,
  style
}) {
  const [inner, setInner] = React.useState(defaultValue);
  const [focus, setFocus] = React.useState(false);
  const v = value !== undefined ? value : inner;
  const fid = id || React.useId();
  const lg = size === 'lg';
  const handle = e => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 13);
    const n = Number(digits || '0') / 100;
    if (value === undefined) setInner(n);
    onChange && onChange(n);
  };
  const border = error ? 'var(--color-alert)' : focus ? 'var(--color-primary)' : 'var(--border-strong)';
  const fg = tone === 'in' ? 'var(--money-in)' : tone === 'debt' ? 'var(--money-debt)' : 'var(--text-primary)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: lg ? 10 : 8,
      height: lg ? 68 : 'var(--control-h)',
      padding: lg ? '0 18px' : '0 14px',
      alignItems: 'center',
      background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: `1px solid ${border}`,
      borderRadius: 'var(--radius-control)',
      boxShadow: focus ? error ? '0 0 0 3px rgba(193,80,46,.18)' : 'var(--focus-ring)' : 'none',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: lg ? 18 : 14,
      fontWeight: 500,
      color: 'var(--text-secondary)'
    }
  }, "R$"), /*#__PURE__*/React.createElement("input", {
    id: fid,
    inputMode: "numeric",
    disabled: disabled,
    value: toDisplay(v),
    onChange: handle,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      textAlign: 'right',
      fontFamily: 'var(--font-numeric)',
      fontFeatureSettings: 'var(--num-features)',
      fontVariantNumeric: 'tabular-nums',
      fontSize: lg ? 30 : 16,
      fontWeight: lg ? 600 : 500,
      letterSpacing: lg ? '-0.01em' : 0,
      color: v === 0 ? 'var(--text-muted)' : fg
    }
  })), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: error ? 'var(--color-alert)' : 'var(--text-secondary)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { MoneyInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/MoneyInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TextInput({
  label,
  value,
  defaultValue,
  onChange,
  placeholder,
  hint,
  error,
  icon,
  type = 'text',
  disabled,
  id,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const fid = id || React.useId();
  const border = error ? 'var(--color-alert)' : focus ? 'var(--color-primary)' : 'var(--border-strong)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 'var(--control-h)',
      padding: '0 14px',
      background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: `1px solid ${border}`,
      borderRadius: 'var(--radius-control)',
      boxShadow: focus ? 'var(--focus-ring)' : 'none',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("input", _extends({
    id: fid,
    type: type,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--text-primary)'
    }
  }, rest))), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: error ? 'var(--color-alert)' : 'var(--text-secondary)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { TextInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextInput.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNav.jsx
try { (() => {
function BottomNav({
  active = 'resumo',
  onSelect,
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'stretch',
      height: 'var(--bottom-nav-h)',
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-nav)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      ...style
    }
  }, __ds_scope.NAV_ITEMS.map(item => {
    const isActive = item.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: item.id,
      onClick: () => onSelect && onSelect(item.id),
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        color: isActive ? 'var(--color-primary)' : 'var(--text-muted)'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: item.icon,
      size: 22,
      strokeWidth: isActive ? 2 : 1.75
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: isActive ? 700 : 500
      }
    }, item.label));
  }));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/PeriodSelector.jsx
try { (() => {
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
function PeriodSelector({
  month,
  year,
  defaultMonth = 9,
  defaultYear = 2026,
  onChange,
  compact,
  style
}) {
  const [inner, setInner] = React.useState({
    month: defaultMonth,
    year: defaultYear
  });
  const cur = month !== undefined ? {
    month,
    year
  } : inner;
  const step = delta => {
    let m = cur.month + delta,
      y = cur.year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    const next = {
      month: m,
      year: y
    };
    if (month === undefined) setInner(next);
    onChange && onChange(next);
  };
  const sz = compact ? 34 : 40;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "chevron-left",
    label: "M\xEAs anterior",
    onClick: () => step(-1),
    size: sz,
    bordered: true
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: compact ? 130 : 160,
      textAlign: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: compact ? 15 : 18,
      letterSpacing: '-0.01em',
      color: 'var(--text-primary)'
    }
  }, MESES[cur.month], " ", cur.year), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "chevron-right",
    label: "Pr\xF3ximo m\xEAs",
    onClick: () => step(1),
    size: sz,
    bordered: true
  }));
}
Object.assign(__ds_scope, { PeriodSelector });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/PeriodSelector.jsx", error: String((e && e.message) || e) }); }

// components/navigation/AppHeader.jsx
try { (() => {
function AppHeader({
  title,
  eyebrow,
  month,
  year,
  onPeriodChange,
  showPeriod = true,
  onSettings,
  actions,
  compact,
  style
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      flex: '1 1 auto',
      minWidth: 0
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: compact ? 22 : 30,
      fontWeight: 800,
      letterSpacing: '-0.025em',
      lineHeight: 1.15
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, showPeriod && /*#__PURE__*/React.createElement(__ds_scope.PeriodSelector, {
    month: month,
    year: year,
    onChange: onPeriodChange,
    compact: compact
  }), actions, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "settings",
    label: "Configura\xE7\xF5es",
    bordered: true,
    size: compact ? 40 : 44,
    iconSize: 20,
    onClick: onSettings
  })));
}
Object.assign(__ds_scope, { AppHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/AppHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
function Sidebar({
  active = 'resumo',
  onSelect,
  onSettings,
  style
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 'var(--sidebar-w)',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      padding: '28px 16px',
      background: 'var(--surface-card)',
      borderRight: '1px solid var(--border-default)',
      minHeight: '100%',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      background: 'var(--color-primary)',
      color: '#fff',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "house",
    size: 18,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 16,
      letterSpacing: '-0.015em'
    }
  }, "Casa em Ordem")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, __ds_scope.NAV_ITEMS.map(item => {
    const isActive = item.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: item.id,
      onClick: () => onSelect && onSelect(item.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        height: 44,
        padding: '0 12px',
        borderRadius: 'var(--radius-control)',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: isActive ? 700 : 500,
        background: isActive ? 'var(--color-primary-soft)' : 'transparent',
        color: isActive ? 'var(--emerald-800)' : 'var(--text-secondary)'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: item.icon,
      size: 19,
      strokeWidth: isActive ? 2 : 1.75
    }), item.label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onSettings,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      height: 44,
      padding: '0 12px',
      borderRadius: 'var(--radius-control)',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "settings",
    size: 19
  }), "Configura\xE7\xF5es")));
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web-app/ConfigScreen.jsx
try { (() => {
const {
  Shell,
  Button,
  Card,
  IconButton
} = window.CasaUIKit;
function ConfigScreen({
  nav
}) {
  return /*#__PURE__*/React.createElement(Shell, {
    screen: "config",
    onNavigate: nav.go,
    period: nav.period,
    onPeriod: () => {},
    eyebrow: "Fam\xEDlia Souza",
    title: "Configura\xE7\xF5es"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Perfil",
    subtitle: "Dados da fam\xEDlia"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 52,
      height: 52,
      borderRadius: '50%',
      background: 'var(--color-primary-soft)',
      color: 'var(--emerald-800)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 18
    }
  }, "FS"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700
    }
  }, "Fam\xEDlia Souza"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)'
    }
  }, "3 membros")))), /*#__PURE__*/React.createElement(Card, {
    title: "Prefer\xEAncias"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0
    }
  }, ['Notificações de vencimento', 'Moeda e formato numérico', 'Categorias personalizadas', 'Exportar dados'].map((l, i, a) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 4px',
      borderBottom: i < a.length - 1 ? '1px solid var(--border-default)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15
    }
  }, l), /*#__PURE__*/React.createElement(IconButton, {
    icon: "chevron-right",
    label: "Abrir"
  }))))), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "log-out",
    style: {
      alignSelf: 'flex-start',
      color: 'var(--color-alert)'
    }
  }, "Sair da conta"));
}
window.CasaUIKit.ConfigScreen = ConfigScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web-app/ConfigScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web-app/DividasScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Shell,
  DIVIDAS,
  Button,
  Card,
  ListItem,
  ProgressBar
} = window.CasaUIKit;
function DividasScreen({
  nav
}) {
  const total = DIVIDAS.reduce((s, d) => s + d.amount, 0);
  return /*#__PURE__*/React.createElement(Shell, {
    screen: "dividas",
    onNavigate: nav.go,
    period: nav.period,
    onPeriod: nav.setPeriod,
    eyebrow: "Fam\xEDlia Souza",
    title: "D\xEDvidas",
    actions: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      icon: "plus"
    }, "Nova d\xEDvida")
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Total em aberto",
    subtitle: "2 d\xEDvidas ativas"
  }, /*#__PURE__*/React.createElement("div", {
    className: "num",
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 'var(--fs-money-hero)',
      fontWeight: 600,
      color: 'var(--color-alert)',
      letterSpacing: '-0.025em'
    }
  }, "R$ ", total.toLocaleString('pt-BR', {
    minimumFractionDigits: 2
  })), /*#__PURE__*/React.createElement(ProgressBar, {
    tone: "success",
    label: "Financiamento do carro quitado",
    value: 37.5,
    caption: "18 de 48 parcelas pagas"
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Lan\xE7amentos",
    subtitle: "Outubro 2026"
  }, DIVIDAS.map((i, idx) => /*#__PURE__*/React.createElement(ListItem, _extends({
    key: i.id
  }, i, {
    divider: idx < DIVIDAS.length - 1
  })))));
}
window.CasaUIKit.DividasScreen = DividasScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web-app/DividasScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web-app/FuturoScreen.jsx
try { (() => {
const {
  Shell,
  FUTURO,
  Button,
  Card,
  ProgressBar
} = window.CasaUIKit;
function FuturoScreen({
  nav
}) {
  return /*#__PURE__*/React.createElement(Shell, {
    screen: "futuro",
    onNavigate: nav.go,
    period: nav.period,
    onPeriod: nav.setPeriod,
    eyebrow: "Fam\xEDlia Souza",
    title: "Futuro",
    actions: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      icon: "plus"
    }, "Novo cofrinho")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
      gap: 16
    }
  }, FUTURO.map(g => /*#__PURE__*/React.createElement(Card, {
    key: g.label,
    title: g.label,
    subtitle: `Meta de R$ ${g.target.toLocaleString('pt-BR')}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "num",
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 28,
      fontWeight: 600,
      color: 'var(--text-primary)',
      letterSpacing: '-0.02em'
    }
  }, "R$ ", g.current.toLocaleString('pt-BR')), /*#__PURE__*/React.createElement(ProgressBar, {
    tone: "accent",
    current: g.current,
    target: g.target
  })))));
}
window.CasaUIKit.FuturoScreen = FuturoScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web-app/FuturoScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web-app/ResumoScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Shell,
  ENTRADAS,
  SAIDAS,
  DIVIDAS,
  FUTURO,
  Button,
  Card,
  SummaryCard,
  CategoryChip,
  ProgressBar,
  ListItem,
  EmptyState
} = window.CasaUIKit;
function ResumoScreen({
  nav
}) {
  const saidaTotal = SAIDAS.reduce((s, i) => s + i.amount, 0);
  const entradaTotal = ENTRADAS.reduce((s, i) => s + i.amount, 0);
  const recent = [...ENTRADAS.map(i => ({
    ...i
  })), ...SAIDAS.map(i => ({
    ...i
  }))].slice(0, 4);
  return /*#__PURE__*/React.createElement(Shell, {
    screen: "resumo",
    onNavigate: nav.go,
    period: nav.period,
    onPeriod: nav.setPeriod,
    eyebrow: "Fam\xEDlia Souza",
    title: "Resumo",
    actions: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      icon: "plus",
      onClick: () => nav.go('entradas')
    }, "Novo lan\xE7amento")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(SummaryCard, {
    tone: "primary",
    icon: "wallet",
    label: "Saldo de outubro",
    value: entradaTotal - saidaTotal,
    delta: "+ R$ 412,00 vs. setembro",
    deltaTone: "up"
  }), /*#__PURE__*/React.createElement(SummaryCard, {
    tone: "accent",
    icon: "piggy-bank",
    label: "Guardado no Futuro",
    value: FUTURO.reduce((s, g) => s + g.current, 0)
  }), /*#__PURE__*/React.createElement(SummaryCard, {
    tone: "alert",
    icon: "hand-coins",
    label: "D\xEDvidas em aberto",
    value: DIVIDAS.reduce((s, d) => s + d.amount, 0)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.3fr 1fr',
      gap: 16,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "\xDAltimos lan\xE7amentos",
    subtitle: "Outubro 2026",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      iconRight: "chevron-right",
      onClick: () => nav.go('saidas')
    }, "Ver todas")
  }, recent.map((i, idx) => /*#__PURE__*/React.createElement(ListItem, _extends({
    key: i.title
  }, i, {
    divider: idx < recent.length - 1
  })))), /*#__PURE__*/React.createElement(Card, {
    title: "Metas do Futuro",
    subtitle: "3 cofrinhos ativos",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      iconRight: "chevron-right",
      onClick: () => nav.go('futuro')
    }, "Ver todas"),
    style: {
      gap: 20
    }
  }, FUTURO.map(g => /*#__PURE__*/React.createElement(ProgressBar, {
    key: g.label,
    tone: "accent",
    label: g.label,
    current: g.current,
    target: g.target
  })))));
}
window.CasaUIKit.ResumoScreen = ResumoScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web-app/ResumoScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web-app/TransactionScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Shell,
  ENTRADAS,
  SAIDAS,
  Button,
  Card,
  CategoryChip,
  ListItem,
  EmptyState,
  MoneyInput,
  TextInput
} = window.CasaUIKit;
function TransactionScreen({
  nav,
  kind
}) {
  const isIn = kind === 'entradas';
  const [items, setItems] = React.useState(isIn ? ENTRADAS : SAIDAS);
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState(null);
  const cats = ['casa', 'carro', 'pessoal', 'outros'];
  const filtered = filter ? items.filter(i => i.category === filter) : items;
  const total = filtered.reduce((s, i) => s + i.amount, 0);
  return /*#__PURE__*/React.createElement(Shell, {
    screen: kind,
    onNavigate: nav.go,
    period: nav.period,
    onPeriod: nav.setPeriod,
    eyebrow: "Fam\xEDlia Souza",
    title: isIn ? 'Entradas' : 'Saídas',
    actions: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      icon: "plus",
      onClick: () => setOpen(true)
    }, isIn ? 'Nova entrada' : 'Nova saída')
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(CategoryChip, {
    category: "casa",
    active: !filter || filter === 'casa',
    onClick: () => setFilter(f => f === 'casa' ? null : 'casa'),
    label: isIn ? undefined : 'Casa'
  }), !isIn && cats.slice(1).map(c => /*#__PURE__*/React.createElement(CategoryChip, {
    key: c,
    category: c,
    active: !filter || filter === c,
    onClick: () => setFilter(f => f === c ? null : c)
  }))), /*#__PURE__*/React.createElement("span", {
    className: "num",
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: isIn ? 'var(--money-in)' : 'var(--text-primary)'
    }
  }, isIn ? '+ ' : '', "R$ ", total.toLocaleString('pt-BR', {
    minimumFractionDigits: 2
  })))), /*#__PURE__*/React.createElement(Card, {
    title: isIn ? 'Entradas de outubro' : 'Saídas de outubro',
    subtitle: `${filtered.length} lançamentos`
  }, filtered.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "Nenhum lan\xE7amento ainda",
    description: `Adicione a primeira ${isIn ? 'entrada' : 'saída'} de outubro.`,
    action: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      icon: "plus",
      onClick: () => setOpen(true)
    }, "Adicionar")
  }) : filtered.map((i, idx) => /*#__PURE__*/React.createElement(ListItem, _extends({
    key: i.id
  }, i, {
    divider: idx < filtered.length - 1,
    onDelete: () => setItems(items.filter(x => x.id !== i.id))
  })))), open && /*#__PURE__*/React.createElement("div", {
    onClick: () => setOpen(false),
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(34,38,43,.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-raised)',
      padding: 28,
      width: 380,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 19,
      fontWeight: 700
    }
  }, isIn ? 'Nova entrada' : 'Nova saída'), /*#__PURE__*/React.createElement(MoneyInput, {
    size: "lg",
    tone: isIn ? 'in' : undefined,
    label: isIn ? 'Quanto entrou?' : 'Quanto saiu?',
    defaultValue: 0
  }), /*#__PURE__*/React.createElement(TextInput, {
    label: "Descri\xE7\xE3o",
    placeholder: "Ex.: Conta de luz"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    fullWidth: true,
    onClick: () => setOpen(false)
  }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    onClick: () => setOpen(false)
  }, "Salvar")))));
}
window.CasaUIKit.TransactionScreen = TransactionScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web-app/TransactionScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web-app/shared.jsx
try { (() => {
const {
  Icon,
  Button,
  IconButton,
  Card,
  SummaryCard,
  CategoryChip,
  ProgressBar,
  ListItem,
  EmptyState,
  MoneyInput,
  TextInput,
  AppHeader,
  Sidebar,
  BottomNav
} = window.CasaEmOrdemDesignSystem_c16053;
const ENTRADAS = [{
  id: 1,
  title: 'Salário Ana',
  meta: '05 out · Pix',
  category: 'pessoal',
  amount: 6200,
  kind: 'in'
}, {
  id: 2,
  title: 'Freelance design',
  meta: '14 out · Transferência',
  category: 'pessoal',
  amount: 980,
  kind: 'in'
}];
const SAIDAS = [{
  id: 1,
  title: 'Supermercado Pão de Açúcar',
  meta: '08 out · Débito',
  category: 'casa',
  amount: 342.18
}, {
  id: 2,
  title: 'Conta de luz',
  meta: '10 out',
  category: 'casa',
  amount: 214.9
}, {
  id: 3,
  title: 'Gasolina',
  meta: '12 out',
  category: 'carro',
  amount: 180
}, {
  id: 4,
  title: 'Cinema',
  meta: '18 out',
  category: 'pessoal',
  amount: 96
}];
const DIVIDAS = [{
  id: 1,
  title: 'Financiamento do carro',
  meta: 'Parcela 18/48',
  category: 'divida',
  amount: 1180,
  kind: 'debt'
}, {
  id: 2,
  title: 'Cartão Nubank',
  meta: 'Fatura de outubro',
  category: 'divida',
  amount: 642.5,
  kind: 'debt'
}];
const FUTURO = [{
  label: 'Reserva de emergência',
  current: 8200,
  target: 15000
}, {
  label: 'Viagem de férias',
  current: 4200,
  target: 8000
}, {
  label: 'Entrada do apartamento',
  current: 12600,
  target: 60000
}];
function Shell({
  screen,
  onNavigate,
  period,
  onPeriod,
  title,
  eyebrow,
  actions,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-app)',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: screen,
    onSelect: onNavigate,
    onSettings: () => onNavigate('config'),
    style: {
      position: 'sticky',
      top: 0,
      height: '100vh'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '28px 32px 40px',
      maxWidth: 'var(--content-max)',
      width: '100%',
      margin: '0 auto',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    eyebrow: eyebrow,
    title: title,
    month: period.month,
    year: period.year,
    onPeriodChange: onPeriod,
    actions: actions,
    onSettings: () => onNavigate('config')
  }), children)));
}
window.CasaUIKit = {
  Shell,
  ENTRADAS,
  SAIDAS,
  DIVIDAS,
  FUTURO,
  Icon,
  Button,
  IconButton,
  Card,
  SummaryCard,
  CategoryChip,
  ProgressBar,
  ListItem,
  EmptyState,
  MoneyInput,
  TextInput,
  BottomNav
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web-app/shared.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.CATEGORIES = __ds_scope.CATEGORIES;

__ds_ns.NAV_ITEMS = __ds_scope.NAV_ITEMS;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CategoryChip = __ds_scope.CategoryChip;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.ListItem = __ds_scope.ListItem;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.SummaryCard = __ds_scope.SummaryCard;

__ds_ns.MoneyInput = __ds_scope.MoneyInput;

__ds_ns.TextInput = __ds_scope.TextInput;

__ds_ns.AppHeader = __ds_scope.AppHeader;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.PeriodSelector = __ds_scope.PeriodSelector;

__ds_ns.Sidebar = __ds_scope.Sidebar;

})();

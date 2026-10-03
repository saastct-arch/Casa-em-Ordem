/* Trava de acesso e expiração da sessão.
 *
 * Roda no <head>, antes do support.js, e é síncrono de propósito: a
 * verificação antes vivia no componentDidMount e dependia do React montar.
 * Com o CDN fora do ar, nada redirecionava e a tela ficava aberta.
 *
 * Duas regras:
 *   1. Recarregar a página derruba a sessão e volta ao login. Trocar de
 *      aba do app é navegação ('navigate'), não recarga, então continua
 *      logado — cada tela é um HTML próprio, e deslogar em todo
 *      carregamento tornaria o app inutilizável.
 *   2. Sem sessão guardada, vai para o login antes mesmo de pedir o React.
 *
 * A sessão mora no sessionStorage: fechou a aba, acabou. Quem decide se
 * ela vale é o `exigirSessao`, que fala com o Supabase; a RLS continua
 * sendo a trava real.
 */
(function () {
  'use strict';

  var CHAVE = 'casa-em-ordem-sessao';

  function tipoDeNavegacao() {
    try {
      var e = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      if (e && e.type) return e.type;
      // navegadores antigos
      if (performance.navigation) return performance.navigation.type === 1 ? 'reload' : 'navigate';
    } catch (e) {}
    return 'navigate';
  }

  if (tipoDeNavegacao() === 'reload') {
    try { window.sessionStorage.removeItem(CHAVE); } catch (e) {}
  }

  var pagina = location.pathname.split('/').pop();
  if (pagina === '' || pagina === 'index.html' || pagina === 'index') return;

  var bruto = null;
  try {
    bruto = window.sessionStorage.getItem(CHAVE);
  } catch (e) {
    bruto = null; // navegação privada ou storage bloqueado
  }

  var temSessao = false;
  if (bruto) {
    try {
      var s = JSON.parse(bruto);
      // Basta ter com o que renovar: um access_token vencido ainda vira
      // sessão válida pelo refresh. Barrar aqui deslogaria à toa.
      temSessao = !!(s && (s.access_token || s.refresh_token));
    } catch (e) {
      temSessao = false;
    }
  }

  if (!temSessao) window.location.replace('index.html');
})();

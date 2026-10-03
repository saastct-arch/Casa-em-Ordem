/* Trava de acesso das telas internas.
 *
 * Roda no <head>, antes do support.js, e é síncrono de propósito: a
 * verificação anterior vivia dentro do componentDidMount, então dependia
 * do React montar. Com o CDN fora do ar, nada redirecionava e a página
 * protegida ficava aberta.
 *
 * Aqui só se olha se existe sessão guardada. Quem decide se ela vale é o
 * `exigirSessao` depois, que fala com o Supabase — esta trava é a primeira
 * barreira, não a definitiva. A RLS continua sendo a de verdade: sem
 * sessão válida o banco não devolve uma linha sequer.
 */
(function () {
  'use strict';

  var CHAVE = 'casa-em-ordem-sessao';
  var bruto = null;
  try {
    bruto = window.localStorage.getItem(CHAVE);
  } catch (e) {
    bruto = null; // navegação privada ou storage bloqueado
  }

  var temSessao = false;
  if (bruto) {
    try {
      var s = JSON.parse(bruto);
      // Basta ter com o que renovar: um access_token vencido ainda vira
      // sessão válida pelo refresh. Barrar aqui deslogaria a família à toa.
      temSessao = !!(s && (s.access_token || s.refresh_token));
    } catch (e) {
      temSessao = false;
    }
  }

  if (!temSessao) {
    window.location.replace('index.html');
  }
})();

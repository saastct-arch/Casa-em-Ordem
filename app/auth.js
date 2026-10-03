// Autenticação por PIN.
//
// O PIN não vai ao banco: ele é conferido pela edge function `pin-login`,
// que devolve a sessão de uma conta compartilhada pela família. O navegador
// guarda essa sessão e o supabase-js a renova sozinho.

import { sb } from "./supabase.js";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

/** Entra com o PIN. Lança Error com mensagem pronta para a tela. */
export async function entrarComPin(pin) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/pin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
    body: JSON.stringify({ pin: String(pin ?? "") }),
  });

  const corpo = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(corpo.error || "Não foi possível entrar.");

  const { error } = await sb.auth.setSession({
    access_token: corpo.access_token,
    refresh_token: corpo.refresh_token,
  });
  if (error) throw new Error("Não foi possível abrir a sessão.");

  return true;
}

export async function sair() {
  await sb.auth.signOut();
}

export async function estaAutenticado() {
  const { data } = await sb.auth.getSession();
  return Boolean(data.session);
}

/**
 * Protege uma página: se não houver sessão, manda para o login.
 * Chame no topo de cada tela interna.
 */
export async function exigirSessao(destinoLogin = "index.html") {
  if (await estaAutenticado()) return true;
  location.replace(destinoLogin);
  return false;
}

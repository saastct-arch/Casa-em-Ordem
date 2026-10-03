// Casa em Ordem — login por PIN
//
// A família compartilha um PIN de 4 dígitos. O PIN não é uma senha do
// Supabase: esta função o confere no servidor e, se bater, devolve a sessão
// de UMA conta compartilhada. Assim o navegador nunca recebe a senha real,
// e a chave publishable sozinha não abre nada (a RLS só libera
// `authenticated`).
//
// A senha da conta compartilhada é derivada do service-role key, que só
// existe aqui dentro. Isso evita guardar mais um segredo e mantém o
// login determinístico entre invocações.

import { createClient } from "jsr:@supabase/supabase-js@2";

const URL          = Deno.env.get("SUPABASE_URL")!;
const ANON         = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PIN_ESPERADO = Deno.env.get("FAMILY_PIN") ?? "0557";
const EMAIL        = Deno.env.get("SHARED_EMAIL") ?? "familia@casa-em-ordem.local";

// Depois de MAX_FALHAS erros o IP espera BLOQUEIO_MIN minutos.
// Sem isso um PIN de 4 dígitos cai em 10 mil tentativas.
const MAX_FALHAS  = 8;
const BLOQUEIO_MIN = 15;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

/** Comparação de tempo constante: não vaza quantos dígitos bateram. */
function iguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

/** Senha da conta compartilhada, derivada de um segredo que só o servidor tem. */
async function senhaCompartilhada(): Promise<string> {
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SERVICE),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const assinatura = await crypto.subtle.sign(
    "HMAC",
    chave,
    new TextEncoder().encode("casa-em-ordem/conta-compartilhada/v1"),
  );
  return btoa(String.fromCharCode(...new Uint8Array(assinatura)));
}

function ipDe(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0].trim() || "desconhecido";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")    return json({ error: "Método não permitido" }, 405);

  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
  const ip = ipDe(req);

  // --- throttle -----------------------------------------------------------
  const { data: tentativa } = await admin
    .from("pin_tentativas")
    .select("falhas, bloqueado_ate")
    .eq("ip", ip)
    .maybeSingle();

  if (tentativa?.bloqueado_ate && new Date(tentativa.bloqueado_ate) > new Date()) {
    const faltam = Math.ceil(
      (new Date(tentativa.bloqueado_ate).getTime() - Date.now()) / 60000,
    );
    return json(
      { error: `Muitas tentativas. Tente novamente em ${faltam} min.` },
      429,
    );
  }

  // --- confere o PIN ------------------------------------------------------
  let pin = "";
  try {
    pin = String((await req.json())?.pin ?? "");
  } catch {
    return json({ error: "Corpo inválido" }, 400);
  }

  if (!iguais(pin, PIN_ESPERADO)) {
    const falhas = (tentativa?.falhas ?? 0) + 1;
    await admin.from("pin_tentativas").upsert({
      ip,
      falhas,
      bloqueado_ate:
        falhas >= MAX_FALHAS
          ? new Date(Date.now() + BLOQUEIO_MIN * 60000).toISOString()
          : null,
      atualizado_em: new Date().toISOString(),
    });
    const restam = MAX_FALHAS - falhas;
    return json(
      {
        error:
          restam > 0
            ? `PIN incorreto. ${restam} tentativa(s) restante(s).`
            : `PIN incorreto. Acesso bloqueado por ${BLOQUEIO_MIN} min.`,
      },
      401,
    );
  }

  // --- PIN correto: devolve a sessão da conta compartilhada ---------------
  const senha = await senhaCompartilhada();
  const anon = createClient(URL, ANON, { auth: { persistSession: false } });

  let { data: sessao, error } = await anon.auth.signInWithPassword({
    email: EMAIL,
    password: senha,
  });

  if (error) {
    // Primeiro acesso: a conta ainda não existe.
    const { error: erroCriar } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: senha,
      email_confirm: true,
    });

    // Se já existia, a senha derivada mudou (service-role rotacionado):
    // realinha a senha em vez de travar a família fora do app.
    if (erroCriar) {
      const { data: lista } = await admin.auth.admin.listUsers();
      const existente = lista?.users.find((u) => u.email === EMAIL);
      if (!existente) return json({ error: "Falha ao preparar a conta" }, 500);
      await admin.auth.admin.updateUserById(existente.id, { password: senha });
    }

    ({ data: sessao, error } = await anon.auth.signInWithPassword({
      email: EMAIL,
      password: senha,
    }));
    if (error) return json({ error: "Falha ao autenticar" }, 500);
  }

  await admin.from("pin_tentativas").upsert({
    ip,
    falhas: 0,
    bloqueado_ate: null,
    atualizado_em: new Date().toISOString(),
  });

  return json({
    access_token:  sessao!.session!.access_token,
    refresh_token: sessao!.session!.refresh_token,
    expires_at:    sessao!.session!.expires_at,
  });
});

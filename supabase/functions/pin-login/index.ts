// Casa em Ordem — login por PIN
//
// Cada casa tem um PIN de 4 dígitos e uma conta própria. O PIN não é uma
// senha do Supabase: esta função o confere no servidor, descobre de qual
// casa ele é, e devolve a sessão daquela conta. O navegador nunca recebe
// a senha real, e a chave publishable sozinha não abre nada — a RLS filtra
// por casa, então uma casa jamais enxerga os dados da outra.
//
// A senha de cada conta é derivada do service-role key, que só existe aqui
// dentro. Evita guardar mais um segredo e mantém o login determinístico.

import { createClient } from "jsr:@supabase/supabase-js@2";

const URL          = Deno.env.get("SUPABASE_URL")!;
const ANON         = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Cada casa tem o seu PIN e a sua conta — a tabela `casas` faz o
// de-para. Assim dá para acrescentar uma casa sem publicar nada.

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

/** Senha da conta de uma casa, derivada de um segredo que só o servidor tem. */
async function senhaDaCasa(casaId: string): Promise<string> {
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
    new TextEncoder().encode("casa-em-ordem/conta/" + casaId),
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

  // Procura a casa cujo PIN bate. A comparação é em tempo constante para
  // não vazar quantos dígitos acertaram.
  const { data: casas } = await admin.from("casas").select("id, nome, pin, email");
  const casa = (casas ?? []).find((c) => iguais(pin, String(c.pin)));

  if (!casa) {
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

  // --- PIN correto: devolve a sessão da conta daquela casa ---------------
  const senha = await senhaDaCasa(casa.id);
  const EMAIL = casa.email;
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

  // Liga a conta à casa: é por aqui que a RLS sabe quais dados mostrar.
  const idDoUsuario = sessao!.user!.id;
  await admin.from("casa_contas").upsert({ user_id: idDoUsuario, casa_id: casa.id });

  await admin.from("pin_tentativas").upsert({
    ip,
    falhas: 0,
    bloqueado_ate: null,
    atualizado_em: new Date().toISOString(),
  });

  return json({
    casa: casa.nome,
    access_token:  sessao!.session!.access_token,
    refresh_token: sessao!.session!.refresh_token,
    expires_at:    sessao!.session!.expires_at,
  });
});

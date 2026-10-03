// Camada de dados do Casa em Ordem.
//
// As automações moram no banco (triggers e funções), não aqui. Por isso
// lançar, editar ou excluir uma saída já ajusta sozinho o saldo da dívida
// ou do cofrinho ligado à categoria — este arquivo só chama as operações.

import { sb } from "./supabase.js";

/** Erros do PostgREST viram Error com a mensagem do banco. */
function ok({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

/** CRUD padrão para as tabelas simples. */
function tabela(nome, ordem = { coluna: "created_at", crescente: false }) {
  return {
    async listar(filtros = {}) {
      let q = sb.from(nome).select("*");
      for (const [col, val] of Object.entries(filtros)) {
        if (val !== undefined && val !== null) q = q.eq(col, val);
      }
      return ok(await q.order(ordem.coluna, { ascending: ordem.crescente }));
    },
    async buscar(id) {
      return ok(await sb.from(nome).select("*").eq("id", id).single());
    },
    async criar(dados) {
      return ok(await sb.from(nome).insert(dados).select().single());
    },
    async atualizar(id, dados) {
      return ok(await sb.from(nome).update(dados).eq("id", id).select().single());
    },
    async excluir(id) {
      return ok(await sb.from(nome).delete().eq("id", id).select());
    },
  };
}

// ------------------------------------------------------------- cadastros
export const membros = tabela("membros", { coluna: "nome", crescente: true });
export const dividas = tabela("dividas");
export const cartoes = tabela("cartoes", { coluna: "nome", crescente: true });

// ----------------------------------------------------------- categorias
// Criadas na hora pela UI. `divida_id` ou `cofrinho_id` é o que liga a
// categoria a uma automação (uma ou outra, nunca as duas).
export const categorias = {
  ...tabela("categorias", { coluna: "nome", crescente: true }),

  async listarPorTipo(tipo) {
    return ok(
      await sb.from("categorias").select("*").eq("tipo", tipo).order("nome"),
    );
  },

  /** Reaproveita a categoria se o nome já existir naquele tipo. */
  async garantir(nome, tipo, extras = {}) {
    const existente = ok(
      await sb
        .from("categorias")
        .select("*")
        .eq("nome", nome)
        .eq("tipo", tipo)
        .maybeSingle(),
    );
    if (existente) return existente;
    return ok(
      await sb.from("categorias").insert({ nome, tipo, ...extras }).select().single(),
    );
  },
};

// ------------------------------------------------------------- cofrinhos
export const cofrinhos = {
  ...tabela("cofrinhos"),

  /**
   * Saque: tira do cofrinho e registra a entrada "Resgate" de uma vez.
   * O banco recusa se o saldo não cobrir o valor.
   */
  async sacar(cofrinhoId, valor, { data = null, membroId = null, descricao = null } = {}) {
    return ok(
      await sb.rpc("sacar_cofrinho", {
        p_cofrinho_id: cofrinhoId,
        p_valor: valor,
        p_data: data,
        p_membro_id: membroId,
        p_descricao: descricao,
      }),
    );
  },
};

// -------------------------------------------------------------- entradas
export const entradas = {
  ...tabela("entradas", { coluna: "data", crescente: false }),

  async doPeriodo(de, ate) {
    return ok(
      await sb
        .from("entradas")
        .select("*, categorias(nome, cor), membros(nome)")
        .gte("data", de)
        .lte("data", ate)
        .order("data", { ascending: false }),
    );
  },
};

// ---------------------------------------------------------------- saidas
export const saidas = {
  ...tabela("saidas", { coluna: "data", crescente: false }),

  async doPeriodo(de, ate) {
    return ok(
      await sb
        .from("saidas")
        .select("*, categorias(nome, cor), membros(nome), cartoes(nome)")
        .gte("data", de)
        .lte("data", ate)
        .order("data", { ascending: false }),
    );
  },

  /**
   * Compra parcelada no cartão: o banco gera uma parcela em cada fatura
   * seguinte até fechar o número de parcelas. Devolve o id do grupo.
   */
  async criarParcelada({
    descricao,
    valorTotal,
    cartaoId,
    numParcelas,
    dataCompra,
    categoriaId = null,
    membroId = null,
    observacao = null,
  }) {
    return ok(
      await sb.rpc("criar_compra_parcelada", {
        p_descricao: descricao,
        p_valor_total: valorTotal,
        p_cartao_id: cartaoId,
        p_num_parcelas: numParcelas,
        p_data_compra: dataCompra,
        p_categoria_id: categoriaId,
        p_membro_id: membroId,
        p_observacao: observacao,
      }),
    );
  },

  /** Todas as parcelas de uma compra, em ordem. */
  async parcelasDoGrupo(grupo) {
    return ok(
      await sb
        .from("saidas")
        .select("*")
        .eq("parcela_grupo", grupo)
        .order("parcela_num"),
    );
  },

  /**
   * Edita parcelas. `escopo`: "atual" só a informada, "futuras" ela e as
   * seguintes. Devolve quantas foram afetadas.
   */
  async editarParcelas(grupo, parcelaNum, escopo, campos = {}) {
    return ok(
      await sb.rpc("editar_parcelas", {
        p_grupo: grupo,
        p_parcela_num: parcelaNum,
        p_escopo: escopo,
        p_valor: campos.valor ?? null,
        p_descricao: campos.descricao ?? null,
        p_categoria_id: campos.categoriaId ?? null,
        p_membro_id: campos.membroId ?? null,
      }),
    );
  },

  /**
   * Exclui parcelas com o mesmo escopo do editar. Feito por filtro direto:
   * as triggers de saldo cuidam de desfazer o efeito de cada linha.
   */
  async excluirParcelas(grupo, parcelaNum, escopo) {
    if (escopo !== "atual" && escopo !== "futuras") {
      throw new Error('Escopo deve ser "atual" ou "futuras"');
    }
    let q = sb.from("saidas").delete().eq("parcela_grupo", grupo);
    q = escopo === "atual"
      ? q.eq("parcela_num", parcelaNum)
      : q.gte("parcela_num", parcelaNum);
    return ok(await q.select()).length;
  },
};

// ---------------------------------------------------------------- faturas
export const faturas = {
  /** Uma linha por cartão/ciclo, com à vista e parcelas separados. */
  async listar(cartaoId = null) {
    let q = sb.from("faturas").select("*");
    if (cartaoId) q = q.eq("cartao_id", cartaoId);
    return ok(await q.order("fechamento", { ascending: false }));
  },

  /** Os lançamentos que compõem uma fatura. */
  async lancamentos(cartaoId, fechamento) {
    return ok(
      await sb
        .from("saidas")
        .select("*, categorias(nome, cor), membros(nome)")
        .eq("cartao_id", cartaoId)
        .eq("competencia", fechamento)
        .order("data"),
    );
  },
};

// ----------------------------------------------------------------- resumo
export const resumo = {
  /** Totais do período para a tela de Resumo. */
  async periodo(de, ate) {
    const [ents, sais] = await Promise.all([
      entradas.doPeriodo(de, ate),
      saidas.doPeriodo(de, ate),
    ]);

    const soma = (lista) => lista.reduce((t, l) => t + Number(l.valor), 0);
    const totalEntradas = soma(ents);
    const totalSaidas = soma(sais);

    // Agrupa saídas por categoria para os gráficos.
    const porCategoria = new Map();
    for (const s of sais) {
      const nome = s.categorias?.nome ?? "Sem categoria";
      const atual = porCategoria.get(nome) ?? { nome, total: 0, cor: s.categorias?.cor };
      atual.total += Number(s.valor);
      porCategoria.set(nome, atual);
    }

    return {
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      entradas: ents,
      saidas: sais,
      porCategoria: [...porCategoria.values()].sort((a, b) => b.total - a.total),
    };
  },
};

// ---------------------------------------------------------------- realtime
/**
 * Avisa quando alguém da família mexe nos dados, para a tela se atualizar
 * sem recarregar. Devolve a função que cancela a inscrição.
 */
export function aoMudar(tabelas, callback) {
  const lista = Array.isArray(tabelas) ? tabelas : [tabelas];
  const canal = sb.channel(`casa-em-ordem-${lista.join("-")}`);
  for (const t of lista) {
    canal.on("postgres_changes", { event: "*", schema: "public", table: t }, callback);
  }
  canal.subscribe();
  return () => sb.removeChannel(canal);
}

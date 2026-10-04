/* Casa em Ordem — camada de dados.
 *
 * Script clássico de propósito: o runtime do design (support.js) avalia a
 * lógica de cada página com `new Function`, onde `import` não existe. Então
 * tudo é exposto em `window.Casa`.
 *
 * As automações moram no banco (triggers e funções). Lançar, editar ou
 * excluir já ajusta sozinho o saldo da dívida ou do cofrinho ligado à
 * categoria — nada disso é recalculado aqui.
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://ithttzcieeatkxnppxcf.supabase.co';
  // Chave publishable: pode ficar no cliente. Sozinha não abre nada — a RLS
  // só libera o papel `authenticated`, e a sessão vem do PIN.
  var SUPABASE_KEY = 'sb_publishable_oqO5z6ZxL4jGP3bPEV2v6w_18MPj3yF';

  if (!window.supabase || !window.supabase.createClient) {
    throw new Error('Casa em Ordem: supabase-js não carregou antes de casa.js');
  }

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'casa-em-ordem-sessao',
      // sessionStorage, não localStorage: fechou a aba, pede o PIN de
      // novo. O guard ainda apaga a chave quando a página é recarregada.
      storage: window.sessionStorage,
    },
  });

  /** Erros do PostgREST viram Error com a mensagem do banco. */
  function ok(res) {
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }

  function num(v) { return Number(v || 0); }

  // ------------------------------------------------------------- auth
  var auth = {
    async entrarComPin(pin) {
      var resp = await fetch(SUPABASE_URL + '/functions/v1/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
        body: JSON.stringify({ pin: String(pin == null ? '' : pin) }),
      });
      var corpo = await resp.json().catch(function () { return {}; });
      if (!resp.ok) throw new Error(corpo.error || 'Não foi possível entrar.');

      var r = await sb.auth.setSession({
        access_token: corpo.access_token,
        refresh_token: corpo.refresh_token,
      });
      if (r.error) throw new Error('Não foi possível abrir a sessão.');
      return true;
    },

    async sair() {
      await sb.auth.signOut();
      location.replace('index.html');
    },

    async temSessao() {
      var r = await sb.auth.getSession();
      return Boolean(r.data && r.data.session);
    },

    /** Protege uma tela: sem sessão, volta para o login. */
    async exigirSessao() {
      if (await auth.temSessao()) return true;
      location.replace('index.html');
      return false;
    },
  };

  // Sessão caiu no meio do uso (expirou, outro aparelho saiu, refresh
  // falhou): volta ao login na hora, sem esperar a próxima ação.
  sb.auth.onAuthStateChange(function (evento, sessao) {
    if (evento !== 'SIGNED_OUT' && sessao) return;
    if (evento !== 'SIGNED_OUT' && evento !== 'TOKEN_REFRESH_FAILED') return;
    var pagina = location.pathname.split('/').pop();
    if (pagina === 'index.html' || pagina === '' || pagina === '/') return;
    location.replace('index.html');
  });

  /**
   * A casa da sessão atual. O PIN do login é que decide qual é — a view
   * devolve só id e nome, nunca o PIN.
   */
  async function casaAtual() {
    var r = await sb.from('minha_casa_info').select('id, nome').maybeSingle();
    if (r.error) throw new Error(r.error.message);
    return r.data || { id: null, nome: '' };
  }

  // ---------------------------------------------------------- período
  /**
   * Converte o payload do PeriodFilter em intervalo de datas.
   * mode: 'mes' (month 0-indexed) | 'ano' | 'periodo'.
   */
  function periodoRange(p) {
    function iso(d) {
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    }
    if (!p) p = {};
    if (p.mode === 'periodo' && p.startDate && p.endDate) {
      return { de: p.startDate, ate: p.endDate };
    }
    if (p.mode === 'ano') {
      var y = p.year || new Date().getFullYear();
      return { de: y + '-01-01', ate: y + '-12-31' };
    }
    var year = p.year != null ? p.year : new Date().getFullYear();
    var month = p.month != null ? p.month : new Date().getMonth();
    return { de: iso(new Date(year, month, 1)), ate: iso(new Date(year, month + 1, 0)) };
  }

  // ------------------------------------------------------------ CRUD
  function tabela(nome, ordem) {
    ordem = ordem || { coluna: 'created_at', crescente: false };
    return {
      async listar(filtros) {
        var q = sb.from(nome).select('*');
        if (filtros) {
          Object.keys(filtros).forEach(function (col) {
            if (filtros[col] !== undefined && filtros[col] !== null) {
              q = q.eq(col, filtros[col]);
            }
          });
        }
        return ok(await q.order(ordem.coluna, { ascending: ordem.crescente }));
      },
      async criar(dados) {
        return ok(await sb.from(nome).insert(dados).select().single());
      },
      async atualizar(id, dados) {
        return ok(await sb.from(nome).update(dados).eq('id', id).select().single());
      },
      async excluir(id) {
        return ok(await sb.from(nome).delete().eq('id', id).select());
      },
    };
  }

  var membros = tabela('membros', { coluna: 'nome', crescente: true });
  var cartoes = Object.assign(tabela('cartoes', { coluna: 'nome', crescente: true }), {
    /** Lançamentos no crédito deste cartão: eles impedem a exclusão. */
    async contarLancamentos(id) {
      var r = await sb.from('saidas')
        .select('id', { count: 'exact', head: true })
        .eq('cartao_id', id);
      if (r.error) throw new Error(r.error.message);
      return r.count || 0;
    },
  });

  // ------------------------------------------------------ categorias
  var categorias = Object.assign(tabela('categorias', { coluna: 'nome', crescente: true }), {
    /**
     * Chave de estilo do CategoryChip. O design system colore por slug
     * ('casa', 'carro', …), não por id — então o chip recebe isto, e não o
     * uuid. Categoria criada pela família fica sem slug e cai no estilo
     * neutro, igual ao protótipo.
     */
    chipKey: function (cat) {
      if (!cat) return '';
      if (cat.slug) return cat.slug;
      if (cat.divida_id) return 'divida';
      if (cat.cofrinho_id) return 'futuro';
      return '';
    },

    async listarPorTipo(tipo) {
      return ok(await sb.from('categorias').select('*').eq('tipo', tipo).order('nome'));
    },

    /** Reaproveita a categoria se o nome já existir naquele tipo. */
    async garantir(nome, tipo) {
      var achada = ok(await sb.from('categorias').select('*')
        .eq('nome', nome).eq('tipo', tipo).maybeSingle());
      if (achada) return achada;
      return ok(await sb.from('categorias').insert({ nome: nome, tipo: tipo })
        .select().single());
    },
  });

  /**
   * Exclui dívida ou cofrinho junto com a categoria que o trigger criou.
   * O id da categoria é lido ANTES: depois da exclusão o vínculo vira
   * null e não dá mais para identificá-la. A categoria só some se
   * ninguém lançou nela — havendo histórico, ela fica, senão o lançamento
   * em Saídas perderia o nome.
   */
  async function excluirComCategoria(tabela, coluna, id) {
    var cat = ok(await sb.from('categorias').select('id').eq(coluna, id).maybeSingle());
    var apagado = ok(await sb.from(tabela).delete().eq('id', id).select());
    if (cat) {
      var usos = await sb.from('saidas')
        .select('id', { count: 'exact', head: true })
        .eq('categoria_id', cat.id);
      if (!usos.count) await sb.from('categorias').delete().eq('id', cat.id);
    }
    return apagado;
  }

  // --------------------------------------------------------- dívidas
  var dividas = Object.assign(tabela('dividas', { coluna: 'created_at', crescente: false }), {
    excluir(id) { return excluirComCategoria('dividas', 'divida_id', id); },

    /** Pagamentos de uma dívida = saídas na categoria vinculada a ela. */
    async pagamentos(dividaId) {
      var cat = ok(await sb.from('categorias').select('id')
        .eq('divida_id', dividaId).maybeSingle());
      if (!cat) return [];
      return ok(await sb.from('saidas').select('data, valor')
        .eq('categoria_id', cat.id).order('data', { ascending: false }));
    },
  });

  // ------------------------------------------------------- cofrinhos
  var cofrinhos = Object.assign(tabela('cofrinhos', { coluna: 'created_at', crescente: false }), {
    excluir(id) { return excluirComCategoria('cofrinhos', 'cofrinho_id', id); },

    /** Quantos saques já saíram deste cofrinho (eles impedem a exclusão). */
    async contarResgates(id) {
      var r = await sb.from('entradas')
        .select('id', { count: 'exact', head: true })
        .eq('cofrinho_id', id).eq('tipo', 'resgate');
      if (r.error) throw new Error(r.error.message);
      return r.count || 0;
    },

    /**
     * Saque: tira do cofrinho e registra a entrada "Resgate" de uma vez.
     * O banco recusa se o saldo não cobrir o valor.
     */
    async sacar(cofrinhoId, valor, opts) {
      opts = opts || {};
      return ok(await sb.rpc('sacar_cofrinho', {
        p_cofrinho_id: cofrinhoId,
        p_valor: valor,
        p_data: opts.data || null,
        p_membro_id: opts.membroId || null,
        p_descricao: opts.descricao || null,
      }));
    },

    /** Ajuste manual de saldo (rendimento). Valor assinado. */
    async rendimento(cofrinhoId, valor, data) {
      return ok(await sb.from('cofrinho_rendimentos')
        .insert({ cofrinho_id: cofrinhoId, valor: valor, data: data || undefined })
        .select().single());
    },

    /**
     * Histórico do cofrinho: aportes (saídas na categoria vinculada),
     * saques (entradas de resgate) e rendimentos, em uma linha do tempo.
     */
    async historico(cofrinhoId) {
      var cat = ok(await sb.from('categorias').select('id')
        .eq('cofrinho_id', cofrinhoId).maybeSingle());

      var aportes = cat
        ? ok(await sb.from('saidas').select('data, valor').eq('categoria_id', cat.id))
        : [];
      var saques = ok(await sb.from('entradas').select('data, valor')
        .eq('cofrinho_id', cofrinhoId).eq('tipo', 'resgate'));
      var rends = ok(await sb.from('cofrinho_rendimentos').select('data, valor')
        .eq('cofrinho_id', cofrinhoId));

      var linhas = [];
      aportes.forEach(function (a) {
        linhas.push({ tipo: 'aporte', data: a.data, valor: num(a.valor) });
      });
      saques.forEach(function (s) {
        linhas.push({ tipo: 'saque', data: s.data, valor: num(s.valor) });
      });
      rends.forEach(function (r) {
        var v = num(r.valor);
        linhas.push({ tipo: v >= 0 ? 'rendimento' : 'saque', data: r.data, valor: Math.abs(v) });
      });

      return linhas.sort(function (a, b) { return b.data.localeCompare(a.data); });
    },
  });

  // -------------------------------------------------------- entradas
  // -------------------------------------------------------- carteiras
  // Vales (VR/VA). O saldo não mora em coluna: vem da view `carteiras_saldo`,
  // que soma o extrato. Editar ou apagar um lançamento acerta o saldo sozinho.
  var carteiras = Object.assign(tabela('carteiras', { coluna: 'nome', crescente: true }), {
    async comSaldo() {
      return ok(await sb.from('carteiras_saldo').select('*').order('nome'));
    },
    // Créditos e débitos de uma carteira na mesma lista, do mais novo ao mais velho.
    async extrato(carteiraId) {
      var creditos = ok(await sb.from('entradas')
        .select('id, descricao, valor, data, observacao, membros(nome)')
        .eq('carteira_id', carteiraId));
      var debitos = ok(await sb.from('saidas')
        .select('id, descricao, valor, data, observacao, categorias(nome, slug), membros(nome)')
        .eq('carteira_id', carteiraId));
      var linhas = (creditos || []).map(function (e) {
        return { id: e.id, origem: 'entrada', sinal: 1, descricao: e.descricao,
                 valor: num(e.valor), data: e.data, observacao: e.observacao,
                 categoria: null, membro: e.membros && e.membros.nome };
      }).concat((debitos || []).map(function (s) {
        return { id: s.id, origem: 'saida', sinal: -1, descricao: s.descricao,
                 valor: num(s.valor), data: s.data, observacao: s.observacao,
                 categoria: s.categorias && s.categorias.nome,
                 slug: s.categorias && s.categorias.slug,
                 membro: s.membros && s.membros.nome };
      }));
      linhas.sort(function (a, b) {
        if (a.data === b.data) return a.origem < b.origem ? 1 : -1;
        return a.data < b.data ? 1 : -1;
      });
      return linhas;
    },
  });

  var entradas = Object.assign(tabela('entradas', { coluna: 'data', crescente: false }), {
    async doPeriodo(p) {
      var r = periodoRange(p);
      return ok(await sb.from('entradas')
        .select('*, categorias(nome, slug), membros(nome), cofrinhos(nome), carteiras(nome)')
        .gte('data', r.de).lte('data', r.ate)
        .order('data', { ascending: false }));
    },
  });

  // ---------------------------------------------------------- saídas
  var saidas = Object.assign(tabela('saidas', { coluna: 'data', crescente: false }), {
    /**
     * Boletos de um intervalo de vencimento. Consulta a tabela `saidas`, e é
     * daqui que Resumo e Faturas a chamam — estava em `faturas` por engano, e
     * `Casa.saidas.boletos` indefinido derrubava o carregamento das duas telas.
     */
    async boletos(de, ate) {
      var q = sb.from('saidas')
        .select('*, categorias(nome, slug), membros(nome)')
        .eq('forma_pagamento', 'boleto');
      if (de) q = q.gte('vencimento', de);
      if (ate) q = q.lte('vencimento', ate);
      return ok(await q.order('vencimento'));
    },

    async doPeriodo(p) {
      var r = periodoRange(p);
      return ok(await sb.from('saidas')
        .select('*, categorias(nome, slug, divida_id, cofrinho_id), membros(nome), cartoes(nome), carteiras(nome)')
        .gte('data', r.de).lte('data', r.ate)
        .order('data', { ascending: false }));
    },

    /**
     * Parcelamento, de cartão ou de boleto. No cartão as parcelas seguem o
     * ciclo de fechamento; no boleto é carnê, com um vencimento por mês a
     * partir da data informada. Devolve o id do grupo.
     */
    async criarParcelado(o) {
      return ok(await sb.rpc('criar_parcelado', {
        p_descricao: o.descricao,
        p_valor_total: o.valorTotal,
        p_num_parcelas: o.numParcelas,
        p_forma: o.forma,
        p_cartao_id: o.cartaoId || null,
        p_vencimento: o.vencimento || null,
        p_data_compra: o.dataCompra,
        p_categoria_id: o.categoriaId || null,
        p_membro_id: o.membroId || null,
        p_observacao: o.observacao || null,
      }));
    },

    /** escopo: 'atual' só esta parcela, 'futuras' esta e as seguintes. */
    async editarParcelas(grupo, parcelaNum, escopo, campos) {
      campos = campos || {};
      return ok(await sb.rpc('editar_parcelas', {
        p_grupo: grupo,
        p_parcela_num: parcelaNum,
        p_escopo: escopo,
        p_valor: campos.valor == null ? null : campos.valor,
        p_descricao: campos.descricao == null ? null : campos.descricao,
        p_categoria_id: campos.categoriaId || null,
        p_membro_id: campos.membroId || null,
      }));
    },

    /**
     * Exclui parcelas com o mesmo escopo do editar. Filtro direto: as
     * triggers de saldo desfazem o efeito de cada linha removida.
     */
    async excluirParcelas(grupo, parcelaNum, escopo) {
      if (escopo !== 'atual' && escopo !== 'futuras') {
        throw new Error('Escopo deve ser "atual" ou "futuras"');
      }
      var q = sb.from('saidas').delete().eq('parcela_grupo', grupo);
      q = escopo === 'atual'
        ? q.eq('parcela_num', parcelaNum)
        : q.gte('parcela_num', parcelaNum);
      return ok(await q.select()).length;
    },
  });

  // --------------------------------------------------------- faturas
  var faturas = {
    /** Uma linha por cartão/ciclo, com à vista e parcelas separados. */
    async listar(cartaoId) {
      var q = sb.from('faturas').select('*');
      if (cartaoId) q = q.eq('cartao_id', cartaoId);
      return ok(await q.order('fechamento', { ascending: false }));
    },

    /** Os lançamentos que compõem uma fatura. */
    async lancamentos(cartaoId, fechamento) {
      return ok(await sb.from('saidas')
        .select('*, categorias(nome, slug), membros(nome)')
        .eq('cartao_id', cartaoId).eq('competencia', fechamento)
        .order('data'));
    },

    /** Parcelas que ainda vão cair em faturas futuras deste cartão. */
    async comprometidoFuturo(cartaoId, depoisDe) {
      return ok(await sb.from('saidas')
        .select('valor, competencia, parcela_num, parcela_total')
        .eq('cartao_id', cartaoId)
        .not('parcela_grupo', 'is', null)
        .gt('competencia', depoisDe)
        .order('competencia'));
    },
  };

  // -------------------------------------------------------- realtime
  /**
   * Avisa quando alguém da família mexe nos dados, para a tela atualizar
   * sem recarregar. Devolve a função que cancela a inscrição.
   */
  function aoMudar(tabelas, callback) {
    var lista = Array.isArray(tabelas) ? tabelas : [tabelas];
    var canal = sb.channel('casa-' + lista.join('-') + '-' + Math.random().toString(36).slice(2));
    lista.forEach(function (t) {
      canal.on('postgres_changes', { event: '*', schema: 'public', table: t }, callback);
    });
    canal.subscribe();
    return function () { sb.removeChannel(canal); };
  }

  window.Casa = {
    sb: sb,
    auth: auth,
    casaAtual: casaAtual,
    periodoRange: periodoRange,
    membros: membros,
    categorias: categorias,
    dividas: dividas,
    cofrinhos: cofrinhos,
    cartoes: cartoes,
    carteiras: carteiras,
    entradas: entradas,
    saidas: saidas,
    faturas: faturas,
    aoMudar: aoMudar,
  };
})();

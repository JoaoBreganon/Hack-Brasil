import {
	type ContextoDaSugestao,
	type EntradaDaNecessidade,
	gerarSugestoesPorRegras,
	LIMITES,
	montarPlanoDeCompra,
	type OrigemDaSugestao,
	type ResultadoDaSugestao,
	validarPedido,
	validarSugestoes,
} from "@aloca/dominio";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";
import { falhar, mensagemDoErro } from "./lib/falha";
import { type ConfiguracaoDoLlm, lerConfiguracaoDoLlm, sugerirItensComLlm } from "./lib/llm";
import { itensComOrcamentos, paraNecessidade, planoEditavel } from "./lib/plano";
import { buscarSaldoAtual } from "./saldos";
import { MENSAGEM_DO_LIMITE, tentarUso } from "./usos";

const INTERVALO_ENTRE_SUGESTOES_COM_IA_EM_MS = 60_000;

type Preparo = {
	contexto: Omit<ContextoDaSugestao, "pedido">;
	usarIa: boolean;
	aviso?: string;
};

type Geracao = {
	origem: OrigemDaSugestao;
	sugestoes: EntradaDaNecessidade[];
	aviso?: string;
};

type Registro = Omit<ResultadoDaSugestao, "origem" | "aviso">;

const sugestaoRecebida = v.object({
	descricao: v.string(),
	tipo: v.string(),
	quantidade: v.number(),
	prioridade: v.number(),
});

export const preparar = internalMutation({
	args: { codigoInep: v.string(), comIa: v.boolean() },
	handler: async (ctx, { codigoInep, comIa }): Promise<Preparo> => {
		const { escola, plano } = await planoEditavel(ctx, codigoInep);
		const saldo = (await buscarSaldoAtual(ctx, escola._id)) ?? falhar("Busque o saldo da escola antes de montar o plano.");
		const itens = await itensComOrcamentos(ctx, plano._id);
		if (itens.length >= LIMITES.itensPorPlano) {
			falhar(`O plano aceita até ${LIMITES.itensPorPlano} itens.`);
		}
		const maiorPrioridade = itens.reduce((maior, { prioridade }) => Math.max(maior, prioridade), 0);
		const contexto = {
			saldo: montarPlanoDeCompra(saldo.saldo, itens.map(paraNecessidade)).saldoRestante,
			jaNoPlano: itens.map(({ descricao }) => descricao),
			primeiraPrioridade: Math.min(LIMITES.prioridade.maximo, maiorPrioridade + 1),
		};
		if (!comIa) {
			return { contexto, usarIa: false };
		}
		const agora = Date.now();
		if (plano.sugestaoComIaEm && agora - plano.sugestaoComIaEm < INTERVALO_ENTRE_SUGESTOES_COM_IA_EM_MS) {
			falhar("A IA acabou de sugerir itens para esta escola. Espere um minuto para pedir de novo.");
		}
		if (!(await tentarUso(ctx, "sugestão com IA"))) {
			return { contexto, usarIa: false, aviso: MENSAGEM_DO_LIMITE["sugestão com IA"] };
		}
		await ctx.db.patch(plano._id, { sugestaoComIaEm: agora });
		return { contexto, usarIa: true };
	},
});

export const registrar = internalMutation({
	args: { codigoInep: v.string(), sugestoes: v.array(sugestaoRecebida) },
	handler: async (ctx, { codigoInep, sugestoes }): Promise<Registro> => {
		const { plano } = await planoEditavel(ctx, codigoInep);
		const existentes = await ctx.db
			.query("item")
			.withIndex("por_plano_prioridade", (q) => q.eq("planoId", plano._id))
			.collect();
		const { aceitas, bloqueadas, descartadas } = validarSugestoes(
			sugestoes,
			existentes.map(({ descricao }) => descricao),
		);
		for (const necessidade of aceitas) {
			await ctx.db.insert("item", { planoId: plano._id, ...necessidade });
		}
		return { adicionados: aceitas.length, bloqueadas, descartadas };
	},
});

async function gerarSugestoes(configuracao: ConfiguracaoDoLlm | null, contexto: ContextoDaSugestao): Promise<Geracao> {
	if (!configuracao) {
		return { origem: "regras", sugestoes: gerarSugestoesPorRegras(contexto) };
	}
	try {
		return { origem: "ia", sugestoes: await sugerirItensComLlm(configuracao, contexto) };
	} catch (erro) {
		return {
			origem: "regras",
			sugestoes: gerarSugestoesPorRegras(contexto),
			aviso: `A IA não respondeu (${mensagemDoErro(erro)}). Estas sugestões vieram das regras fixas do PDDE.`,
		};
	}
}

export const gerar = action({
	args: { codigoInep: v.string(), pedido: v.optional(v.string()) },
	handler: async (ctx, { codigoInep, pedido = "" }): Promise<ResultadoDaSugestao> => {
		const validacao = validarPedido(pedido);
		if (!validacao.ok) {
			falhar(Object.values(validacao.erros).join(" "));
		}
		const configuracao = lerConfiguracaoDoLlm();
		const preparo: Preparo = await ctx.runMutation(internal.sugestoes.preparar, { codigoInep, comIa: configuracao !== null });
		const contexto: ContextoDaSugestao = {
			...preparo.contexto,
			...(validacao.valor.pedido ? { pedido: validacao.valor.pedido } : {}),
		};
		const geracao = await gerarSugestoes(preparo.usarIa ? configuracao : null, contexto);
		const registro: Registro = await ctx.runMutation(internal.sugestoes.registrar, { codigoInep, sugestoes: geracao.sugestoes });
		const aviso = geracao.aviso ?? preparo.aviso;
		return { origem: geracao.origem, ...registro, ...(aviso ? { aviso } : {}) };
	},
});

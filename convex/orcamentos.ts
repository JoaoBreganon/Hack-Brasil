import { cotacoesDeExemplo, LIMITES, ORCAMENTOS_EXIGIDOS, validarCotacao } from "@aloca/dominio";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, type MutationCtx } from "./_generated/server";
import { falhar } from "./lib/falha";
import { itemEditavel } from "./lib/plano";

function orcamentosDoItem(ctx: MutationCtx, itemId: Id<"item">) {
	return ctx.db
		.query("orcamento")
		.withIndex("por_item", (q) => q.eq("itemId", itemId))
		.collect();
}

export const adicionar = mutation({
	args: { itemId: v.id("item"), fornecedor: v.string(), valorEmCentavos: v.number(), endereco: v.optional(v.string()) },
	handler: async (ctx, { itemId, ...entrada }) => {
		await itemEditavel(ctx, itemId);
		const validacao = validarCotacao(entrada);
		if (!validacao.ok) {
			falhar(Object.values(validacao.erros).join(" "));
		}
		if ((await orcamentosDoItem(ctx, itemId)).length >= LIMITES.orcamentosPorItem) {
			falhar(`Cada item aceita até ${LIMITES.orcamentosPorItem} orçamentos.`);
		}
		return ctx.db.insert("orcamento", { itemId, ...validacao.valor, origem: "manual", coletadoEm: Date.now() });
	},
});

export const remover = mutation({
	args: { orcamentoId: v.id("orcamento") },
	handler: async (ctx, { orcamentoId }) => {
		const orcamento = (await ctx.db.get(orcamentoId)) ?? falhar("Este orçamento não existe mais.");
		await itemEditavel(ctx, orcamento.itemId);
		await ctx.db.delete(orcamentoId);
	},
});

export const registrarDaBusca = internalMutation({
	args: {
		itemId: v.id("item"),
		cotacoes: v.array(v.object({ fornecedor: v.string(), valorEmCentavos: v.number(), endereco: v.optional(v.string()) })),
	},
	handler: async (ctx, { itemId, cotacoes }) => {
		await itemEditavel(ctx, itemId);
		const existentes = await orcamentosDoItem(ctx, itemId);
		const enderecos = new Set(existentes.flatMap(({ endereco }) => (endereco ? [endereco] : [])));
		const vagas = LIMITES.orcamentosPorItem - existentes.length;
		const novas = cotacoes
			.filter((cotacao) => validarCotacao(cotacao).ok && !(cotacao.endereco && enderecos.has(cotacao.endereco)))
			.slice(0, Math.max(0, vagas));
		const agora = Date.now();
		await Promise.all(novas.map((cotacao) => ctx.db.insert("orcamento", { itemId, ...cotacao, origem: "busca", coletadoEm: agora })));
		return novas.length;
	},
});

export const registrarExemplos = internalMutation({
	args: { itemId: v.id("item") },
	handler: async (ctx, { itemId }) => {
		const { item } = await itemEditavel(ctx, itemId);
		const existentes = await orcamentosDoItem(ctx, itemId);
		const cotacoes = cotacoesDeExemplo(
			item,
			existentes.map(({ fornecedor }) => fornecedor),
			ORCAMENTOS_EXIGIDOS - existentes.length,
		);
		const agora = Date.now();
		await Promise.all(
			cotacoes.map((cotacao) => ctx.db.insert("orcamento", { itemId, ...cotacao, origem: "exemplo", coletadoEm: agora })),
		);
		return cotacoes.length;
	},
});

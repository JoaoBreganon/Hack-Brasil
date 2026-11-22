import { LIMITES, NECESSIDADES_EXEMPLO, validarJustificativa, validarNecessidade } from "@aloca/dominio";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation, type MutationCtx } from "./_generated/server";
import { falhar } from "./lib/falha";
import { itemEditavel, planoEditavel } from "./lib/plano";
import { tipoDeDespesa } from "./schema";

async function itensDoPlano(ctx: MutationCtx, planoId: Id<"plano">) {
	return ctx.db
		.query("item")
		.withIndex("por_plano_prioridade", (q) => q.eq("planoId", planoId))
		.collect();
}

export const adicionar = mutation({
	args: { codigoInep: v.string(), descricao: v.string(), tipo: tipoDeDespesa, quantidade: v.number(), prioridade: v.number() },
	handler: async (ctx, { codigoInep, ...entrada }) => {
		const validacao = validarNecessidade(entrada);
		if (!validacao.ok) {
			falhar(Object.values(validacao.erros).join(" "));
		}
		const { plano } = await planoEditavel(ctx, codigoInep);
		if ((await itensDoPlano(ctx, plano._id)).length >= LIMITES.itensPorPlano) {
			falhar(`O plano aceita até ${LIMITES.itensPorPlano} itens.`);
		}
		return ctx.db.insert("item", { planoId: plano._id, ...validacao.valor });
	},
});

export const remover = mutation({
	args: { itemId: v.id("item") },
	handler: async (ctx, { itemId }) => {
		await itemEditavel(ctx, itemId);
		const orcamentos = await ctx.db
			.query("orcamento")
			.withIndex("por_item", (q) => q.eq("itemId", itemId))
			.collect();
		await Promise.all(orcamentos.map(({ _id }) => ctx.db.delete(_id)));
		await ctx.db.delete(itemId);
	},
});

export const justificar = mutation({
	args: { itemId: v.id("item"), justificativa: v.string() },
	handler: async (ctx, { itemId, justificativa }) => {
		await itemEditavel(ctx, itemId);
		if (!justificativa.trim()) {
			await ctx.db.patch(itemId, { justificativaParaMenosOrcamentos: undefined });
			return;
		}
		const validacao = validarJustificativa(justificativa);
		if (!validacao.ok) {
			falhar(Object.values(validacao.erros).join(" "));
		}
		await ctx.db.patch(itemId, { justificativaParaMenosOrcamentos: validacao.valor.justificativa });
	},
});

export const preencherComExemplo = mutation({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const { plano } = await planoEditavel(ctx, codigoInep);
		if ((await itensDoPlano(ctx, plano._id)).length > 0) {
			falhar("O exemplo só entra num plano vazio.");
		}
		const agora = Date.now();
		for (const { descricao, tipo, quantidade, prioridade, cotacoes } of NECESSIDADES_EXEMPLO) {
			const itemId = await ctx.db.insert("item", { planoId: plano._id, descricao, tipo, quantidade, prioridade });
			for (const { fornecedor, valorEmCentavos } of cotacoes) {
				await ctx.db.insert("orcamento", { itemId, fornecedor, valorEmCentavos, origem: "exemplo", coletadoEm: agora });
			}
		}
	},
});

export const paraBusca = internalQuery({
	args: { itemId: v.id("item") },
	handler: async (ctx, { itemId }) => {
		const item = await ctx.db.get(itemId);
		const plano = item && (await ctx.db.get(item.planoId));
		if (!item || !plano) {
			return null;
		}
		const orcamentos = await ctx.db
			.query("orcamento")
			.withIndex("por_item", (q) => q.eq("itemId", itemId))
			.collect();
		return {
			descricao: item.descricao,
			tipo: item.tipo,
			editavel: plano.status !== "aprovado",
			buscaDePrecoEm: item.buscaDePrecoEm ?? null,
			enderecos: orcamentos.flatMap(({ endereco }) => (endereco ? [endereco] : [])),
		};
	},
});

export const buscasDesde = internalQuery({
	args: { desde: v.number() },
	handler: async (ctx, { desde }) => {
		const recentes = await ctx.db
			.query("item")
			.withIndex("por_busca_de_preco", (q) => q.gt("buscaDePrecoEm", desde))
			.take(LIMITES.buscasDePrecoPorHora);
		return recentes.length;
	},
});

export const marcarBusca = internalMutation({
	args: { itemId: v.id("item"), em: v.number() },
	handler: async (ctx, { itemId, em }) => {
		await ctx.db.patch(itemId, { buscaDePrecoEm: em });
	},
});

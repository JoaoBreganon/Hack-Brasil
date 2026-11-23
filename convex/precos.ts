import { cotacoesDaBusca, type MotivoDoExemplo, REGRAS_POR_TIPO, type ResultadoDaBuscaDePrecos } from "@aloca/dominio";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, type ActionCtx } from "./_generated/server";
import { falhar, mensagemDoErro } from "./lib/falha";
import { buscarPrecosNaWeb } from "./lib/firecrawl";

async function usarExemplos(ctx: ActionCtx, itemId: Id<"item">, motivo: MotivoDoExemplo): Promise<ResultadoDaBuscaDePrecos> {
	const encontrados: number = await ctx.runMutation(internal.orcamentos.registrarExemplos, { itemId });
	return { origem: "exemplo", encontrados, motivo };
}

export const buscar = action({
	args: { itemId: v.id("item") },
	handler: async (ctx, { itemId }): Promise<ResultadoDaBuscaDePrecos> => {
		const item = (await ctx.runQuery(internal.itens.paraBusca, { itemId })) ?? falhar("Este item não existe mais.");
		if (!item.editavel) {
			falhar("O plano já foi aprovado. Reabra o plano para fazer mudanças.");
		}
		if (!REGRAS_POR_TIPO[item.tipo].permitido) {
			falhar(`O PDDE não paga ${item.tipo}, então não há preço para buscar.`);
		}
		const chave = process.env.FIRECRAWL_API_KEY;
		if (!chave) {
			return usarExemplos(ctx, itemId, "sem configuração");
		}
		const liberada: boolean = await ctx.runMutation(internal.itens.reservarBusca, { itemId });
		if (!liberada) {
			return usarExemplos(ctx, itemId, "limite");
		}
		const resultados = await buscarPrecosNaWeb(chave, item.descricao).catch((erro: unknown) => {
			console.warn(`A busca de preços no Firecrawl falhou: ${mensagemDoErro(erro)}`);
			return null;
		});
		if (!resultados) {
			return usarExemplos(ctx, itemId, "falha");
		}
		const jaSalvos = new Set(item.enderecos);
		const cotacoes = cotacoesDaBusca(resultados.filter(({ url }) => !jaSalvos.has(url)));
		if (cotacoes.length === 0) {
			return usarExemplos(ctx, itemId, "sem preço");
		}
		const encontrados: number = await ctx.runMutation(internal.orcamentos.registrarDaBusca, { itemId, cotacoes });
		return { origem: "busca", encontrados };
	},
});

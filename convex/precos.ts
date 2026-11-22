import { cotacoesDaBusca, LIMITES, type MotivoDoExemplo, REGRAS_POR_TIPO, type ResultadoDaBuscaDePrecos } from "@aloca/dominio";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, type ActionCtx } from "./_generated/server";
import { falhar, mensagemDoErro } from "./lib/falha";
import { buscarPrecosNaWeb } from "./lib/firecrawl";

const INTERVALO_ENTRE_BUSCAS_EM_MS = 60_000;
const HORA_EM_MS = 60 * 60_000;

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
		const agora = Date.now();
		if (item.buscaDePrecoEm && agora - item.buscaDePrecoEm < INTERVALO_ENTRE_BUSCAS_EM_MS) {
			falhar("Uma busca de preços acabou de rodar para este item. Espere um minuto para buscar de novo.");
		}
		const buscasNaUltimaHora: number = await ctx.runQuery(internal.itens.buscasDesde, { desde: agora - HORA_EM_MS });
		if (buscasNaUltimaHora >= LIMITES.buscasDePrecoPorHora) {
			return usarExemplos(ctx, itemId, "limite");
		}
		await ctx.runMutation(internal.itens.marcarBusca, { itemId, em: agora });
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

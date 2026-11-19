import { cotacoesDaBusca, LIMITES } from "@aloca/dominio";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { falhar, mensagemDoErro } from "./lib/falha";
import { buscarPrecosNaWeb } from "./lib/firecrawl";

const INTERVALO_ENTRE_BUSCAS_EM_MS = 60_000;
const HORA_EM_MS = 60 * 60_000;

export const buscar = action({
	args: { itemId: v.id("item") },
	handler: async (ctx, { itemId }): Promise<{ encontrados: number }> => {
		const chave =
			process.env.FIRECRAWL_API_KEY ?? falhar("A busca de preços ainda não está configurada. Adicione os orçamentos à mão.");
		const item = (await ctx.runQuery(internal.itens.paraBusca, { itemId })) ?? falhar("Este item não existe mais.");
		if (!item.editavel) {
			falhar("O plano já foi aprovado. Reabra o plano para fazer mudanças.");
		}
		const agora = Date.now();
		if (item.buscaDePrecoEm && agora - item.buscaDePrecoEm < INTERVALO_ENTRE_BUSCAS_EM_MS) {
			falhar("Uma busca de preços acabou de rodar para este item. Espere um minuto para buscar de novo.");
		}
		const buscasNaUltimaHora: number = await ctx.runQuery(internal.itens.buscasDesde, { desde: agora - HORA_EM_MS });
		if (buscasNaUltimaHora >= LIMITES.buscasDePrecoPorHora) {
			falhar("Muitas buscas de preço na última hora. Tente de novo mais tarde ou anote os orçamentos à mão.");
		}
		await ctx.runMutation(internal.itens.marcarBusca, { itemId, em: agora });
		const resultados = await buscarPrecosNaWeb(chave, item.descricao).catch((erro: unknown) =>
			falhar(`A busca de preços falhou (${mensagemDoErro(erro)}). Tente de novo ou adicione à mão.`),
		);
		const jaSalvos = new Set(item.enderecos);
		const cotacoes = cotacoesDaBusca(resultados.filter(({ url }) => !jaSalvos.has(url)));
		const encontrados: number = await ctx.runMutation(internal.orcamentos.registrarDaBusca, { itemId, cotacoes });
		return { encontrados };
	},
});

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { buscarEscola } from "./escolas";
import { exigirEdicao } from "./lib/acesso";
import { falhar } from "./lib/falha";
import { buscarPlano, calcularPlano } from "./lib/plano";
import { buscarSaldoAtual } from "./saldos";

export const aprovar = mutation({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const escola = (await buscarEscola(ctx, codigoInep)) ?? falhar("Esta escola ainda não foi buscada.");
		await exigirEdicao(ctx, escola);
		const [planoAtual, saldoAtual] = await Promise.all([buscarPlano(ctx, escola._id), buscarSaldoAtual(ctx, escola._id)]);
		const plano = planoAtual ?? falhar("Monte o plano antes de aprovar.");
		const saldo = saldoAtual ?? falhar("Busque o saldo da escola antes de aprovar.");
		if (plano.status === "aprovado") {
			return;
		}
		const { itens, totalPorCategoria } = await calcularPlano(ctx, plano._id, saldo.saldo);
		if (itens.length === 0) {
			falhar("Nenhum item está pronto para compra. Confira os orçamentos e as regras antes de aprovar.");
		}
		await ctx.db.patch(plano._id, {
			status: "aprovado",
			aprovadoEm: Date.now(),
			saldoId: saldo._id,
			totalAprovadoEmCentavos: totalPorCategoria.custeio + totalPorCategoria.capital,
		});
	},
});

export const reabrir = mutation({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const escola = (await buscarEscola(ctx, codigoInep)) ?? falhar("Esta escola ainda não foi buscada.");
		await exigirEdicao(ctx, escola);
		const plano = (await buscarPlano(ctx, escola._id)) ?? falhar("Esta escola ainda não tem plano.");
		await ctx.db.patch(plano._id, { status: "rascunho", aprovadoEm: undefined, totalAprovadoEmCentavos: undefined });
	},
});

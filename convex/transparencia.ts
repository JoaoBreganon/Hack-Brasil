import { ehEscolaDeDemonstracao } from "@aloca/dominio";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { buscarEscola } from "./escolas";
import { exigirMembro } from "./lib/acesso";
import { falhar } from "./lib/falha";
import { buscarPlano, calcularPlano } from "./lib/plano";

const ESCOLAS_NO_MAPA_DO_SITE = 1000;

export const daEscola = query({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const escola = await buscarEscola(ctx, codigoInep);
		if (!escola || !(escola.publicadaEm || ehEscolaDeDemonstracao(escola.codigoInep))) {
			return null;
		}
		const plano = await buscarPlano(ctx, escola._id);
		const aprovado = plano?.status === "aprovado" ? plano : null;
		const saldo = aprovado ? await ctx.db.get(aprovado.saldoId) : null;
		const calculado = aprovado && saldo ? await calcularPlano(ctx, aprovado._id, saldo.saldo) : null;
		return {
			escola: { codigoInep: escola.codigoInep, nome: escola.nome, municipio: escola.municipio },
			plano:
				aprovado && saldo && calculado
					? {
							aprovadoEm: aprovado.aprovadoEm ?? aprovado._creationTime,
							exercicio: saldo.exercicio,
							saldo: saldo.saldo,
							fonte: saldo.fonte,
							coletadoEm: saldo.coletadoEm,
							total: calculado.totalPorCategoria,
							itens: calculado.itens.map(({ necessidade, validacao }) => ({
								descricao: necessidade.descricao,
								categoria: validacao.categoria,
								quantidade: necessidade.quantidade,
								fornecedor: validacao.escolha?.vencedora.fornecedor ?? "",
								totalEmCentavos: validacao.totalEmCentavos,
							})),
						}
					: null,
		};
	},
});

export const publicadas = query({
	args: {},
	handler: async (ctx) => {
		const escolas = await ctx.db
			.query("escola")
			.withIndex("por_publicacao", (q) => q.gt("publicadaEm", 0))
			.order("desc")
			.take(ESCOLAS_NO_MAPA_DO_SITE);
		return escolas.map(({ codigoInep, publicadaEm }) => ({ codigoInep, publicadaEm: publicadaEm ?? 0 }));
	},
});

export const publicar = mutation({
	args: { codigoInep: v.string(), publicar: v.boolean() },
	handler: async (ctx, { codigoInep, publicar }) => {
		const escola = (await buscarEscola(ctx, codigoInep)) ?? falhar("Busque o saldo da escola antes de continuar.");
		if (ehEscolaDeDemonstracao(codigoInep)) {
			falhar("A página da escola de demonstração fica sempre no ar.");
		}
		await exigirMembro(ctx, escola);
		await ctx.db.patch(escola._id, { publicadaEm: publicar ? (escola.publicadaEm ?? Date.now()) : undefined });
	},
});

import { importarSaldosCsv } from "@aloca/dominio";
import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { buscarEscola, salvarEscola } from "./escolas";
import { camposDaEscola, fonteDoDado, saldoPorCategoria } from "./schema";

export const maisRecente = query({
	args: { codigoInep: v.string(), exercicio: v.number() },
	handler: async (ctx, { codigoInep, exercicio }) => {
		const escola = await buscarEscola(ctx, codigoInep);
		if (!escola) {
			return null;
		}
		const saldo = await ctx.db
			.query("saldo")
			.withIndex("por_escola_exercicio_coleta", (q) => q.eq("escolaId", escola._id).eq("exercicio", exercicio))
			.order("desc")
			.first();
		return saldo && { escola, saldo };
	},
});

export const registrarColeta = internalMutation({
	args: {
		escola: v.object(camposDaEscola),
		exercicio: v.number(),
		saldo: saldoPorCategoria,
		fonte: fonteDoDado,
		coletadoEm: v.number(),
	},
	handler: async (ctx, { escola, ...registro }) => {
		const escolaId = await salvarEscola(ctx, escola);
		return ctx.db.insert("saldo", { escolaId, ...registro });
	},
});

export const importarCsv = internalMutation({
	args: { texto: v.string(), nomeDoArquivo: v.string() },
	handler: async (ctx, { texto, nomeDoArquivo }) => {
		const { registros, erros } = importarSaldosCsv(texto, { nome: `Planilha ${nomeDoArquivo}` }, new Date());
		const escolasNaoCadastradas: string[] = [];
		let importados = 0;
		for (const { codigoInep, exercicio, saldo, fonte, coletadoEm } of registros) {
			const escola = await buscarEscola(ctx, codigoInep);
			if (!escola) {
				escolasNaoCadastradas.push(codigoInep);
				continue;
			}
			await ctx.db.insert("saldo", { escolaId: escola._id, exercicio, saldo, fonte, coletadoEm: coletadoEm.getTime() });
			importados += 1;
		}
		return { importados, erros, escolasNaoCadastradas };
	},
});

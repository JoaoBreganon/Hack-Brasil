import { importarSaldosCsv } from "@aloca/dominio";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, type MutationCtx, type QueryCtx } from "./_generated/server";
import { buscarEscola, salvarEscola } from "./escolas";
import { camposDaEscola, fonteDoDado, pendenciaDoPdde, saldoPorCategoria } from "./schema";

type NovoSaldo = Omit<Doc<"saldo">, "_id" | "_creationTime">;

function buscarSaldoMaisRecente(ctx: QueryCtx, escolaId: Id<"escola">, exercicio: number) {
	return ctx.db
		.query("saldo")
		.withIndex("por_escola_exercicio_coleta", (q) => q.eq("escolaId", escolaId).eq("exercicio", exercicio))
		.order("desc")
		.first();
}

export function buscarSaldoAtual(ctx: QueryCtx, escolaId: Id<"escola">) {
	return ctx.db
		.query("saldo")
		.withIndex("por_escola_exercicio_coleta", (q) => q.eq("escolaId", escolaId))
		.order("desc")
		.first();
}

async function registrarSaldo(ctx: MutationCtx, novo: NovoSaldo): Promise<Id<"saldo">> {
	const atual = await buscarSaldoMaisRecente(ctx, novo.escolaId, novo.exercicio);
	const mesmoSaldo = atual?.saldo.custeio === novo.saldo.custeio && atual.saldo.capital === novo.saldo.capital;
	if (!atual || !mesmoSaldo) {
		return ctx.db.insert("saldo", novo);
	}
	await ctx.db.patch(atual._id, { fonte: novo.fonte, coletadoEm: novo.coletadoEm, pendencias: novo.pendencias });
	return atual._id;
}

export const coletadoDesde = internalQuery({
	args: { codigoInep: v.string(), desde: v.number() },
	handler: async (ctx, { codigoInep, desde }) => {
		const escola = await buscarEscola(ctx, codigoInep);
		if (!escola) {
			return false;
		}
		const ultimo = await buscarSaldoAtual(ctx, escola._id);
		return ultimo !== null && ultimo.coletadoEm >= desde;
	},
});

export const registrarColeta = internalMutation({
	args: {
		escola: v.object(camposDaEscola),
		exercicio: v.number(),
		saldo: saldoPorCategoria,
		fonte: fonteDoDado,
		coletadoEm: v.number(),
		pendencias: v.optional(v.array(pendenciaDoPdde)),
	},
	handler: async (ctx, { escola, ...registro }) => {
		const escolaId = await salvarEscola(ctx, escola);
		return registrarSaldo(ctx, { escolaId, ...registro });
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
			await registrarSaldo(ctx, { escolaId: escola._id, exercicio, saldo, fonte, coletadoEm: coletadoEm.getTime() });
			importados += 1;
		}
		return { importados, erros, escolasNaoCadastradas };
	},
});

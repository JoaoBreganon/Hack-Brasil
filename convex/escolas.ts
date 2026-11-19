import { ehCodigoInepValido, type Escola } from "@aloca/dominio";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx, query, type QueryCtx } from "./_generated/server";
import { camposDaEscola } from "./schema";

export function buscarEscola(ctx: QueryCtx, codigoInep: string) {
	return ctx.db
		.query("escola")
		.withIndex("por_codigo_inep", (q) => q.eq("codigoInep", codigoInep))
		.unique();
}

export async function salvarEscola(ctx: MutationCtx, escola: Escola): Promise<Id<"escola">> {
	if (!ehCodigoInepValido(escola.codigoInep)) {
		throw new Error(`O código INEP "${escola.codigoInep}" precisa ter 8 dígitos.`);
	}
	const existente = await buscarEscola(ctx, escola.codigoInep);
	if (!existente) {
		return ctx.db.insert("escola", escola);
	}
	if (existente.nome !== escola.nome || existente.municipio !== escola.municipio) {
		await ctx.db.patch(existente._id, { nome: escola.nome, municipio: escola.municipio });
	}
	return existente._id;
}

export const porCodigoInep = query({
	args: { codigoInep: v.string() },
	handler: (ctx, { codigoInep }) => buscarEscola(ctx, codigoInep),
});

export const cadastrar = internalMutation({
	args: camposDaEscola,
	handler: (ctx, escola) => salvarEscola(ctx, escola),
});

import { mascararCelular, normalizarCelular, validarNomeDoContato } from "@aloca/dominio";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { buscarEscola } from "./escolas";
import { falhar } from "./lib/falha";
import { papelDoContato } from "./schema";
import { registrarUso } from "./usos";

export const daEscola = query({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const escola = await buscarEscola(ctx, codigoInep);
		if (!escola) {
			return [];
		}
		const contatos = await ctx.db
			.query("contato")
			.withIndex("por_escola_papel", (q) => q.eq("escolaId", escola._id))
			.collect();
		return contatos.map(({ _id, papel, nome, celular }) => ({ _id, papel, nome, celular: mascararCelular(celular) }));
	},
});

export const salvar = mutation({
	args: { codigoInep: v.string(), papel: papelDoContato, nome: v.string(), celular: v.string() },
	handler: async (ctx, { codigoInep, papel, ...entrada }) => {
		const escola = (await buscarEscola(ctx, codigoInep)) ?? falhar("Busque o saldo da escola antes de cadastrar os contatos.");
		const nome = validarNomeDoContato(entrada.nome) ?? falhar("Informe o nome com 2 a 80 caracteres.");
		const celular = normalizarCelular(entrada.celular) ?? falhar("Informe um celular com DDD, por exemplo (18) 99123-4567.");
		const existente = await ctx.db
			.query("contato")
			.withIndex("por_escola_papel", (q) => q.eq("escolaId", escola._id).eq("papel", papel))
			.unique();
		if (existente?.celular !== celular) {
			await registrarUso(ctx, "contato");
		}
		if (existente) {
			await ctx.db.patch(existente._id, { nome, celular });
			return existente._id;
		}
		return ctx.db.insert("contato", { escolaId: escola._id, papel, nome, celular, criadoEm: Date.now() });
	},
});

export const remover = mutation({
	args: { contatoId: v.id("contato") },
	handler: async (ctx, { contatoId }) => {
		if (!(await ctx.db.get(contatoId))) {
			falhar("Este celular já foi removido.");
		}
		await ctx.db.delete(contatoId);
	},
});

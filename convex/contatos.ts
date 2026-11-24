import {
	ehEscolaDeDemonstracao,
	mascararCelular,
	mascararEmail,
	normalizarCelular,
	normalizarEmail,
	validarNomeDoContato,
} from "@aloca/dominio";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { buscarEscola } from "./escolas";
import { exigirEdicao, lerAcesso } from "./lib/acesso";
import { falhar } from "./lib/falha";
import { papelDoContato } from "./schema";
import { registrarUso } from "./usos";

function lerOpcional(texto: string | undefined, normalizar: (texto: string) => string | null, mensagem: string): string | undefined {
	if (!texto?.trim()) {
		return undefined;
	}
	return normalizar(texto) ?? falhar(mensagem);
}

export const daEscola = query({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const escola = await buscarEscola(ctx, codigoInep);
		if (!escola || !(await lerAcesso(ctx, escola)).membro) {
			return [];
		}
		const contatos = await ctx.db
			.query("contato")
			.withIndex("por_escola_papel", (q) => q.eq("escolaId", escola._id))
			.collect();
		return contatos.map(({ _id, papel, nome, celular, email }) => ({
			_id,
			papel,
			nome,
			celular: celular ? mascararCelular(celular) : null,
			email: email ? mascararEmail(email) : null,
		}));
	},
});

export const salvar = mutation({
	args: {
		codigoInep: v.string(),
		papel: papelDoContato,
		nome: v.string(),
		celular: v.optional(v.string()),
		email: v.optional(v.string()),
	},
	handler: async (ctx, { codigoInep, papel, ...entrada }) => {
		if (ehEscolaDeDemonstracao(codigoInep)) {
			falhar("Na escola de demonstração não dá para cadastrar contatos.");
		}
		const escola = (await buscarEscola(ctx, codigoInep)) ?? falhar("Busque o saldo da escola antes de cadastrar os contatos.");
		await exigirEdicao(ctx, escola);
		const nome = validarNomeDoContato(entrada.nome) ?? falhar("Informe o nome com 2 a 80 caracteres.");
		const celular = lerOpcional(entrada.celular, normalizarCelular, "Informe um celular com DDD, por exemplo (18) 99123-4567.");
		const email = lerOpcional(entrada.email, normalizarEmail, "Informe um e-mail válido, por exemplo diretora@escola.com.br.");
		if (!celular && !email) {
			falhar("Informe um celular ou um e-mail para receber o alerta.");
		}
		const existente = await ctx.db
			.query("contato")
			.withIndex("por_escola_papel", (q) => q.eq("escolaId", escola._id).eq("papel", papel))
			.unique();
		if (existente?.celular !== celular || existente?.email !== email) {
			await registrarUso(ctx, "contato");
		}
		if (existente) {
			await ctx.db.patch(existente._id, { nome, celular, email });
			return existente._id;
		}
		return ctx.db.insert("contato", { escolaId: escola._id, papel, nome, celular, email, criadoEm: Date.now() });
	},
});

export const remover = mutation({
	args: { contatoId: v.id("contato") },
	handler: async (ctx, { contatoId }) => {
		const contato = (await ctx.db.get(contatoId)) ?? falhar("Este contato já foi removido.");
		const escola = (await ctx.db.get(contato.escolaId)) ?? falhar("A escola deste contato não existe mais.");
		await exigirEdicao(ctx, escola);
		await ctx.db.delete(contatoId);
	},
});

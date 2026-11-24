import { LIMITES } from "@aloca/dominio";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation, type MutationCtx, query } from "./_generated/server";
import { buscarEscola } from "./escolas";
import { buscarMembro, exigirEdicao, exigirMembro, maisAntigo, membrosDaEscola, tornarMembro, usuarioAtual } from "./lib/acesso";
import { FORMATO_DO_CODIGO, gerarCodigo, VALIDADE_DO_CONVITE_EM_MS } from "./lib/codigo";
import { falhar } from "./lib/falha";

async function escolaBuscada(ctx: MutationCtx, codigoInep: string): Promise<Doc<"escola">> {
	return (await buscarEscola(ctx, codigoInep)) ?? falhar("Busque o saldo da escola antes de continuar.");
}

async function conviteValido(ctx: MutationCtx, codigo: string): Promise<Doc<"convite">> {
	const convite = FORMATO_DO_CODIGO.test(codigo)
		? await ctx.db
				.query("convite")
				.withIndex("por_codigo", (q) => q.eq("codigo", codigo))
				.unique()
		: null;
	if (!convite || convite.expiraEm <= Date.now()) {
		falhar("Este convite não vale mais. Peça um novo a quem cuida da escola.");
	}
	return convite;
}

export const assumir = mutation({
	args: { codigoInep: v.string(), nome: v.string() },
	handler: async (ctx, { codigoInep, nome }) => {
		const usuario = (await usuarioAtual(ctx)) ?? falhar("Entre com sua conta para assumir a escola.");
		const escola = await escolaBuscada(ctx, codigoInep);
		if (await buscarMembro(ctx, escola._id, usuario)) {
			return;
		}
		const responsavel = await ctx.db
			.query("membro")
			.withIndex("por_escola_usuario", (q) => q.eq("escolaId", escola._id))
			.first();
		if (responsavel) {
			falhar("Esta escola já tem quem cuide dela no Aloca. Peça um convite.");
		}
		await tornarMembro(ctx, escola, usuario, nome);
	},
});

export const membros = query({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const escola = await buscarEscola(ctx, codigoInep);
		const usuario = await usuarioAtual(ctx);
		if (!escola || !usuario) {
			return [];
		}
		const membros = await membrosDaEscola(ctx, escola._id);
		if (!membros.some((membro) => membro.usuario === usuario)) {
			return [];
		}
		const responsavel = maisAntigo(membros);
		return membros.map(({ _id, nome, entrouEm, usuario: dono }) => ({
			_id,
			nome,
			entrouEm,
			souEu: dono === usuario,
			responsavel: _id === responsavel._id,
		}));
	},
});

export const removerMembro = mutation({
	args: { membroId: v.id("membro") },
	handler: async (ctx, { membroId }) => {
		const membro = (await ctx.db.get(membroId)) ?? falhar("Esta pessoa já saiu da escola.");
		const escola = (await ctx.db.get(membro.escolaId)) ?? falhar("A escola não existe mais.");
		const usuario = await exigirMembro(ctx, escola);
		const membros = await membrosDaEscola(ctx, escola._id);
		if (membros.length <= 1) {
			falhar("A escola não pode ficar sem responsável. Convide outra pessoa antes de sair.");
		}
		if (membro.usuario !== usuario && maisAntigo(membros).usuario !== usuario) {
			falhar("Só quem assumiu a escola primeiro tira outras pessoas. Você pode sair quando quiser.");
		}
		await ctx.db.delete(membroId);
	},
});

export const criarConvite = mutation({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }): Promise<string> => {
		const escola = await escolaBuscada(ctx, codigoInep);
		const usuario = await exigirMembro(ctx, escola);
		const agora = Date.now();
		const convites = await ctx.db
			.query("convite")
			.withIndex("por_escola", (q) => q.eq("escolaId", escola._id))
			.collect();
		const vencidos = convites.filter(({ expiraEm }) => expiraEm <= agora);
		await Promise.all(vencidos.map(({ _id }) => ctx.db.delete(_id)));
		if (convites.length - vencidos.length >= LIMITES.convitesPorEscola) {
			falhar(`A escola já tem ${LIMITES.convitesPorEscola} convites abertos. Espere alguém aceitar ou um convite vencer.`);
		}
		const codigo = gerarCodigo();
		await ctx.db.insert("convite", {
			escolaId: escola._id,
			codigo,
			criadoPor: usuario,
			criadoEm: agora,
			expiraEm: agora + VALIDADE_DO_CONVITE_EM_MS,
		});
		return codigo;
	},
});

export const convite = query({
	args: { codigo: v.string() },
	handler: async (ctx, { codigo }) => {
		if (!FORMATO_DO_CODIGO.test(codigo)) {
			return null;
		}
		const convite = await ctx.db
			.query("convite")
			.withIndex("por_codigo", (q) => q.eq("codigo", codigo))
			.unique();
		const escola = convite && (await ctx.db.get(convite.escolaId));
		if (!convite || !escola) {
			return null;
		}
		return { codigoInep: escola.codigoInep, nomeDaEscola: escola.nome, valido: convite.expiraEm > Date.now() };
	},
});

export const aceitarConvite = mutation({
	args: { codigo: v.string(), nome: v.string() },
	handler: async (ctx, { codigo, nome }): Promise<string> => {
		const usuario = (await usuarioAtual(ctx)) ?? falhar("Entre com sua conta para aceitar o convite.");
		const convite = await conviteValido(ctx, codigo);
		const escola = (await ctx.db.get(convite.escolaId)) ?? falhar("A escola deste convite não existe mais.");
		await tornarMembro(ctx, escola, usuario, nome);
		await ctx.db.delete(convite._id);
		return escola.codigoInep;
	},
});

export const minhasEscolas = query({
	args: {},
	handler: async (ctx) => {
		const usuario = await usuarioAtual(ctx);
		if (!usuario) {
			return [];
		}
		const membros = await ctx.db
			.query("membro")
			.withIndex("por_usuario", (q) => q.eq("usuario", usuario))
			.take(LIMITES.escolasPorConta);
		const escolas = await Promise.all(membros.map(({ escolaId }) => ctx.db.get(escolaId)));
		return escolas.flatMap((escola) =>
			escola ? [{ codigoInep: escola.codigoInep, nome: escola.nome, municipio: escola.municipio }] : [],
		);
	},
});

export const liberarEscola = internalMutation({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const escola = await escolaBuscada(ctx, codigoInep);
		const [membros, convites, contatos] = await Promise.all([
			ctx.db
				.query("membro")
				.withIndex("por_escola_usuario", (q) => q.eq("escolaId", escola._id))
				.collect(),
			ctx.db
				.query("convite")
				.withIndex("por_escola", (q) => q.eq("escolaId", escola._id))
				.collect(),
			ctx.db
				.query("contato")
				.withIndex("por_escola_papel", (q) => q.eq("escolaId", escola._id))
				.collect(),
		]);
		await Promise.all([...membros, ...convites, ...contatos].map(({ _id }) => ctx.db.delete(_id)));
		await ctx.db.patch(escola._id, { publicadaEm: undefined });
		return membros.length;
	},
});

export const exigirEdicaoDaEscola = internalQuery({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const escola = (await buscarEscola(ctx, codigoInep)) ?? falhar("Busque o saldo da escola antes de continuar.");
		await exigirEdicao(ctx, escola);
	},
});

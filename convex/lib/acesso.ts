import { ehEscolaDeDemonstracao, LIMITES, validarNomeDoContato } from "@aloca/dominio";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { falhar } from "./falha";

export type Acesso = {
	demonstracao: boolean;
	entrou: boolean;
	membro: boolean;
	temResponsavel: boolean;
	podeEditar: boolean;
};

export async function usuarioAtual(ctx: QueryCtx): Promise<string | null> {
	return (await ctx.auth.getUserIdentity())?.subject ?? null;
}

export function buscarMembro(ctx: QueryCtx, escolaId: Id<"escola">, usuario: string) {
	return ctx.db
		.query("membro")
		.withIndex("por_escola_usuario", (q) => q.eq("escolaId", escolaId).eq("usuario", usuario))
		.unique();
}

export function membrosDaEscola(ctx: QueryCtx, escolaId: Id<"escola">): Promise<Doc<"membro">[]> {
	return ctx.db
		.query("membro")
		.withIndex("por_escola_usuario", (q) => q.eq("escolaId", escolaId))
		.take(LIMITES.membrosPorEscola);
}

export function maisAntigo(membros: Doc<"membro">[]): Doc<"membro"> {
	return membros.reduce((antigo, membro) => (membro.entrouEm < antigo.entrouEm ? membro : antigo));
}

export async function lerAcesso(ctx: QueryCtx, escola: Doc<"escola">): Promise<Acesso> {
	const demonstracao = ehEscolaDeDemonstracao(escola.codigoInep);
	const usuario = await usuarioAtual(ctx);
	const [membro, primeiro] = await Promise.all([
		usuario ? buscarMembro(ctx, escola._id, usuario) : null,
		ctx.db
			.query("membro")
			.withIndex("por_escola_usuario", (q) => q.eq("escolaId", escola._id))
			.first(),
	]);
	return {
		demonstracao,
		entrou: usuario !== null,
		membro: membro !== null,
		temResponsavel: primeiro !== null,
		podeEditar: demonstracao || membro !== null,
	};
}

export async function exigirEdicao(ctx: QueryCtx, escola: Doc<"escola">): Promise<void> {
	const acesso = await lerAcesso(ctx, escola);
	if (acesso.podeEditar) {
		return;
	}
	if (!acesso.entrou) {
		falhar("Entre com sua conta para mudar os dados desta escola.");
	}
	falhar(
		acesso.temResponsavel
			? "Só quem cuida desta escola no Aloca pode mudar os dados. Peça um convite a quem já cuida dela."
			: "Assuma esta escola no Aloca antes de mudar os dados.",
	);
}

export async function exigirMembro(ctx: QueryCtx, escola: Doc<"escola">): Promise<string> {
	const usuario = (await usuarioAtual(ctx)) ?? falhar("Entre com sua conta para continuar.");
	if (!(await buscarMembro(ctx, escola._id, usuario))) {
		falhar("Só quem cuida desta escola no Aloca pode fazer isso.");
	}
	return usuario;
}

export async function tornarMembro(ctx: MutationCtx, escola: Doc<"escola">, usuario: string, nome: string): Promise<void> {
	if (ehEscolaDeDemonstracao(escola.codigoInep)) {
		falhar("A escola de demonstração é aberta para todos e não tem responsável.");
	}
	if (await buscarMembro(ctx, escola._id, usuario)) {
		return;
	}
	const [escolasDaConta, membros] = await Promise.all([
		ctx.db
			.query("membro")
			.withIndex("por_usuario", (q) => q.eq("usuario", usuario))
			.take(LIMITES.escolasPorConta),
		membrosDaEscola(ctx, escola._id),
	]);
	if (escolasDaConta.length >= LIMITES.escolasPorConta) {
		falhar(`Cada conta cuida de até ${LIMITES.escolasPorConta} escolas.`);
	}
	if (membros.length >= LIMITES.membrosPorEscola) {
		falhar(`Cada escola aceita até ${LIMITES.membrosPorEscola} pessoas cuidando dela.`);
	}
	await ctx.db.insert("membro", {
		escolaId: escola._id,
		usuario,
		nome: validarNomeDoContato(nome) ?? "Sem nome",
		entrouEm: Date.now(),
	});
}

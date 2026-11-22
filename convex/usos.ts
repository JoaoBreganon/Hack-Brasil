import { type AcaoLimitada, USOS_POR_HORA } from "@aloca/dominio";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { falhar } from "./lib/falha";
import { acaoLimitada } from "./schema";

const HORA_EM_MS = 60 * 60_000;
const ANTIGOS_APAGADOS_POR_VEZ = 20;

const MENSAGEM_DO_LIMITE: Record<AcaoLimitada, string> = {
	"consulta ao PDDE Info": "Muitas consultas ao PDDE Info na última hora. Tente de novo mais tarde ou importe o saldo por planilha CSV.",
	contato: "Muitos celulares cadastrados na última hora. Tente de novo mais tarde.",
	planilha: "Muitas planilhas importadas na última hora. Tente de novo mais tarde.",
};

export async function registrarUso(ctx: MutationCtx, acao: AcaoLimitada): Promise<void> {
	const agora = Date.now();
	const limite = USOS_POR_HORA[acao];
	const recentes = await ctx.db
		.query("uso")
		.withIndex("por_acao_em", (q) => q.eq("acao", acao).gt("em", agora - HORA_EM_MS))
		.take(limite);
	if (recentes.length >= limite) {
		falhar(MENSAGEM_DO_LIMITE[acao]);
	}
	await ctx.db.insert("uso", { acao, em: agora });
	const antigos = await ctx.db
		.query("uso")
		.withIndex("por_acao_em", (q) => q.eq("acao", acao).lte("em", agora - HORA_EM_MS))
		.take(ANTIGOS_APAGADOS_POR_VEZ);
	await Promise.all(antigos.map(({ _id }) => ctx.db.delete(_id)));
}

export const registrar = internalMutation({
	args: { acao: acaoLimitada },
	handler: (ctx, { acao }) => registrarUso(ctx, acao),
});

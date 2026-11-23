import { ESCOLA_EXEMPLO } from "@aloca/dominio";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, mutation, type MutationCtx } from "./_generated/server";
import { buscarEscola, salvarEscola } from "./escolas";
import { itensComOrcamentos } from "./lib/plano";
import { buscarSaldoAtual } from "./saldos";

const INATIVIDADE_PARA_RESTAURAR_EM_MS = 60 * 60_000;

export async function garantirEscolaDeDemonstracao(ctx: MutationCtx): Promise<boolean> {
	const { codigoInep, nome, municipio } = ESCOLA_EXEMPLO;
	const existente = await buscarEscola(ctx, codigoInep);
	if (existente && (await buscarSaldoAtual(ctx, existente._id))) {
		return false;
	}
	const escolaId = await salvarEscola(ctx, { codigoInep, nome, municipio });
	await ctx.db.insert("saldo", {
		escolaId,
		exercicio: ESCOLA_EXEMPLO.exercicioDoSaldo,
		saldo: ESCOLA_EXEMPLO.saldo,
		fonte: { nome: ESCOLA_EXEMPLO.fonteDoSaldo, endereco: ESCOLA_EXEMPLO.enderecoDaFonte },
		coletadoEm: ESCOLA_EXEMPLO.saldoColetadoEm.getTime(),
		pendencias: [],
	});
	return true;
}

async function dadosDaDemonstracao(ctx: MutationCtx, escola: Doc<"escola">) {
	const [planos, contatos] = await Promise.all([
		ctx.db
			.query("plano")
			.withIndex("por_escola_exercicio", (q) => q.eq("escolaId", escola._id))
			.collect(),
		ctx.db
			.query("contato")
			.withIndex("por_escola_papel", (q) => q.eq("escolaId", escola._id))
			.collect(),
	]);
	const itens = (await Promise.all(planos.map(({ _id }) => itensComOrcamentos(ctx, _id)))).flat();
	return { planos, contatos, itens };
}

async function apagar(ctx: MutationCtx, { planos, contatos, itens }: Awaited<ReturnType<typeof dadosDaDemonstracao>>) {
	const orcamentos = itens.flatMap(({ orcamentos }) => orcamentos);
	await Promise.all([...orcamentos, ...itens, ...planos, ...contatos].map(({ _id }) => ctx.db.delete(_id)));
}

export const garantir = internalMutation({
	args: {},
	handler: (ctx): Promise<boolean> => garantirEscolaDeDemonstracao(ctx),
});

export const recomecar = mutation({
	args: {},
	handler: async (ctx): Promise<void> => {
		await garantirEscolaDeDemonstracao(ctx);
		const escola = await buscarEscola(ctx, ESCOLA_EXEMPLO.codigoInep);
		if (escola) {
			await apagar(ctx, await dadosDaDemonstracao(ctx, escola));
		}
	},
});

export const restaurar = internalMutation({
	args: {},
	handler: async (ctx): Promise<boolean> => {
		const carregada = await garantirEscolaDeDemonstracao(ctx);
		const escola = await buscarEscola(ctx, ESCOLA_EXEMPLO.codigoInep);
		if (!escola) {
			return carregada;
		}
		const dados = await dadosDaDemonstracao(ctx, escola);
		const { planos, contatos, itens } = dados;
		const ultimaMudanca = Math.max(
			0,
			...planos.flatMap((plano) => [plano._creationTime, plano.aprovadoEm ?? 0, plano.sugestaoComIaEm ?? 0]),
			...itens.flatMap((item) => [
				item._creationTime,
				item.buscaDePrecoEm ?? 0,
				...item.orcamentos.map(({ _creationTime }) => _creationTime),
			]),
		);
		if ((planos.length === 0 && contatos.length === 0) || Date.now() - ultimaMudanca < INATIVIDADE_PARA_RESTAURAR_EM_MS) {
			return carregada;
		}
		await apagar(ctx, dados);
		return true;
	},
});

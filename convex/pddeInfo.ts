import {
	ehCodigoInepValido,
	enderecoDaConsultaPorEscola,
	lerConsultaPorEscola,
	registroDeSaldoDoPddeInfo,
	type SituacaoNoPddeInfo,
} from "@aloca/dominio";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, type ActionCtx, internalAction } from "./_generated/server";
import { falhar, mensagemDoErro } from "./lib/falha";
import { buscarComTempoLimite } from "./lib/requisicao";

const SUGESTAO_DE_PLANILHA = "Tente de novo mais tarde ou importe o saldo por planilha CSV.";
const TEMPO_LIMITE_EM_MS = 20_000;
const AGENTE = "Aloca/0.1 (+https://github.com/JoaoBreganon/Hack-Brasil)";
const MINUTO_EM_MS = 60_000;
const VALIDADE_DA_COLETA_EM_MS = 6 * 60 * MINUTO_EM_MS;
const INTERVALO_PARA_ATUALIZAR_EM_MS = 2 * MINUTO_EM_MS;

async function lerSituacao(codigoInep: string, exercicio: number): Promise<SituacaoNoPddeInfo | null> {
	const resposta = await buscarComTempoLimite(
		enderecoDaConsultaPorEscola(codigoInep, exercicio),
		{ headers: { "User-Agent": AGENTE } },
		TEMPO_LIMITE_EM_MS,
	).catch((erro: unknown) => {
		throw new Error(`O PDDE Info não respondeu (${mensagemDoErro(erro)}).`);
	});
	if (!resposta.ok) {
		throw new Error(`O PDDE Info respondeu ${resposta.status}.`);
	}
	return lerConsultaPorEscola(await resposta.text(), codigoInep);
}

async function registrar(ctx: ActionCtx, situacao: SituacaoNoPddeInfo) {
	const { saldo, fonte, coletadoEm } = registroDeSaldoDoPddeInfo(situacao, new Date());
	const saldoId: Id<"saldo"> = await ctx.runMutation(internal.saldos.registrarColeta, {
		escola: situacao.escola,
		exercicio: situacao.exercicio,
		saldo,
		fonte,
		coletadoEm: coletadoEm.getTime(),
		pendencias: situacao.pendencias,
	});
	return { saldoId, escola: situacao.escola, saldo, repasses: situacao.repasses.length, pendencias: situacao.pendencias };
}

export const coletar = internalAction({
	args: { codigoInep: v.string(), exercicio: v.number() },
	handler: async (ctx, { codigoInep, exercicio }) => {
		const situacao = await lerSituacao(codigoInep, exercicio);
		if (!situacao) {
			throw new Error(`A escola ${codigoInep} não aparece no PDDE Info em ${exercicio}.`);
		}
		return registrar(ctx, situacao);
	},
});

export const consultar = action({
	args: { codigoInep: v.string(), atualizar: v.optional(v.boolean()) },
	handler: async (ctx, { codigoInep, atualizar = false }): Promise<{ codigoInep: string; aviso?: string }> => {
		if (!ehCodigoInepValido(codigoInep)) {
			falhar("O código INEP tem 8 dígitos, só números.");
		}
		const validade = atualizar ? INTERVALO_PARA_ATUALIZAR_EM_MS : VALIDADE_DA_COLETA_EM_MS;
		const coletaRecente: boolean = await ctx.runQuery(internal.saldos.coletadoDesde, { codigoInep, desde: Date.now() - validade });
		if (coletaRecente) {
			return { codigoInep };
		}
		await ctx.runMutation(internal.usos.registrar, { acao: "consulta ao PDDE Info" });
		const anoAtual = new Date().getUTCFullYear();
		try {
			const situacao = (await lerSituacao(codigoInep, anoAtual)) ?? (await lerSituacao(codigoInep, anoAtual - 1));
			if (!situacao) {
				falhar(`Não encontramos a escola ${codigoInep} no PDDE Info. Confira o código INEP.`);
			}
			await registrar(ctx, situacao);
			return { codigoInep };
		} catch (erro) {
			if (erro instanceof ConvexError) {
				throw erro;
			}
			const jaTemSaldo: boolean = await ctx.runQuery(internal.saldos.coletadoDesde, { codigoInep, desde: 0 });
			if (jaTemSaldo) {
				return { codigoInep, aviso: `Mostrando o último saldo salvo. ${mensagemDoErro(erro)}` };
			}
			falhar(`${mensagemDoErro(erro)} ${SUGESTAO_DE_PLANILHA}`);
		}
	},
});

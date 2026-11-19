import { enderecoDaConsultaPorEscola, lerConsultaPorEscola, registroDeSaldoDoPddeInfo } from "@aloca/dominio";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

const SUGESTAO_DE_PLANILHA = "Tente de novo mais tarde ou importe o saldo por planilha (saldos:importarCsv).";
const TEMPO_LIMITE_EM_MS = 20_000;

async function buscarNoPddeInfo(endereco: string): Promise<Response> {
	const controle = new AbortController();
	const espera = setTimeout(() => controle.abort(), TEMPO_LIMITE_EM_MS);
	try {
		return await fetch(endereco, {
			headers: { "User-Agent": "Aloca/0.1 (+https://github.com/JoaoBreganon/Hack-Brasil)" },
			signal: controle.signal,
		});
	} catch (erro) {
		const motivo = controle.signal.aborted
			? `sem resposta em ${TEMPO_LIMITE_EM_MS / 1000} s`
			: erro instanceof Error
				? erro.message
				: String(erro);
		throw new Error(`O PDDE Info não respondeu (${motivo}). ${SUGESTAO_DE_PLANILHA}`);
	} finally {
		clearTimeout(espera);
	}
}

export const coletar = internalAction({
	args: { codigoInep: v.string(), exercicio: v.number() },
	handler: async (ctx, { codigoInep, exercicio }) => {
		const resposta = await buscarNoPddeInfo(enderecoDaConsultaPorEscola(codigoInep, exercicio));
		if (!resposta.ok) {
			throw new Error(`O PDDE Info respondeu ${resposta.status}. ${SUGESTAO_DE_PLANILHA}`);
		}
		const situacao = lerConsultaPorEscola(await resposta.text(), codigoInep);
		if (!situacao) {
			throw new Error(`A escola ${codigoInep} não aparece no PDDE Info em ${exercicio}.`);
		}
		const { saldo, fonte, coletadoEm } = registroDeSaldoDoPddeInfo(situacao, new Date());
		const saldoId: Id<"saldo"> = await ctx.runMutation(internal.saldos.registrarColeta, {
			escola: situacao.escola,
			exercicio: situacao.exercicio,
			saldo,
			fonte,
			coletadoEm: coletadoEm.getTime(),
		});
		return { saldoId, escola: situacao.escola, saldo, repasses: situacao.repasses.length, pendencias: situacao.pendencias };
	},
});

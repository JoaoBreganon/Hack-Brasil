import { ehCodigoInepValido } from "../escola/escola";
import type { SituacaoDoPrazo } from "../prazo/prazo";
import { avaliarRisco, type NivelDeRisco } from "../risco/risco";

export type EscolaNaRede = {
	codigoInep: string;
	nome: string | null;
	municipio: string | null;
	saldoTotal: number | null;
	totalAprovado: number | null;
	pendencias: number;
	temResponsavel: boolean;
};

export type NivelNaRede = NivelDeRisco | "sem dados";

export type LinhaDaRede = EscolaNaRede & {
	saldoEmRisco: number;
	nivel: NivelNaRede;
};

export type ResumoDaRede = {
	escolas: number;
	saldoTotal: number;
	saldoEmRisco: number;
	comPlanoAprovado: number;
	precisamAgir: number;
};

const NIVEIS_QUE_PRECISAM_AGIR: NivelNaRede[] = ["urgente", "perdido", "atenção"];

const ORDEM_DO_NIVEL: Record<NivelNaRede, number> = {
	urgente: 0,
	perdido: 1,
	atenção: 2,
	"em dia": 3,
	"sem prazo": 4,
	"sem dados": 5,
	"sem saldo": 6,
};

export function avaliarEscolaDaRede(escola: EscolaNaRede, situacao: SituacaoDoPrazo): LinhaDaRede {
	if (escola.saldoTotal === null) {
		return { ...escola, saldoEmRisco: 0, nivel: "sem dados" };
	}
	const saldoEmRisco = Math.max(0, escola.saldoTotal - (escola.totalAprovado ?? 0));
	return { ...escola, saldoEmRisco, nivel: avaliarRisco(saldoEmRisco, situacao).nivel };
}

export function ordenarPorRisco(linhas: LinhaDaRede[]): LinhaDaRede[] {
	return [...linhas].sort(
		(a, b) =>
			ORDEM_DO_NIVEL[a.nivel] - ORDEM_DO_NIVEL[b.nivel] ||
			b.saldoEmRisco - a.saldoEmRisco ||
			a.codigoInep.localeCompare(b.codigoInep),
	);
}

export function resumirRede(linhas: LinhaDaRede[]): ResumoDaRede {
	return {
		escolas: linhas.length,
		saldoTotal: linhas.reduce((soma, { saldoTotal }) => soma + (saldoTotal ?? 0), 0),
		saldoEmRisco: linhas.reduce((soma, { saldoEmRisco }) => soma + saldoEmRisco, 0),
		comPlanoAprovado: linhas.filter(({ totalAprovado }) => totalAprovado !== null).length,
		precisamAgir: linhas.filter(({ nivel }) => NIVEIS_QUE_PRECISAM_AGIR.includes(nivel)).length,
	};
}

export function lerCodigosInep(texto: string): { validos: string[]; invalidos: string[] } {
	const pedacos = texto.split(/[\s,;]+/).filter(Boolean);
	return {
		validos: [...new Set(pedacos.filter(ehCodigoInepValido))],
		invalidos: [...new Set(pedacos.filter((pedaco) => !ehCodigoInepValido(pedaco)))],
	};
}

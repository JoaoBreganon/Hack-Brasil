import { diasCorridosAte, diasUteisAte, enesimoDiaUtilDoMes, type OpcoesDoCalendario, somarDias } from "../calendario/calendario";

export const PRIMEIRO_EXERCICIO_COM_PRAZO = 2027;
export const DIA_UTIL_LIMITE_PARA_USO = 10;
export const DIA_UTIL_DO_ESTORNO = 15;
const FEVEREIRO = 2;

export type PrazoDoExercicio = {
	exercicio: number;
	limiteParaUso: Date;
	estorno: Date;
};

export type SituacaoDoPrazo =
	| { tipo: "sem prazo"; exercicio: number }
	| {
			tipo: "correndo" | "encerrado";
			exercicio: number;
			limiteParaUso: Date;
			estorno: Date;
			diasUteisRestantes: number;
			diasCorridosRestantes: number;
	  };

export function prazoDoExercicio(exercicio: number, opcoes: OpcoesDoCalendario = {}): PrazoDoExercicio | null {
	if (exercicio < PRIMEIRO_EXERCICIO_COM_PRAZO) {
		return null;
	}
	return {
		exercicio,
		limiteParaUso: enesimoDiaUtilDoMes(exercicio + 1, FEVEREIRO, DIA_UTIL_LIMITE_PARA_USO, opcoes),
		estorno: enesimoDiaUtilDoMes(exercicio + 1, FEVEREIRO, DIA_UTIL_DO_ESTORNO, opcoes),
	};
}

export function situacaoDoPrazo(exercicio: number, hoje: Date, opcoes: OpcoesDoCalendario = {}): SituacaoDoPrazo {
	const prazo = prazoDoExercicio(exercicio, opcoes);
	if (!prazo) {
		return { tipo: "sem prazo", exercicio };
	}
	const encerrado = hoje.getTime() > prazo.limiteParaUso.getTime();
	return {
		tipo: encerrado ? "encerrado" : "correndo",
		...prazo,
		diasUteisRestantes: encerrado ? 0 : diasUteisAte(somarDias(hoje, 1), prazo.limiteParaUso, opcoes),
		diasCorridosRestantes: encerrado ? 0 : diasCorridosAte(hoje, prazo.limiteParaUso),
	};
}

export function exercicioEmCurso(hoje: Date, opcoes: OpcoesDoCalendario = {}): number {
	const anterior = hoje.getUTCFullYear() - 1;
	const prazoAnterior = prazoDoExercicio(anterior, opcoes);
	return prazoAnterior && hoje.getTime() <= prazoAnterior.limiteParaUso.getTime() ? anterior : anterior + 1;
}

import { criarData } from "../calendario/calendario";
import { avaliarRisco, type Risco } from "../risco/risco";
import { type SituacaoDoPrazo, situacaoDoPrazo } from "./prazo";

export const EXERCICIO_SIMULADO = 2027;
export const HOJE_SIMULADO = criarData(2027, 12, 15);

export type PrazoSimulado = {
	hoje: Date;
	situacao: SituacaoDoPrazo;
	risco: Risco;
};

export function simularPrazo(saldoTotalEmCentavos: number): PrazoSimulado {
	const situacao = situacaoDoPrazo(EXERCICIO_SIMULADO, HOJE_SIMULADO);
	return { hoje: HOJE_SIMULADO, situacao, risco: avaliarRisco(saldoTotalEmCentavos, situacao) };
}

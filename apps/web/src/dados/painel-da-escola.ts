import { avaliarRisco, criarData, ESCOLA_EXEMPLO, montarPlanoDeCompra, NECESSIDADES_EXEMPLO, situacaoDoPrazo } from "@aloca/dominio";

const DATA_DA_SIMULACAO = criarData(2027, 12, 15);

export function montarPainelDaEscolaExemplo() {
	const situacao = situacaoDoPrazo(ESCOLA_EXEMPLO.exercicio, DATA_DA_SIMULACAO);
	return {
		escola: ESCOLA_EXEMPLO,
		hoje: DATA_DA_SIMULACAO,
		situacao,
		risco: avaliarRisco(ESCOLA_EXEMPLO.saldoTotalEmCentavos, situacao),
		plano: montarPlanoDeCompra(ESCOLA_EXEMPLO.saldo, NECESSIDADES_EXEMPLO),
	};
}

export type PainelDaEscola = ReturnType<typeof montarPainelDaEscolaExemplo>;

import type { SituacaoDoPrazo } from "../prazo/prazo";

export const DIAS_UTEIS_PARA_FECHAR_UMA_COMPRA = 15;
export const DIAS_UTEIS_DE_FOLGA = 30;

export type NivelDeRisco = "sem saldo" | "sem prazo" | "em dia" | "atenção" | "urgente" | "perdido";

export type Risco = {
	nivel: NivelDeRisco;
	mensagem: string;
};

export function avaliarRisco(saldoTotal: number, situacao: SituacaoDoPrazo): Risco {
	if (saldoTotal <= 0) {
		return { nivel: "sem saldo", mensagem: "A conta está zerada. Nada a perder neste exercício." };
	}
	if (situacao.tipo === "sem prazo") {
		return { nivel: "sem prazo", mensagem: `O exercício de ${situacao.exercicio} ainda não tem prazo de estorno.` };
	}
	if (situacao.tipo === "encerrado") {
		return { nivel: "perdido", mensagem: "O prazo de uso acabou. O saldo restante vai ser estornado." };
	}
	const dias = situacao.diasUteisRestantes;
	if (dias <= DIAS_UTEIS_PARA_FECHAR_UMA_COMPRA) {
		return { nivel: "urgente", mensagem: `Faltam ${dias} dias úteis: tempo justo para fechar uma compra com três orçamentos e ata.` };
	}
	if (dias <= DIAS_UTEIS_PARA_FECHAR_UMA_COMPRA + DIAS_UTEIS_DE_FOLGA) {
		return { nivel: "atenção", mensagem: `Faltam ${dias} dias úteis. Vale montar o plano de compra agora.` };
	}
	return { nivel: "em dia", mensagem: `Faltam ${dias} dias úteis. Dá tempo de planejar com calma.` };
}

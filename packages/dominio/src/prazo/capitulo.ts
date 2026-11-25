const FEVEREIRO = 1;
const JANEIRO = 0;

export type CapituloDoPrazo = {
	numero: 1 | 2 | 3;
	mes: "Dezembro" | "Janeiro" | "Fevereiro";
	resumo: string;
};

const CAPITULOS: Record<CapituloDoPrazo["numero"], CapituloDoPrazo> = {
	1: { numero: 1, mes: "Dezembro", resumo: "Hora de descobrir quanto a escola tem e o que ela precisa." },
	2: { numero: 2, mes: "Janeiro", resumo: "Hora da APM escolher, orçar e aprovar o plano." },
	3: { numero: 3, mes: "Fevereiro", resumo: "Últimos dias: o que não virar compra volta para o governo." },
};

export function capituloDoPrazo(hoje: Date, limiteParaUso: Date): CapituloDoPrazo | null {
	if (hoje.getTime() > limiteParaUso.getTime()) {
		return null;
	}
	const mesesAteOLimite =
		(limiteParaUso.getUTCFullYear() - hoje.getUTCFullYear()) * 12 + limiteParaUso.getUTCMonth() - hoje.getUTCMonth();
	if (mesesAteOLimite === 0 && hoje.getUTCMonth() === FEVEREIRO) {
		return CAPITULOS[3];
	}
	return mesesAteOLimite === 1 && hoje.getUTCMonth() === JANEIRO ? CAPITULOS[2] : CAPITULOS[1];
}

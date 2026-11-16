const MILISSEGUNDOS_POR_DIA = 86_400_000;
const DOMINGO = 0;
const SABADO = 6;

const FERIADOS_NACIONAIS_FIXOS: ReadonlyArray<[mes: number, dia: number]> = [
	[1, 1],
	[4, 21],
	[5, 1],
	[9, 7],
	[10, 12],
	[11, 2],
	[11, 15],
	[11, 20],
	[12, 25],
];

export type OpcoesDoCalendario = {
	carnavalSemExpedienteBancario?: boolean;
};

export function criarData(ano: number, mes: number, dia: number): Date {
	return new Date(Date.UTC(ano, mes - 1, dia));
}

export function paraTextoIso(data: Date): string {
	return data.toISOString().slice(0, 10);
}

export function somarDias(data: Date, dias: number): Date {
	return new Date(data.getTime() + dias * MILISSEGUNDOS_POR_DIA);
}

export function domingoDePascoa(ano: number): Date {
	const a = ano % 19;
	const b = Math.floor(ano / 100);
	const c = ano % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const mes = Math.floor((h + l - 7 * m + 114) / 31);
	const dia = ((h + l - 7 * m + 114) % 31) + 1;
	return criarData(ano, mes, dia);
}

export function feriadosDoAno(ano: number, opcoes: OpcoesDoCalendario = {}): Set<string> {
	const { carnavalSemExpedienteBancario = true } = opcoes;
	const pascoa = domingoDePascoa(ano);
	const feriados = FERIADOS_NACIONAIS_FIXOS.map(([mes, dia]) => criarData(ano, mes, dia));
	feriados.push(somarDias(pascoa, -2));
	if (carnavalSemExpedienteBancario) {
		feriados.push(somarDias(pascoa, -48), somarDias(pascoa, -47));
	}
	return new Set(feriados.map(paraTextoIso));
}

export function ehDiaUtil(data: Date, opcoes: OpcoesDoCalendario = {}): boolean {
	const diaDaSemana = data.getUTCDay();
	if (diaDaSemana === DOMINGO || diaDaSemana === SABADO) {
		return false;
	}
	return !feriadosDoAno(data.getUTCFullYear(), opcoes).has(paraTextoIso(data));
}

export function enesimoDiaUtilDoMes(ano: number, mes: number, posicao: number, opcoes: OpcoesDoCalendario = {}): Date {
	let encontrados = 0;
	for (let data = criarData(ano, mes, 1); data.getUTCMonth() === mes - 1; data = somarDias(data, 1)) {
		if (ehDiaUtil(data, opcoes)) {
			encontrados += 1;
			if (encontrados === posicao) {
				return data;
			}
		}
	}
	throw new RangeError(`O mês ${mes}/${ano} não tem ${posicao} dias úteis.`);
}

export function listarDiasUteis(inicio: Date, fim: Date, opcoes: OpcoesDoCalendario = {}): Date[] {
	const dias: Date[] = [];
	for (let data = inicio; data.getTime() <= fim.getTime(); data = somarDias(data, 1)) {
		if (ehDiaUtil(data, opcoes)) {
			dias.push(data);
		}
	}
	return dias;
}

export function diasUteisAte(inicio: Date, fim: Date, opcoes: OpcoesDoCalendario = {}): number {
	return listarDiasUteis(inicio, fim, opcoes).length;
}

export function diasCorridosAte(inicio: Date, fim: Date): number {
	return Math.round((fim.getTime() - inicio.getTime()) / MILISSEGUNDOS_POR_DIA);
}

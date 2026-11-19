const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const VALOR = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const DATA_NUMERICA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function formatarReais(valorEmCentavos: number): string {
	return MOEDA.format(valorEmCentavos / 100);
}

export function formatarValor(valorEmCentavos: number): string {
	return VALOR.format(valorEmCentavos / 100);
}

export function formatarData(data: Date): string {
	return DATA_LONGA.format(data);
}

export function formatarDataNumerica(data: Date): string {
	return DATA_NUMERICA.format(data);
}

const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function formatarReais(valorEmCentavos: number): string {
	return MOEDA.format(valorEmCentavos / 100);
}

export function formatarData(data: Date): string {
	return DATA_LONGA.format(data);
}

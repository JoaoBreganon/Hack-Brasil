import { BellRingIcon, ClipboardCheckIcon, FileTextIcon, HouseIcon, type LucideIcon, ShoppingBagIcon, UsersIcon } from "lucide-react";

export const ITEM_NOVO = "novo";
export const SUGERIR_ITENS = "sugerir";

export type CorDaFaixa = "cantalupo" | "azul" | "tinta" | "azul-fundo" | "papel";

export type Area = {
	caminho: string;
	rotulo: string;
	curto: string;
	icone: LucideIcon;
	cor: CorDaFaixa;
};

export const AREAS: Area[] = [
	{ caminho: "", rotulo: "Início", curto: "Início", icone: HouseIcon, cor: "cantalupo" },
	{ caminho: "compras", rotulo: "Compras", curto: "Compras", icone: ShoppingBagIcon, cor: "cantalupo" },
	{ caminho: "plano", rotulo: "Plano de compra", curto: "Plano", icone: ClipboardCheckIcon, cor: "azul" },
	{ caminho: "ata", rotulo: "Ata da APM", curto: "Ata", icone: FileTextIcon, cor: "tinta" },
	{ caminho: "alertas", rotulo: "Alertas de prazo", curto: "Alertas", icone: BellRingIcon, cor: "azul-fundo" },
	{ caminho: "pessoas", rotulo: "Quem cuida", curto: "Pessoas", icone: UsersIcon, cor: "papel" },
];

export function enderecoDaArea(codigoInep: string, caminho: string, busca?: Record<string, string>): string {
	const base = caminho ? `/escola/${codigoInep}/${caminho}` : `/escola/${codigoInep}`;
	return busca ? `${base}?${new URLSearchParams(busca).toString()}` : base;
}

export function areaDoEndereco(codigoInep: string, endereco: string): Area | undefined {
	return AREAS.find(({ caminho }) => enderecoDaArea(codigoInep, caminho) === endereco);
}

import { BellRingIcon, ClipboardCheckIcon, FileTextIcon, HouseIcon, type LucideIcon, ShoppingBagIcon, UsersIcon } from "lucide-react";

export const ITEM_NOVO = "novo";
export const SUGERIR_ITENS = "sugerir";

export type Area = {
	caminho: string;
	rotulo: string;
	icone: LucideIcon;
};

export const AREAS: Area[] = [
	{ caminho: "", rotulo: "Início", icone: HouseIcon },
	{ caminho: "compras", rotulo: "Compras", icone: ShoppingBagIcon },
	{ caminho: "plano", rotulo: "Plano de compra", icone: ClipboardCheckIcon },
	{ caminho: "ata", rotulo: "Ata da APM", icone: FileTextIcon },
];

export const AREAS_DA_ESCOLA: Area[] = [
	{ caminho: "alertas", rotulo: "Alertas no celular", icone: BellRingIcon },
	{ caminho: "pessoas", rotulo: "Quem cuida", icone: UsersIcon },
];

export function enderecoDaArea(codigoInep: string, caminho: string, busca?: Record<string, string>): string {
	const base = caminho ? `/escola/${codigoInep}/${caminho}` : `/escola/${codigoInep}`;
	return busca ? `${base}?${new URLSearchParams(busca).toString()}` : base;
}

export function enderecoDaPaginaPublica(codigoInep: string): string {
	return `/transparencia/${codigoInep}`;
}

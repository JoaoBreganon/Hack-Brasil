export type Etapa = {
	caminho: string;
	rotulo: string;
	curto: string;
};

export const ETAPAS: Etapa[] = [
	{ caminho: "", rotulo: "Saldo e prazo", curto: "Saldo" },
	{ caminho: "necessidades", rotulo: "O que comprar", curto: "Itens" },
	{ caminho: "orcamentos", rotulo: "Orçamentos", curto: "Preços" },
	{ caminho: "plano", rotulo: "Plano de compra", curto: "Plano" },
	{ caminho: "ata", rotulo: "Ata da APM", curto: "Ata" },
];

export const ETAPA_DE_ALERTAS: Etapa = { caminho: "alertas", rotulo: "Alertas no celular", curto: "Alertas" };

export function enderecoDaEtapa(codigoInep: string, caminho: string): string {
	return caminho ? `/escola/${codigoInep}/${caminho}` : `/escola/${codigoInep}`;
}

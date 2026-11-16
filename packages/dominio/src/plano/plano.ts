import { type Categoria, type ItemDeCompra, type ResultadoDaValidacao, type Saldo, validarItem } from "../regras/regras";

export const STATUS_DO_PLANO = ["rascunho", "aprovado"] as const;

export type StatusDoPlano = (typeof STATUS_DO_PLANO)[number];

export type Necessidade = ItemDeCompra & {
	prioridade: number;
};

export type ItemDoPlano = {
	necessidade: Necessidade;
	validacao: ResultadoDaValidacao;
};

export type PlanoDeCompra = {
	itens: ItemDoPlano[];
	foraDoPlano: ItemDoPlano[];
	totalPorCategoria: Saldo;
	saldoRestante: Saldo;
};

export function montarPlanoDeCompra(saldo: Saldo, necessidades: Necessidade[]): PlanoDeCompra {
	const ordenadas = [...necessidades].sort((a, b) => a.prioridade - b.prioridade || a.descricao.localeCompare(b.descricao, "pt-BR"));
	const saldoRestante: Saldo = { ...saldo };
	const totalPorCategoria: Saldo = { custeio: 0, capital: 0 };
	const itens: ItemDoPlano[] = [];
	const foraDoPlano: ItemDoPlano[] = [];

	for (const necessidade of ordenadas) {
		const validacao = validarItem(necessidade, saldoRestante);
		if (validacao.aprovado && validacao.categoria) {
			const categoria: Categoria = validacao.categoria;
			saldoRestante[categoria] -= validacao.totalEmCentavos;
			totalPorCategoria[categoria] += validacao.totalEmCentavos;
			itens.push({ necessidade, validacao });
		} else {
			foraDoPlano.push({ necessidade, validacao });
		}
	}

	return { itens, foraDoPlano, totalPorCategoria, saldoRestante };
}

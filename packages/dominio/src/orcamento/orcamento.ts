export const ORCAMENTOS_EXIGIDOS = 3;
export const ORIGENS_DO_ORCAMENTO = ["manual", "busca", "exemplo"] as const;

export type OrigemDoOrcamento = (typeof ORIGENS_DO_ORCAMENTO)[number];

export type Cotacao = {
	fornecedor: string;
	valorEmCentavos: number;
	endereco?: string;
};

export type Escolha = {
	vencedora: Cotacao;
	empatadas: Cotacao[];
	cotacoesOrdenadas: Cotacao[];
};

export function escolherMenorPreco(cotacoes: Cotacao[]): Escolha | null {
	const validas = cotacoes.filter((cotacao) => Number.isInteger(cotacao.valorEmCentavos) && cotacao.valorEmCentavos > 0);
	if (validas.length === 0) {
		return null;
	}
	const cotacoesOrdenadas = [...validas].sort((a, b) => a.valorEmCentavos - b.valorEmCentavos);
	const menorValor = cotacoesOrdenadas[0].valorEmCentavos;
	const empatadas = cotacoesOrdenadas.filter((cotacao) => cotacao.valorEmCentavos === menorValor);
	return {
		vencedora: cotacoesOrdenadas[0],
		empatadas: empatadas.length > 1 ? empatadas : [],
		cotacoesOrdenadas,
	};
}

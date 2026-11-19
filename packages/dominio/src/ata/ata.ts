import type { Escola } from "../escola/escola";
import { formatarData, formatarReais } from "../formato/formatar";
import type { Cotacao } from "../orcamento/orcamento";
import type { PlanoDeCompra } from "../plano/plano";
import { FONTES } from "../regras/fontes";
import type { Categoria, Saldo, TipoDeDespesa } from "../regras/regras";

export const ASSINATURAS_DA_ATA = [
	"Presidente da APM",
	"Tesoureiro ou tesoureira da APM",
	"Diretor ou diretora da escola",
	"Membro do conselho fiscal",
];

export type LinhaDaAta = {
	descricao: string;
	tipo: TipoDeDespesa;
	categoria: Categoria;
	quantidade: number;
	fornecedor: string;
	valorUnitarioEmCentavos: number;
	totalEmCentavos: number;
};

export type LinhaDoMapaDePrecos = {
	descricao: string;
	cotacoes: (Cotacao & { vencedora: boolean })[];
	justificativa?: string;
};

export type Ata = {
	titulo: string;
	abertura: string;
	deliberacao: string;
	itens: LinhaDaAta[];
	total: Saldo & { geral: number };
	mapaDePrecos: LinhaDoMapaDePrecos[];
	encerramento: string;
	assinaturas: string[];
};

export type DadosDaAta = {
	escola: Escola;
	exercicio: number;
	plano: PlanoDeCompra;
	data: Date;
};

export function montarAta({ escola, exercicio, plano, data }: DadosDaAta): Ata {
	const itens = plano.itens.flatMap(({ necessidade, validacao }) =>
		validacao.escolha && validacao.categoria
			? [
					{
						descricao: necessidade.descricao,
						tipo: necessidade.tipo,
						categoria: validacao.categoria,
						quantidade: necessidade.quantidade,
						fornecedor: validacao.escolha.vencedora.fornecedor,
						valorUnitarioEmCentavos: validacao.escolha.vencedora.valorEmCentavos,
						totalEmCentavos: validacao.totalEmCentavos,
					},
				]
			: [],
	);
	const total = { ...plano.totalPorCategoria, geral: plano.totalPorCategoria.custeio + plano.totalPorCategoria.capital };
	const mapaDePrecos = plano.itens.map(({ necessidade, validacao }) => ({
		descricao: necessidade.descricao,
		cotacoes: (validacao.escolha?.cotacoesOrdenadas ?? []).map((cotacao) => ({
			...cotacao,
			vencedora: cotacao === validacao.escolha?.vencedora,
		})),
		...(necessidade.justificativaParaMenosOrcamentos ? { justificativa: necessidade.justificativaParaMenosOrcamentos } : {}),
	}));

	return {
		titulo: `Ata de aprovação do plano de compra do PDDE · exercício de ${exercicio}`,
		abertura: `Aos ${formatarData(data)}, reuniram-se os membros da Associação de Pais e Mestres (APM), Unidade Executora da ${escola.nome}, código INEP ${escola.codigoInep}, em ${escola.municipio}, para deliberar sobre a aplicação do saldo do Programa Dinheiro Direto na Escola (PDDE) do exercício de ${exercicio}.`,
		deliberacao: `Depois de analisar os orçamentos, os presentes aprovaram a compra dos ${itens.length} itens abaixo pelo critério de menor preço por item (${FONTES.menorPreco.norma}), no valor total de ${formatarReais(total.geral)}, sendo ${formatarReais(total.custeio)} em custeio e ${formatarReais(total.capital)} em capital.`,
		itens,
		total,
		mapaDePrecos,
		encerramento: "Nada mais havendo a tratar, foi lavrada esta ata, que vai assinada pelos presentes.",
		assinaturas: ASSINATURAS_DA_ATA,
	};
}

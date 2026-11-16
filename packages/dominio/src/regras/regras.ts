import { FONTES, type Fonte } from "./fontes";
import { type Cotacao, type Escolha, escolherMenorPreco, ORCAMENTOS_EXIGIDOS } from "../orcamento/orcamento";

export const CATEGORIAS = ["custeio", "capital"] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export type Saldo = Record<Categoria, number>;

export const TIPOS_DE_DESPESA = [
	"material de consumo",
	"livro",
	"pequeno reparo",
	"serviço",
	"material permanente",
	"pessoal",
	"servidor público",
	"conta de consumo",
	"aluguel",
	"assistencial",
	"tarifa bancária",
	"tributo",
	"outro programa do FNDE",
] as const;

export type TipoDeDespesa = (typeof TIPOS_DE_DESPESA)[number];

export type ItemDeCompra = {
	id: string;
	descricao: string;
	tipo: TipoDeDespesa;
	quantidade: number;
	cotacoes: Cotacao[];
	justificativaParaMenosOrcamentos?: string;
};

export type Problema = {
	mensagem: string;
	fonte: Fonte;
};

export type ResultadoDaValidacao = {
	aprovado: boolean;
	categoria: Categoria | null;
	escolha: Escolha | null;
	totalEmCentavos: number;
	problemas: Problema[];
	avisos: Problema[];
};

type RegraDoTipo = { permitido: true; categoria: Categoria; fonte: Fonte } | { permitido: false; fonte: Fonte };

export const REGRAS_POR_TIPO: Record<TipoDeDespesa, RegraDoTipo> = {
	"material de consumo": { permitido: true, categoria: "custeio", fonte: FONTES.destinacao },
	livro: { permitido: true, categoria: "custeio", fonte: FONTES.livroEhConsumo },
	"pequeno reparo": { permitido: true, categoria: "custeio", fonte: FONTES.destinacao },
	serviço: { permitido: true, categoria: "custeio", fonte: FONTES.destinacao },
	"material permanente": { permitido: true, categoria: "capital", fonte: FONTES.destinacao },
	pessoal: { permitido: false, fonte: FONTES.vedacaoPessoal },
	"servidor público": { permitido: false, fonte: FONTES.vedacaoServidorEContasDeConsumo },
	"conta de consumo": { permitido: false, fonte: FONTES.vedacaoServidorEContasDeConsumo },
	aluguel: { permitido: false, fonte: FONTES.vedacaoServidorEContasDeConsumo },
	assistencial: { permitido: false, fonte: FONTES.vedacaoServidorEContasDeConsumo },
	"tarifa bancária": { permitido: false, fonte: FONTES.vedacaoTarifaBancaria },
	tributo: { permitido: false, fonte: FONTES.vedacaoTributo },
	"outro programa do FNDE": { permitido: false, fonte: FONTES.vedacaoOutroPrograma },
};

export function validarItem(item: ItemDeCompra, saldoDisponivel: Saldo): ResultadoDaValidacao {
	if (!Number.isInteger(item.quantidade) || item.quantidade < 1) {
		throw new RangeError(`A quantidade de "${item.descricao}" precisa ser um número inteiro maior que zero.`);
	}
	const problemas: Problema[] = [];
	const avisos: Problema[] = [];
	const regra = REGRAS_POR_TIPO[item.tipo];

	if (!regra.permitido) {
		problemas.push({ mensagem: `"${item.descricao}" é uma despesa vedada pelo PDDE (${item.tipo}).`, fonte: regra.fonte });
	}

	const escolha = escolherMenorPreco(item.cotacoes);
	if (!escolha) {
		problemas.push({ mensagem: `"${item.descricao}" não tem nenhum orçamento válido.`, fonte: FONTES.tresOrcamentos });
	} else if (escolha.cotacoesOrdenadas.length < ORCAMENTOS_EXIGIDOS) {
		const lista = item.justificativaParaMenosOrcamentos ? avisos : problemas;
		const complemento = item.justificativaParaMenosOrcamentos ? "com justificativa registrada" : "e falta a justificativa";
		lista.push({
			mensagem: `"${item.descricao}" tem ${escolha.cotacoesOrdenadas.length} de ${ORCAMENTOS_EXIGIDOS} orçamentos, ${complemento}.`,
			fonte: FONTES.menosDeTresOrcamentos,
		});
	}
	if (escolha && escolha.empatadas.length > 1) {
		avisos.push({
			mensagem: `Empate no menor preço de "${item.descricao}": a escolha precisa de sorteio público.`,
			fonte: FONTES.empateNoPreco,
		});
	}

	const totalEmCentavos = escolha ? escolha.vencedora.valorEmCentavos * item.quantidade : 0;
	const categoria = regra.permitido ? regra.categoria : null;

	if (categoria && escolha && totalEmCentavos > saldoDisponivel[categoria]) {
		problemas.push({
			mensagem: `"${item.descricao}" custa mais do que o saldo de ${categoria} disponível.`,
			fonte: FONTES.destinacao,
		});
	}

	return { aprovado: problemas.length === 0, categoria, escolha, totalEmCentavos, problemas, avisos };
}

export function dividirPeloPercentualPadrao(totalEmCentavos: number): Saldo {
	const custeio = Math.round(totalEmCentavos * 0.8);
	return { custeio, capital: totalEmCentavos - custeio };
}

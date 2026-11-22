import { LIMITES } from "../plano/entradas";
import type { TipoDeDespesa } from "../regras/regras";
import { CATALOGO_DE_SUGESTOES } from "../sugestao/regras-fixas";
import { chaveDaDescricao } from "../sugestao/sugestao";
import { type Cotacao, ORCAMENTOS_EXIGIDOS } from "./orcamento";

export const MOTIVOS_DO_EXEMPLO = ["sem configuração", "falha", "sem preço", "limite"] as const;

export type MotivoDoExemplo = (typeof MOTIVOS_DO_EXEMPLO)[number];

export type ResultadoDaBuscaDePrecos =
	{ origem: "busca"; encontrados: number } | { origem: "exemplo"; encontrados: number; motivo: MotivoDoExemplo };

export type ItemParaExemplo = {
	descricao: string;
	tipo: TipoDeDespesa;
};

type ModeloDoExemplo = {
	fornecedor: string;
	precoEmCentavos: number;
};

export const MODELOS_DO_EXEMPLO: Partial<Record<TipoDeDespesa, ModeloDoExemplo>> = {
	livro: { fornecedor: "Livraria", precoEmCentavos: 4_500 },
	"material de consumo": { fornecedor: "Papelaria", precoEmCentavos: 6_000 },
	"pequeno reparo": { fornecedor: "Prestador de reparos", precoEmCentavos: 150_000 },
	serviço: { fornecedor: "Prestador de serviços", precoEmCentavos: 40_000 },
	"material permanente": { fornecedor: "Loja", precoEmCentavos: 80_000 },
};

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function semente(texto: string): number {
	let valor = 7;
	for (const caractere of texto) {
		valor = (valor * 31 + (caractere.codePointAt(0) ?? 0)) % 1_000_003;
	}
	return valor;
}

function precoDeReferencia({ descricao, tipo }: ItemParaExemplo, padrao: number): number {
	const chave = chaveDaDescricao(descricao);
	const [melhor] = CATALOGO_DE_SUGESTOES.filter((modelo) => modelo.tipo === tipo)
		.map((modelo) => ({
			preco: modelo.precoDeReferenciaEmCentavos,
			pontos:
				chaveDaDescricao(modelo.descricao) === chave
					? Number.POSITIVE_INFINITY
					: modelo.palavras.filter((palavra) => chave.includes(palavra)).length,
		}))
		.filter(({ pontos }) => pontos > 0)
		.sort((a, b) => b.pontos - a.pontos);
	return melhor?.preco ?? padrao;
}

function arredondar(valorEmCentavos: number): number {
	const redondo = Math.round(valorEmCentavos / 100) * 100 - 10;
	return Math.min(LIMITES.valorEmCentavos.maximo, Math.max(LIMITES.valorEmCentavos.minimo, redondo));
}

function nomesLivres(prefixo: string, salvos: string[], quantos: number): string[] {
	const usados = new Set(salvos.map(chaveDaDescricao));
	return [...LETRAS]
		.map((letra) => `${prefixo} ${letra}`)
		.filter((nome) => !usados.has(chaveDaDescricao(nome)))
		.slice(0, quantos);
}

export function cotacoesDeExemplo(
	item: ItemParaExemplo,
	fornecedoresSalvos: string[] = [],
	limite: number = ORCAMENTOS_EXIGIDOS,
): Cotacao[] {
	const modelo = MODELOS_DO_EXEMPLO[item.tipo];
	const quantos = Math.min(ORCAMENTOS_EXIGIDOS, Math.max(0, Math.floor(limite)));
	if (!modelo || quantos === 0) {
		return [];
	}
	const base = precoDeReferencia(item, modelo.precoEmCentavos);
	const variacao = semente(chaveDaDescricao(item.descricao));
	let anterior = 0;
	return nomesLivres(modelo.fornecedor, fornecedoresSalvos, quantos).map((fornecedor, posicao) => {
		const fator = 0.95 + (variacao % 11) / 100 + posicao * (0.04 + ((variacao >> posicao) % 6) / 100);
		const valorEmCentavos = Math.max(arredondar(base * fator), anterior + 100);
		anterior = valorEmCentavos;
		return { fornecedor, valorEmCentavos };
	});
}

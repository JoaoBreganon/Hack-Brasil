import { lerValorEmCentavos } from "../importacao/saldos";
import { LIMITES } from "../plano/entradas";
import { type Cotacao, ORCAMENTOS_EXIGIDOS } from "./orcamento";

export type ResultadoDaBusca = {
	url: string;
	title?: string;
	json?: unknown;
};

export const ESQUEMA_DO_PRECO = {
	type: "object",
	properties: {
		loja: { type: "string", description: "Nome da loja que vende o produto" },
		produto: { type: "string", description: "Nome do produto anunciado" },
		preco: { type: "string", description: "Preço à vista de uma unidade, em reais" },
	},
	required: ["loja", "preco"],
} as const;

export const INSTRUCAO_DO_PRECO =
	"Extraia o nome da loja, o nome do produto e o preço à vista de uma unidade em reais. Se a página não vender o produto, deixe o preço vazio.";

function campoDeTexto(dados: unknown, campo: string): string {
	if (typeof dados !== "object" || dados === null) {
		return "";
	}
	const valor = (dados as Record<string, unknown>)[campo];
	if (typeof valor === "number") {
		return valor.toFixed(2);
	}
	return typeof valor === "string" ? valor.trim() : "";
}

function hostDoEndereco(endereco: string): string | null {
	try {
		const url = new URL(endereco);
		return url.protocol === "https:" ? url.hostname.replace(/^www\./, "") : null;
	} catch {
		return null;
	}
}

export function consultaDePreco(descricao: string): string {
	return `${descricao.replace(/\s+/g, " ").trim()} preço comprar`;
}

export function cotacoesDaBusca(resultados: ResultadoDaBusca[], limite: number = ORCAMENTOS_EXIGIDOS): Cotacao[] {
	const porLoja = new Map<string, Cotacao>();
	for (const { url, json } of resultados) {
		const host = hostDoEndereco(url);
		const valorEmCentavos = lerValorEmCentavos(campoDeTexto(json, "preco"));
		if (
			!host ||
			url.length > LIMITES.endereco.maximo ||
			valorEmCentavos === null ||
			valorEmCentavos < LIMITES.valorEmCentavos.minimo ||
			valorEmCentavos > LIMITES.valorEmCentavos.maximo
		) {
			continue;
		}
		const fornecedor = (campoDeTexto(json, "loja") || host).slice(0, LIMITES.fornecedor.maximo);
		const atual = porLoja.get(host);
		if (!atual || valorEmCentavos < atual.valorEmCentavos) {
			porLoja.set(host, { fornecedor, valorEmCentavos, endereco: url });
		}
	}
	return [...porLoja.values()].sort((a, b) => a.valorEmCentavos - b.valorEmCentavos).slice(0, limite);
}

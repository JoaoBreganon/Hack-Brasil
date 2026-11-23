import type { Cotacao } from "../orcamento/orcamento";
import { TIPOS_DE_DESPESA, type TipoDeDespesa } from "../regras/regras";

export const LIMITES = {
	descricao: { minimo: 3, maximo: 120 },
	quantidade: { minimo: 1, maximo: 100_000 },
	prioridade: { minimo: 1, maximo: 99 },
	fornecedor: { minimo: 2, maximo: 80 },
	valorEmCentavos: { minimo: 1, maximo: 100_000_000 },
	endereco: { maximo: 500 },
	justificativa: { minimo: 10, maximo: 500 },
	pedido: { maximo: 600 },
	orcamentosPorItem: 6,
	itensPorPlano: 60,
	sugestoesPorPedido: 10,
	escolasPorConta: 20,
	membrosPorEscola: 10,
	convitesPorEscola: 10,
	planilha: 500_000,
} as const;

export const ACOES_LIMITADAS = [
	"consulta ao PDDE Info",
	"contato",
	"planilha",
	"busca de preço",
	"sugestão com IA",
	"alerta manual",
] as const;

export type AcaoLimitada = (typeof ACOES_LIMITADAS)[number];

export const USOS_POR_HORA: Record<AcaoLimitada, number> = {
	"consulta ao PDDE Info": 120,
	contato: 30,
	planilha: 30,
	"busca de preço": 60,
	"sugestão com IA": 30,
	"alerta manual": 30,
};

export type Validacao<T> = { ok: true; valor: T } | { ok: false; erros: Partial<Record<keyof T, string>> };

export type EntradaDaNecessidade = {
	descricao: string;
	tipo: string;
	quantidade: number;
	prioridade: number;
};

export type NovaNecessidade = {
	descricao: string;
	tipo: TipoDeDespesa;
	quantidade: number;
	prioridade: number;
};

export type EntradaDaCotacao = {
	fornecedor: string;
	valorEmCentavos: number | null;
	endereco?: string;
};

function umaLinha(texto: string): string {
	return texto.replace(/\s+/g, " ").trim();
}

function inteiroEntre(valor: number, minimo: number, maximo: number): boolean {
	return Number.isInteger(valor) && valor >= minimo && valor <= maximo;
}

function ehTipoDeDespesa(tipo: string): tipo is TipoDeDespesa {
	return (TIPOS_DE_DESPESA as readonly string[]).includes(tipo);
}

function resultado<T>(valor: T, erros: Partial<Record<keyof T, string>>): Validacao<T> {
	return Object.keys(erros).length === 0 ? { ok: true, valor } : { ok: false, erros };
}

export function ehEnderecoWeb(texto: string): boolean {
	try {
		const { protocol, hostname } = new URL(texto);
		return protocol === "https:" && hostname.length > 0;
	} catch {
		return false;
	}
}

export function validarNecessidade(entrada: EntradaDaNecessidade): Validacao<NovaNecessidade> {
	const descricao = umaLinha(entrada.descricao);
	const erros: Partial<Record<keyof NovaNecessidade, string>> = {};
	if (descricao.length < LIMITES.descricao.minimo || descricao.length > LIMITES.descricao.maximo) {
		erros.descricao = `Descreva o item com ${LIMITES.descricao.minimo} a ${LIMITES.descricao.maximo} caracteres.`;
	}
	if (!ehTipoDeDespesa(entrada.tipo)) {
		erros.tipo = "Escolha o tipo de despesa.";
	}
	if (!inteiroEntre(entrada.quantidade, LIMITES.quantidade.minimo, LIMITES.quantidade.maximo)) {
		erros.quantidade = "A quantidade precisa ser um número inteiro maior que zero.";
	}
	if (!inteiroEntre(entrada.prioridade, LIMITES.prioridade.minimo, LIMITES.prioridade.maximo)) {
		erros.prioridade = `A prioridade vai de ${LIMITES.prioridade.minimo} a ${LIMITES.prioridade.maximo}.`;
	}
	return resultado(
		{ descricao, tipo: entrada.tipo as TipoDeDespesa, quantidade: entrada.quantidade, prioridade: entrada.prioridade },
		erros,
	);
}

export function validarCotacao(entrada: EntradaDaCotacao): Validacao<Cotacao> {
	const fornecedor = umaLinha(entrada.fornecedor);
	const endereco = entrada.endereco?.trim() || undefined;
	const valorEmCentavos = entrada.valorEmCentavos ?? 0;
	const erros: Partial<Record<keyof Cotacao, string>> = {};
	if (fornecedor.length < LIMITES.fornecedor.minimo || fornecedor.length > LIMITES.fornecedor.maximo) {
		erros.fornecedor = `Informe o fornecedor com ${LIMITES.fornecedor.minimo} a ${LIMITES.fornecedor.maximo} caracteres.`;
	}
	if (!inteiroEntre(valorEmCentavos, LIMITES.valorEmCentavos.minimo, LIMITES.valorEmCentavos.maximo)) {
		erros.valorEmCentavos = "Informe o preço unitário em reais, por exemplo 1.299,90.";
	}
	if (endereco && (endereco.length > LIMITES.endereco.maximo || !ehEnderecoWeb(endereco))) {
		erros.endereco = "O link precisa começar com https://.";
	}
	return resultado({ fornecedor, valorEmCentavos, ...(endereco ? { endereco } : {}) }, erros);
}

export function validarJustificativa(texto: string): Validacao<{ justificativa: string }> {
	const justificativa = texto.replace(/[ \t]+/g, " ").trim();
	const tamanhoValido = justificativa.length >= LIMITES.justificativa.minimo && justificativa.length <= LIMITES.justificativa.maximo;
	return resultado(
		{ justificativa },
		tamanhoValido ? {} : { justificativa: `Explique em ${LIMITES.justificativa.minimo} a ${LIMITES.justificativa.maximo} caracteres.` },
	);
}

export function validarPedido(texto: string): Validacao<{ pedido: string }> {
	const pedido = umaLinha(texto);
	return resultado(
		{ pedido },
		pedido.length > LIMITES.pedido.maximo ? { pedido: `Conte o que a escola precisa em até ${LIMITES.pedido.maximo} caracteres.` } : {},
	);
}

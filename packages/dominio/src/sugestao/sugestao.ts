import { type EntradaDaNecessidade, LIMITES, type NovaNecessidade, validarNecessidade } from "../plano/entradas";
import type { Fonte } from "../regras/fontes";
import { REGRAS_POR_TIPO, type Saldo, TIPOS_DE_DESPESA, type TipoDeDespesa } from "../regras/regras";

export const ORIGENS_DA_SUGESTAO = ["ia", "regras"] as const;

export type OrigemDaSugestao = (typeof ORIGENS_DA_SUGESTAO)[number];

export type ContextoDaSugestao = {
	saldo: Saldo;
	pedido?: string;
	jaNoPlano: string[];
	primeiraPrioridade: number;
};

export type SugestaoBloqueada = {
	descricao: string;
	tipo: TipoDeDespesa;
	motivo: string;
	fonte: Fonte;
};

export type ValidacaoDasSugestoes = {
	aceitas: NovaNecessidade[];
	bloqueadas: SugestaoBloqueada[];
	descartadas: number;
};

export type ResultadoDaSugestao = {
	origem: OrigemDaSugestao;
	adicionados: number;
	bloqueadas: SugestaoBloqueada[];
	descartadas: number;
	aviso?: string;
};

export function chaveDaDescricao(texto: string): string {
	return texto
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim();
}

export function quantasSugestoes(jaNoPlano: string[]): number {
	return Math.max(0, Math.min(LIMITES.sugestoesPorPedido, LIMITES.itensPorPlano - jaNoPlano.length));
}

function lerTipo(valor: unknown): string {
	if (typeof valor !== "string") {
		return "";
	}
	const chave = chaveDaDescricao(valor);
	return TIPOS_DE_DESPESA.find((tipo) => chaveDaDescricao(tipo) === chave) ?? valor.trim();
}

export function lerSugestoes(dados: unknown): EntradaDaNecessidade[] {
	const itens = typeof dados === "object" && dados !== null ? (dados as { itens?: unknown }).itens : undefined;
	if (!Array.isArray(itens)) {
		return [];
	}
	return itens.slice(0, LIMITES.itensPorPlano).map((item: unknown) => {
		const { descricao, tipo, quantidade, prioridade } =
			typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
		return {
			descricao: typeof descricao === "string" ? descricao : "",
			tipo: lerTipo(tipo),
			quantidade: typeof quantidade === "number" ? quantidade : 0,
			prioridade: typeof prioridade === "number" ? prioridade : 0,
		};
	});
}

export function validarSugestoes(sugestoes: EntradaDaNecessidade[], jaNoPlano: string[] = []): ValidacaoDasSugestoes {
	const vistas = new Set(jaNoPlano.map(chaveDaDescricao));
	const vagas = Math.max(0, LIMITES.itensPorPlano - jaNoPlano.length);
	const aceitas: NovaNecessidade[] = [];
	const bloqueadas: SugestaoBloqueada[] = [];
	let descartadas = 0;

	for (const sugestao of sugestoes) {
		const validacao = validarNecessidade(sugestao);
		if (!validacao.ok) {
			descartadas += 1;
			continue;
		}
		const { valor } = validacao;
		const regra = REGRAS_POR_TIPO[valor.tipo];
		if (!regra.permitido) {
			bloqueadas.push({ descricao: valor.descricao, tipo: valor.tipo, motivo: `O PDDE não paga ${valor.tipo}`, fonte: regra.fonte });
			continue;
		}
		const chave = chaveDaDescricao(valor.descricao);
		if (vistas.has(chave) || aceitas.length >= vagas) {
			descartadas += 1;
			continue;
		}
		vistas.add(chave);
		aceitas.push(valor);
	}

	return { aceitas, bloqueadas, descartadas };
}

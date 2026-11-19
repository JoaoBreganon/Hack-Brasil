import {
	CANAIS_DO_ALERTA,
	NIVEIS_DE_RISCO,
	ORIGENS_DO_ORCAMENTO,
	PAPEIS_DO_CONTATO,
	STATUS_DO_PLANO,
	TIPOS_DE_DESPESA,
} from "@aloca/dominio";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

function umDos<T extends string>(valores: readonly T[]) {
	return v.union(...valores.map((valor) => v.literal(valor)));
}

export const camposDaEscola = {
	codigoInep: v.string(),
	nome: v.string(),
	municipio: v.string(),
};

export const saldoPorCategoria = v.object({
	custeio: v.number(),
	capital: v.number(),
});

export const fonteDoDado = v.object({
	nome: v.string(),
	endereco: v.optional(v.string()),
});

export const tipoDeDespesa = umDos(TIPOS_DE_DESPESA);
export const papelDoContato = umDos(PAPEIS_DO_CONTATO);
export const nivelDeRisco = umDos(NIVEIS_DE_RISCO);
export const canalDoAlerta = umDos(CANAIS_DO_ALERTA);

export const pendenciaDoPdde = v.object({
	entidade: umDos(["UEx", "EEx", "EM"] as const),
	assunto: v.string(),
	mensagem: v.string(),
});

export default defineSchema({
	escola: defineTable(camposDaEscola).index("por_codigo_inep", ["codigoInep"]),

	saldo: defineTable({
		escolaId: v.id("escola"),
		exercicio: v.number(),
		saldo: saldoPorCategoria,
		fonte: fonteDoDado,
		coletadoEm: v.number(),
		pendencias: v.optional(v.array(pendenciaDoPdde)),
	}).index("por_escola_exercicio_coleta", ["escolaId", "exercicio", "coletadoEm"]),

	plano: defineTable({
		escolaId: v.id("escola"),
		exercicio: v.number(),
		saldoId: v.id("saldo"),
		status: umDos(STATUS_DO_PLANO),
		aprovadoEm: v.optional(v.number()),
	}).index("por_escola_exercicio", ["escolaId", "exercicio"]),

	item: defineTable({
		planoId: v.id("plano"),
		descricao: v.string(),
		tipo: tipoDeDespesa,
		quantidade: v.number(),
		prioridade: v.number(),
		justificativaParaMenosOrcamentos: v.optional(v.string()),
		buscaDePrecoEm: v.optional(v.number()),
	})
		.index("por_plano_prioridade", ["planoId", "prioridade"])
		.index("por_busca_de_preco", ["buscaDePrecoEm"]),

	orcamento: defineTable({
		itemId: v.id("item"),
		fornecedor: v.string(),
		valorEmCentavos: v.number(),
		endereco: v.optional(v.string()),
		origem: umDos(ORIGENS_DO_ORCAMENTO),
		coletadoEm: v.number(),
	}).index("por_item", ["itemId"]),

	contato: defineTable({
		escolaId: v.id("escola"),
		papel: papelDoContato,
		nome: v.string(),
		celular: v.string(),
		criadoEm: v.number(),
	}).index("por_escola_papel", ["escolaId", "papel"]),

	alerta: defineTable({
		escolaId: v.id("escola"),
		exercicio: v.number(),
		nivel: nivelDeRisco,
		mensagem: v.string(),
		canal: v.optional(canalDoAlerta),
		erro: v.optional(v.string()),
		criadoEm: v.number(),
		enviadoEm: v.optional(v.number()),
	})
		.index("por_escola_criacao", ["escolaId", "criadoEm"])
		.index("por_envio", ["enviadoEm"]),
});

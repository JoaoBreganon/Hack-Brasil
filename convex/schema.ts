import { NIVEIS_DE_RISCO, STATUS_DO_PLANO, TIPOS_DE_DESPESA } from "@aloca/dominio";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

function umDos<T extends string>(valores: readonly T[]) {
	return v.union(...valores.map((valor) => v.literal(valor)));
}

const fonteDoDado = v.object({
	nome: v.string(),
	endereco: v.optional(v.string()),
});

export default defineSchema({
	escola: defineTable({
		codigoInep: v.string(),
		nome: v.string(),
		municipio: v.string(),
	}).index("por_codigo_inep", ["codigoInep"]),

	saldo: defineTable({
		escolaId: v.id("escola"),
		exercicio: v.number(),
		saldo: v.object({
			custeio: v.number(),
			capital: v.number(),
		}),
		fonte: fonteDoDado,
		coletadoEm: v.number(),
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
		tipo: umDos(TIPOS_DE_DESPESA),
		quantidade: v.number(),
		prioridade: v.number(),
		justificativaParaMenosOrcamentos: v.optional(v.string()),
	}).index("por_plano_prioridade", ["planoId", "prioridade"]),

	orcamento: defineTable({
		itemId: v.id("item"),
		fornecedor: v.string(),
		valorEmCentavos: v.number(),
		endereco: v.optional(v.string()),
		coletadoEm: v.number(),
	}).index("por_item", ["itemId"]),

	alerta: defineTable({
		escolaId: v.id("escola"),
		exercicio: v.number(),
		nivel: umDos(NIVEIS_DE_RISCO),
		mensagem: v.string(),
		enviadoEm: v.optional(v.number()),
	})
		.index("por_escola_exercicio", ["escolaId", "exercicio"])
		.index("por_envio", ["enviadoEm"]),
});

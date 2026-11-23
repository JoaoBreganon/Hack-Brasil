import { EXERCICIO_SIMULADO, montarPlanoDeCompra, type Necessidade, type PlanoDeCompra, type Saldo } from "@aloca/dominio";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { buscarEscola } from "../escolas";
import { buscarSaldoAtual } from "../saldos";
import { exigirEdicao } from "./acesso";
import { falhar } from "./falha";

export type ItemComOrcamentos = Doc<"item"> & { orcamentos: Doc<"orcamento">[] };

export function buscarPlano(ctx: QueryCtx, escolaId: Id<"escola">) {
	return ctx.db
		.query("plano")
		.withIndex("por_escola_exercicio", (q) => q.eq("escolaId", escolaId).eq("exercicio", EXERCICIO_SIMULADO))
		.unique();
}

export async function itensComOrcamentos(ctx: QueryCtx, planoId: Id<"plano">): Promise<ItemComOrcamentos[]> {
	const itens = await ctx.db
		.query("item")
		.withIndex("por_plano_prioridade", (q) => q.eq("planoId", planoId))
		.collect();
	return Promise.all(
		itens.map(async (item) => ({
			...item,
			orcamentos: await ctx.db
				.query("orcamento")
				.withIndex("por_item", (q) => q.eq("itemId", item._id))
				.collect(),
		})),
	);
}

export function paraNecessidade(item: ItemComOrcamentos): Necessidade {
	return {
		id: item._id,
		descricao: item.descricao,
		tipo: item.tipo,
		quantidade: item.quantidade,
		prioridade: item.prioridade,
		cotacoes: item.orcamentos.map(({ fornecedor, valorEmCentavos, endereco }) => ({
			fornecedor,
			valorEmCentavos,
			...(endereco ? { endereco } : {}),
		})),
		...(item.justificativaParaMenosOrcamentos ? { justificativaParaMenosOrcamentos: item.justificativaParaMenosOrcamentos } : {}),
	};
}

export async function calcularPlano(ctx: QueryCtx, planoId: Id<"plano">, saldo: Saldo): Promise<PlanoDeCompra> {
	const itens = await itensComOrcamentos(ctx, planoId);
	return montarPlanoDeCompra(saldo, itens.map(paraNecessidade));
}

export async function planoEditavel(ctx: MutationCtx, codigoInep: string) {
	const escola = (await buscarEscola(ctx, codigoInep)) ?? falhar("Busque o saldo da escola antes de montar o plano.");
	await exigirEdicao(ctx, escola);
	const plano = await buscarPlano(ctx, escola._id);
	if (plano) {
		if (plano.status === "aprovado") {
			falhar("O plano já foi aprovado. Reabra o plano para fazer mudanças.");
		}
		return { escola, plano };
	}
	const saldo = (await buscarSaldoAtual(ctx, escola._id)) ?? falhar("Busque o saldo da escola antes de montar o plano.");
	const planoId = await ctx.db.insert("plano", {
		escolaId: escola._id,
		exercicio: EXERCICIO_SIMULADO,
		saldoId: saldo._id,
		status: "rascunho",
	});
	return { escola, plano: (await ctx.db.get(planoId)) ?? falhar("Não foi possível criar o plano.") };
}

export async function itemEditavel(ctx: MutationCtx, itemId: Id<"item">) {
	const item = (await ctx.db.get(itemId)) ?? falhar("Este item não existe mais.");
	const plano = (await ctx.db.get(item.planoId)) ?? falhar("O plano deste item não existe mais.");
	const escola = (await ctx.db.get(plano.escolaId)) ?? falhar("A escola deste item não existe mais.");
	await exigirEdicao(ctx, escola);
	if (plano.status === "aprovado") {
		falhar("O plano já foi aprovado. Reabra o plano para fazer mudanças.");
	}
	return { item, plano };
}

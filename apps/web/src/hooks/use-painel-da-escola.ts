"use client";

import { montarPlanoDeCompra, type Necessidade, simularPrazo } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export type DadosDoPainel = NonNullable<FunctionReturnType<typeof api.painel.daEscola>>;
export type ItemDoPainel = DadosDoPainel["itens"][number];

function paraNecessidade(item: ItemDoPainel): Necessidade {
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
		...(item.justificativa ? { justificativaParaMenosOrcamentos: item.justificativa } : {}),
	};
}

function derivar(dados: DadosDoPainel) {
	if (!dados.saldo) {
		return null;
	}
	const { saldo } = dados.saldo;
	const saldoTotal = saldo.custeio + saldo.capital;
	return {
		saldoTotal,
		prazo: simularPrazo(saldoTotal),
		plano: montarPlanoDeCompra(saldo, dados.itens.map(paraNecessidade)),
		aprovado: dados.plano?.status === "aprovado",
	};
}

export function useCodigoInep(): string {
	return useParams<{ inep: string }>().inep;
}

export function usePainelDaEscola() {
	const codigoInep = useCodigoInep();
	const dados = useQuery(api.painel.daEscola, { codigoInep });
	const derivados = useMemo(() => (dados ? derivar(dados) : null), [dados]);
	return { codigoInep, carregando: dados === undefined, dados: dados ?? null, derivados };
}

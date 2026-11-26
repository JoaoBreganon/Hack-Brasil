"use client";

import type { ReactNode } from "react";
import { Entrada } from "@/components/movimento/entrada";
import { Skeleton } from "@/components/ui/skeleton";
import { type DadosDoPainel, usePainelDaEscola } from "@/hooks/use-painel-da-escola";
import { BuscaDoSaldo } from "./busca-do-saldo";

type Painel = ReturnType<typeof usePainelDaEscola>;
type Pronto = {
	codigoInep: string;
	dados: DadosDoPainel & { saldo: NonNullable<DadosDoPainel["saldo"]> };
	derivados: NonNullable<Painel["derivados"]>;
};

export function Carregando() {
	return (
		<div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-6">
			<Skeleton className="h-80 w-full rounded-[28px]" />
			<Skeleton className="h-64 w-full rounded-[28px]" />
		</div>
	);
}

export function PainelCarregado({ children }: { children: (painel: Pronto) => ReactNode }) {
	const { codigoInep, carregando, dados, derivados } = usePainelDaEscola();
	if (carregando) {
		return <Carregando />;
	}
	if (!dados?.saldo || !derivados) {
		return <BuscaDoSaldo codigoInep={codigoInep} />;
	}
	return <Entrada>{children({ codigoInep, dados: { ...dados, saldo: dados.saldo }, derivados })}</Entrada>;
}

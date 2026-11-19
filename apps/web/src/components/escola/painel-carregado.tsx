"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { type DadosDoPainel, usePainelDaEscola } from "@/hooks/use-painel-da-escola";
import { BuscaDoSaldo } from "./busca-do-saldo";

type Painel = ReturnType<typeof usePainelDaEscola>;
type Pronto = {
	codigoInep: string;
	dados: DadosDoPainel & { saldo: NonNullable<DadosDoPainel["saldo"]> };
	derivados: NonNullable<Painel["derivados"]>;
};

export function CarregandoEtapa() {
	return (
		<div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-6">
			<Skeleton className="h-10 w-2/3 max-w-md" />
			<Skeleton className="h-5 w-full max-w-xl" />
			<div className="flex flex-wrap gap-6">
				<Skeleton className="h-72 flex-[2_1_480px] rounded-[20px]" />
				<Skeleton className="h-72 flex-[1_1_320px] rounded-[20px]" />
			</div>
		</div>
	);
}

export function PainelCarregado({ children }: { children: (painel: Pronto) => ReactNode }) {
	const { codigoInep, carregando, dados, derivados } = usePainelDaEscola();
	if (carregando) {
		return <CarregandoEtapa />;
	}
	if (!dados?.saldo || !derivados) {
		return <BuscaDoSaldo codigoInep={codigoInep} />;
	}
	return children({ codigoInep, dados: { ...dados, saldo: dados.saldo }, derivados });
}

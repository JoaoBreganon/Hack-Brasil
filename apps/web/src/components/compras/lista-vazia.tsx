"use client";

import type { ResultadoDaSugestao, Saldo } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { enderecoDaArea, ITEM_NOVO } from "@/config/navegacao";
import { useOperacao } from "@/hooks/use-operacao";
import { FormularioDeSugestao } from "./sugestao-de-itens";

type Propriedades = {
	codigoInep: string;
	saldoLivre: Saldo;
	aoSugerir: (resultado: ResultadoDaSugestao) => void;
	podeEditar: boolean;
};

export function ListaVazia({ codigoInep, saldoLivre, aoSugerir, podeEditar }: Propriedades) {
	const preencher = useOperacao(useMutation(api.itens.preencherComExemplo));

	if (!podeEditar) {
		return (
			<Empty className="rounded-lg border border-border bg-card py-14">
				<EmptyHeader>
					<EmptyTitle className="text-lg font-semibold">Nenhum item ainda</EmptyTitle>
					<EmptyDescription>Quem cuida desta escola no Aloca ainda não montou a lista de compras.</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<Empty className="rounded-lg border border-border bg-card py-14">
			<EmptyHeader>
				<EmptyTitle className="text-lg font-semibold">Nenhum item ainda</EmptyTitle>
				<EmptyDescription>
					Conte o que a escola precisa e o Aloca sugere os itens dentro do saldo e das regras do PDDE. Para conhecer o Aloca, use
					a lista de exemplo.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent className="max-w-md">
				<FormularioDeSugestao codigoInep={codigoInep} saldoLivre={saldoLivre} aoSugerir={aoSugerir} className="w-full" />
				<div className="flex w-full flex-wrap justify-center gap-2 border-t border-regra pt-4">
					<Link
						href={enderecoDaArea(codigoInep, "compras", { item: ITEM_NOVO })}
						scroll={false}
						className={buttonVariants({ variant: "secondary" })}
					>
						<PlusIcon data-icon="inline-start" />
						Novo item
					</Link>
					<Button variant="ghost" onClick={() => preencher.executar({ codigoInep })} disabled={preencher.executando}>
						{preencher.executando && <Spinner data-icon="inline-start" />}
						Usar a lista de exemplo
					</Button>
				</div>
			</EmptyContent>
		</Empty>
	);
}

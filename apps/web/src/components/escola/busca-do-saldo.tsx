"use client";

import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useOperacao } from "@/hooks/use-operacao";

export function BuscaDoSaldo({ codigoInep }: { codigoInep: string }) {
	const consultar = useOperacao(useAction(api.pddeInfo.consultar));

	async function buscar() {
		const resultado = await consultar.executar({ codigoInep });
		if (resultado?.aviso) {
			toast.warning(resultado.aviso);
		}
	}

	return (
		<Empty className="rounded-lg border border-border bg-card py-16">
			<EmptyHeader>
				<EmptyTitle className="font-heading text-2xl font-bold">
					<h1>Ainda não temos o saldo desta escola</h1>
				</EmptyTitle>
				<EmptyDescription>O Aloca lê o saldo e as pendências da escola {codigoInep} no PDDE Info, do FNDE.</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button size="lg" onClick={buscar} disabled={consultar.executando}>
					{consultar.executando ? <Spinner data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
					{consultar.executando ? "Lendo o PDDE Info…" : "Buscar o saldo"}
				</Button>
			</EmptyContent>
		</Empty>
	);
}

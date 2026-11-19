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
	const consultar = useAction(api.pddeInfo.consultar);
	const { executar, executando } = useOperacao(consultar);

	async function buscar() {
		const resultado = await executar({ codigoInep });
		if (resultado?.aviso) {
			toast.warning(resultado.aviso);
		}
	}

	return (
		<Empty className="mx-auto max-w-xl rounded-[20px] bg-card py-14 shadow-[0_0_0_1px_var(--pauta)]">
			<EmptyHeader>
				<EmptyTitle className="font-heading text-2xl font-bold">
					<h1>Ainda não temos o saldo desta escola</h1>
				</EmptyTitle>
				<EmptyDescription>
					O Aloca lê o saldo, os repasses e as pendências da escola {codigoInep} na consulta pública do PDDE Info, do FNDE.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button size="xl" onClick={buscar} disabled={executando}>
					{executando ? <Spinner data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
					{executando ? "Lendo o PDDE Info…" : "Buscar o saldo no PDDE Info"}
				</Button>
			</EmptyContent>
		</Empty>
	);
}

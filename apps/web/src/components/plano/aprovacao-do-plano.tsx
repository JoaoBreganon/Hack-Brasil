"use client";

import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { CheckIcon, LockOpenIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useOperacao } from "@/hooks/use-operacao";

type Propriedades = {
	codigoInep: string;
	aprovado: boolean;
	podeAprovar: boolean;
};

export function AprovacaoDoPlano({ codigoInep, aprovado, podeAprovar }: Propriedades) {
	const aprovar = useOperacao(useMutation(api.planos.aprovar));
	const reabrir = useOperacao(useMutation(api.planos.reabrir));
	const [confirmando, setConfirmando] = useState(false);

	async function confirmarAprovacao() {
		if ((await aprovar.executar({ codigoInep })) !== null) {
			toast.success("Plano aprovado. A ata está pronta.");
		}
		setConfirmando(false);
	}

	if (aprovado) {
		return (
			<Button variant="outline" size="lg" onClick={() => reabrir.executar({ codigoInep })} disabled={reabrir.executando}>
				{reabrir.executando ? <Spinner data-icon="inline-start" /> : <LockOpenIcon data-icon="inline-start" />}
				Reabrir para editar
			</Button>
		);
	}

	if (confirmando) {
		return (
			<div role="group" aria-label="Confirmar aprovação" className="flex flex-wrap items-center gap-3 rounded-xl bg-papel p-2 pl-4">
				<span className="text-sm font-medium">A APM aprovou este plano em reunião?</span>
				<Button size="lg" onClick={confirmarAprovacao} disabled={aprovar.executando}>
					{aprovar.executando ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
					Sim, aprovar
				</Button>
				<Button variant="ghost" size="lg" onClick={() => setConfirmando(false)}>
					Ainda não
				</Button>
			</div>
		);
	}

	return (
		<Button size="xl" onClick={() => setConfirmando(true)} disabled={!podeAprovar}>
			<CheckIcon data-icon="inline-start" />
			Aprovar o plano
		</Button>
	);
}

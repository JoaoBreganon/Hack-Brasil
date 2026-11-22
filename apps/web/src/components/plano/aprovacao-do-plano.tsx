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

	async function confirmar() {
		if ((await aprovar.executar({ codigoInep })) !== undefined) {
			toast.success("Plano aprovado. A ata está pronta.");
		}
		setConfirmando(false);
	}

	if (aprovado) {
		return (
			<Button variant="ghost" onClick={() => reabrir.executar({ codigoInep })} disabled={reabrir.executando}>
				{reabrir.executando ? <Spinner data-icon="inline-start" /> : <LockOpenIcon data-icon="inline-start" />}
				Reabrir
			</Button>
		);
	}

	if (confirmando) {
		return (
			<div role="group" aria-label="Confirmar a aprovação" className="flex flex-wrap items-center gap-2">
				<span className="text-sm font-medium">A APM aprovou em reunião?</span>
				<Button onClick={confirmar} disabled={aprovar.executando}>
					{aprovar.executando ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
					Sim, aprovar
				</Button>
				<Button variant="ghost" onClick={() => setConfirmando(false)}>
					Ainda não
				</Button>
			</div>
		);
	}

	return (
		<Button onClick={() => setConfirmando(true)} disabled={!podeAprovar}>
			<CheckIcon data-icon="inline-start" />
			Aprovar o plano
		</Button>
	);
}

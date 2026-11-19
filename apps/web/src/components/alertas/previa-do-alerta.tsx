"use client";

import { type PrazoSimulado, preencherTemplate, TEMPLATE_DO_WHATSAPP, variaveisDoWhatsapp } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { SendIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useOperacao } from "@/hooks/use-operacao";

type Propriedades = {
	codigoInep: string;
	nomeDaEscola: string;
	prazo: PrazoSimulado;
	saldoEmRiscoEmCentavos: number;
};

export function PreviaDoAlerta({ codigoInep, nomeDaEscola, prazo, saldoEmRiscoEmCentavos }: Propriedades) {
	const enviar = useOperacao(useAction(api.alertas.enviarAgora));
	const { situacao } = prazo;

	async function enviarAgora() {
		const resultado = await enviar.executar({ codigoInep });
		if (resultado) {
			toast[resultado.falhas > 0 ? "warning" : "success"](
				resultado.falhas > 0
					? `${resultado.enviados} enviados e ${resultado.falhas} com falha.`
					: `Alerta enviado para ${resultado.enviados} celular(es).`,
			);
		}
	}

	if (situacao.tipo !== "correndo") {
		return null;
	}

	const mensagem = preencherTemplate(
		TEMPLATE_DO_WHATSAPP.corpo,
		variaveisDoWhatsapp({
			nomeDaEscola,
			diasUteisRestantes: situacao.diasUteisRestantes,
			saldoEmRiscoEmCentavos,
			limiteParaUso: situacao.limiteParaUso,
		}),
	);

	return (
		<section aria-labelledby="titulo-previa" className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
			<h2 id="titulo-previa" className="font-semibold">
				A mensagem
			</h2>
			<figure className="rounded-lg bg-background p-4 text-[15px] leading-relaxed">
				<figcaption className="mb-1 font-semibold">{TEMPLATE_DO_WHATSAPP.cabecalho}</figcaption>
				<p className="whitespace-pre-line text-pretty">{mensagem}</p>
			</figure>
			<Button variant="secondary" onClick={enviarAgora} disabled={enviar.executando} className="self-start">
				{enviar.executando ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
				Enviar um teste agora
			</Button>
		</section>
	);
}

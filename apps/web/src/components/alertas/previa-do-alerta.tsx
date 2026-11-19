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
					? `${resultado.enviados} enviados e ${resultado.falhas} com falha. Veja o histórico.`
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
		<section aria-labelledby="titulo-previa" className="flex flex-col gap-4">
			<h2 id="titulo-previa" className="font-heading text-xl font-bold tracking-tight">
				A mensagem
			</h2>
			<div className="rounded-[20px] bg-papel p-4 sm:p-6">
				<figure className="ml-auto max-w-[420px] rounded-2xl rounded-tr-sm bg-white px-4 py-3 text-[15px] leading-relaxed shadow-[0_1px_1px_rgb(11_15_28/0.12)]">
					<figcaption className="mb-1.5 font-semibold">{TEMPLATE_DO_WHATSAPP.cabecalho}</figcaption>
					<p className="whitespace-pre-line text-pretty">{mensagem}</p>
					<p className="mt-2 text-xs text-muted-foreground">{TEMPLATE_DO_WHATSAPP.rodape}</p>
				</figure>
			</div>
			<div className="flex flex-wrap items-center gap-3">
				<Button size="lg" onClick={enviarAgora} disabled={enviar.executando}>
					{enviar.executando ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
					Enviar um alerta agora
				</Button>
				<span className="text-xs text-muted-foreground">
					Usa a simulação do prazo. O envio automático roda todo dia e avisa uma vez por semana.
				</span>
			</div>
		</section>
	);
}

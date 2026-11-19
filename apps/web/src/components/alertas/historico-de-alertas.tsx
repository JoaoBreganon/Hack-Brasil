"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Badge } from "@/components/ui/badge";

const DATA_E_HORA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export function HistoricoDeAlertas({ codigoInep }: { codigoInep: string }) {
	const alertas = useQuery(api.alertas.historico, { codigoInep });
	if (!alertas || alertas.length === 0) {
		return null;
	}
	return (
		<section aria-labelledby="titulo-historico" className="flex flex-col gap-3">
			<h2 id="titulo-historico" className="font-heading text-lg font-bold tracking-tight">
				Últimos envios
			</h2>
			<ul className="overflow-hidden rounded-2xl bg-card shadow-[0_0_0_1px_var(--pauta)]">
				{alertas.map((alerta) => (
					<li
						key={alerta._id}
						className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-pauta px-5 py-3 text-sm last:border-b-0"
					>
						<span className="text-muted-foreground tabular-nums">{DATA_E_HORA.format(alerta.criadoEm)}</span>
						{alerta.canal ? (
							<Badge variant="secondary">{alerta.canal === "whatsapp" ? "WhatsApp" : "SMS"}</Badge>
						) : (
							<Badge variant="destructive">falhou</Badge>
						)}
						{alerta.erro && <span className="w-full text-xs text-perigo">{alerta.erro}</span>}
					</li>
				))}
			</ul>
		</section>
	);
}

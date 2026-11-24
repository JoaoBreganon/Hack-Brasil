"use client";

import { ROTULO_DO_CANAL } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

const DATA_E_HORA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export function HistoricoDeAlertas({ codigoInep }: { codigoInep: string }) {
	const alertas = useQuery(api.alertas.historico, { codigoInep });
	if (!alertas || alertas.length === 0) {
		return null;
	}
	return (
		<section aria-labelledby="titulo-historico" className="overflow-hidden rounded-lg border border-border bg-card">
			<h2 id="titulo-historico" className="px-5 py-4 font-semibold">
				Últimos envios
			</h2>
			<ul>
				{alertas.map((alerta) => (
					<li
						key={alerta._id}
						className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-t border-regra px-5 py-3 text-sm"
					>
						<span className="tabular-nums">{DATA_E_HORA.format(alerta.criadoEm)}</span>
						{alerta.canal ? (
							<span className="text-muted-foreground">{ROTULO_DO_CANAL[alerta.canal]}</span>
						) : (
							<span className="text-perigo">Falhou: {alerta.erro}</span>
						)}
					</li>
				))}
			</ul>
		</section>
	);
}

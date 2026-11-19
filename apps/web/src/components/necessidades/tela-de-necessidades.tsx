"use client";

import { LockIcon } from "lucide-react";
import Link from "next/link";
import { CabecalhoDaEtapa } from "@/components/escola/cabecalho-da-etapa";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { enderecoDaEtapa, ETAPAS } from "@/config/etapas";
import { FormularioDeNecessidade } from "./formulario-de-necessidade";
import { ListaDeNecessidades } from "./lista-de-necessidades";

export function TelaDeNecessidades() {
	return (
		<PainelCarregado>
			{({ codigoInep, dados, derivados }) => (
				<>
					<CabecalhoDaEtapa
						titulo="O que a escola precisa comprar"
						descricao="Liste os itens na ordem de prioridade. O Aloca separa custeio e capital e avisa na hora o que o PDDE não paga."
					/>
					{derivados.aprovado && (
						<Alert className="rounded-2xl px-5 py-4">
							<LockIcon aria-hidden="true" />
							<AlertTitle>O plano já foi aprovado</AlertTitle>
							<AlertDescription>
								Para mudar a lista,{" "}
								<Link
									href={enderecoDaEtapa(codigoInep, ETAPAS[3].caminho)}
									className="font-medium text-primary underline-offset-2 hover:underline"
								>
									reabra o plano
								</Link>
								.
							</AlertDescription>
						</Alert>
					)}
					<div className="flex flex-wrap items-start gap-6">
						<FormularioDeNecessidade
							codigoInep={codigoInep}
							proximaPrioridade={dados.itens.reduce((maior, { prioridade }) => Math.max(maior, prioridade), 0) + 1}
							bloqueado={derivados.aprovado}
						/>
						<ListaDeNecessidades codigoInep={codigoInep} itens={dados.itens} bloqueado={derivados.aprovado} />
					</div>
				</>
			)}
		</PainelCarregado>
	);
}

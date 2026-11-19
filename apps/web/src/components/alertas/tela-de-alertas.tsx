"use client";

import { PAPEIS_DO_CONTATO } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { CabecalhoDaPagina } from "@/components/escola/cabecalho-da-pagina";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { Skeleton } from "@/components/ui/skeleton";
import { ContatoDaEscola } from "./contato-da-escola";
import { HistoricoDeAlertas } from "./historico-de-alertas";
import { PreviaDoAlerta } from "./previa-do-alerta";

function Contatos({ codigoInep }: { codigoInep: string }) {
	const contatos = useQuery(api.contatos.daEscola, { codigoInep });
	return (
		<section
			aria-labelledby="titulo-contatos"
			className="flex min-w-0 flex-[1_1_360px] flex-col overflow-hidden rounded-lg border border-border bg-card"
		>
			<div className="px-5 py-4">
				<h2 id="titulo-contatos" className="font-semibold">
					Quem recebe
				</h2>
				<p className="text-sm text-muted-foreground">O número aparece mascarado e só serve para o aviso de prazo.</p>
			</div>
			{contatos === undefined ? (
				<Skeleton className="mx-5 mb-5 h-20" />
			) : (
				<ul>
					{PAPEIS_DO_CONTATO.map((papel) => (
						<ContatoDaEscola
							key={papel}
							codigoInep={codigoInep}
							papel={papel}
							contato={contatos.find((contato) => contato.papel === papel) ?? null}
						/>
					))}
				</ul>
			)}
		</section>
	);
}

export function TelaDeAlertas() {
	return (
		<PainelCarregado>
			{({ codigoInep, dados, derivados }) => {
				const noPlanoAprovado = derivados.aprovado
					? derivados.plano.totalPorCategoria.custeio + derivados.plano.totalPorCategoria.capital
					: 0;
				return (
					<>
						<CabecalhoDaPagina
							titulo="Alertas no celular"
							frase="Um WhatsApp quando o prazo apertar. Se não chegar, vai por SMS."
						/>
						<div className="flex flex-wrap items-start gap-6">
							<Contatos codigoInep={codigoInep} />
							<div className="flex min-w-0 flex-[1_1_360px] flex-col gap-6">
								<PreviaDoAlerta
									codigoInep={codigoInep}
									nomeDaEscola={dados.escola.nome}
									prazo={derivados.prazo}
									saldoEmRiscoEmCentavos={derivados.saldoTotal - noPlanoAprovado}
								/>
								<HistoricoDeAlertas codigoInep={codigoInep} />
							</div>
						</div>
					</>
				);
			}}
		</PainelCarregado>
	);
}

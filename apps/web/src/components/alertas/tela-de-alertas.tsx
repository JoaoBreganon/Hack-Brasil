"use client";

import { PAPEIS_DO_CONTATO } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { CabecalhoDaEtapa } from "@/components/escola/cabecalho-da-etapa";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { CartaoDoContato } from "./cartao-do-contato";
import { HistoricoDeAlertas } from "./historico-de-alertas";
import { PreviaDoAlerta } from "./previa-do-alerta";

function Contatos({ codigoInep }: { codigoInep: string }) {
	const contatos = useQuery(api.contatos.daEscola, { codigoInep });
	return (
		<section aria-labelledby="titulo-contatos" className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
			<h2 id="titulo-contatos" className="font-heading text-xl font-bold tracking-tight">
				Quem recebe
			</h2>
			{PAPEIS_DO_CONTATO.map((papel) => (
				<CartaoDoContato
					key={papel}
					codigoInep={codigoInep}
					papel={papel}
					contato={contatos?.find((contato) => contato.papel === papel) ?? null}
					carregando={contatos === undefined}
				/>
			))}
			<p className="text-xs text-muted-foreground">
				O número fica guardado só para o alerta de prazo e aparece mascarado na tela. Ninguém recebe propaganda.
			</p>
		</section>
	);
}

export function TelaDeAlertas() {
	return (
		<PainelCarregado>
			{({ codigoInep, dados, derivados }) => (
				<>
					<CabecalhoDaEtapa
						titulo="Alerta de prazo no celular"
						descricao="O diretor e o tesoureiro recebem um WhatsApp quando o prazo aperta. Se o WhatsApp não chegar, o aviso vai por SMS."
					/>
					<div className="flex flex-wrap items-start gap-6">
						<Contatos codigoInep={codigoInep} />
						<div className="flex min-w-0 flex-[1_1_380px] flex-col gap-6">
							<PreviaDoAlerta
								codigoInep={codigoInep}
								nomeDaEscola={dados.escola.nome}
								prazo={derivados.prazo}
								saldoEmRiscoEmCentavos={
									derivados.saldoTotal -
									(derivados.aprovado
										? derivados.plano.totalPorCategoria.custeio + derivados.plano.totalPorCategoria.capital
										: 0)
								}
							/>
							<HistoricoDeAlertas codigoInep={codigoInep} />
						</div>
					</div>
				</>
			)}
		</PainelCarregado>
	);
}

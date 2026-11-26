"use client";

import { ehEscolaDeDemonstracao, PAPEIS_DO_CONTATO } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { CabecalhoDaPagina } from "@/components/escola/cabecalho-da-pagina";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { Skeleton } from "@/components/ui/skeleton";
import { ContatoDaEscola } from "./contato-da-escola";
import { HistoricoDeAlertas } from "./historico-de-alertas";
import { PreviaDoAlerta } from "./previa-do-alerta";

function Contatos({ codigoInep, membro }: { codigoInep: string; membro: boolean }) {
	const demonstracao = ehEscolaDeDemonstracao(codigoInep);
	const contatos = useQuery(api.contatos.daEscola, demonstracao || !membro ? "skip" : { codigoInep });
	return (
		<section
			aria-labelledby="titulo-contatos"
			className="flex min-w-0 flex-[1_1_360px] flex-col overflow-hidden rounded-3xl border border-border/70 bg-card"
		>
			<div className="px-5 py-4">
				<h2 id="titulo-contatos" className="font-semibold">
					Quem recebe
				</h2>
				<p className="text-sm text-muted-foreground">Celular e e-mail aparecem mascarados e só servem para o aviso de prazo.</p>
			</div>
			{demonstracao ? (
				<p className="border-t border-regra px-5 py-4 text-muted-foreground">
					Na escola de demonstração não dá para cadastrar contatos nem mandar alertas. Entre com o código INEP da sua escola para
					usar os avisos.
				</p>
			) : !membro ? (
				<p className="border-t border-regra px-5 py-4 text-muted-foreground">
					Só quem cuida desta escola no Aloca vê e cadastra quem recebe o alerta.
				</p>
			) : contatos === undefined ? (
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
							titulo="Alertas de prazo"
							frase="Um aviso quando o prazo apertar, por WhatsApp, SMS ou e-mail."
						/>
						<div className="flex flex-wrap items-start gap-6">
							<Contatos codigoInep={codigoInep} membro={dados.acesso.membro} />
							<div className="flex min-w-0 flex-[1_1_360px] flex-col gap-6">
								<PreviaDoAlerta
									codigoInep={codigoInep}
									nomeDaEscola={dados.escola.nome}
									prazo={derivados.prazo}
									saldoEmRiscoEmCentavos={derivados.saldoTotal - noPlanoAprovado}
									podeEnviar={dados.acesso.membro}
								/>
								{dados.acesso.membro && <HistoricoDeAlertas codigoInep={codigoInep} />}
							</div>
						</div>
					</>
				);
			}}
		</PainelCarregado>
	);
}

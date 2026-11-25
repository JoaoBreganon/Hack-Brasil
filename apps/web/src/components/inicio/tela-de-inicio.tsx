"use client";

import { capituloDoPrazo, formatarReais, montarMesesDoPrazo } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { ArrowRightIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarioDoPrazo, LegendaDoCalendario } from "@/components/calendario/calendario-do-prazo";
import { CabecalhoDaPagina } from "@/components/escola/cabecalho-da-pagina";
import { CapituloAtual } from "@/components/escola/capitulo-atual";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { enderecoDaArea } from "@/config/navegacao";
import { useOperacao } from "@/hooks/use-operacao";
import { definirProximoPasso } from "@/lib/proximo-passo";

const DIA_E_MES = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" });

function AtualizarSaldo({ codigoInep }: { codigoInep: string }) {
	const consultar = useOperacao(useAction(api.pddeInfo.consultar));

	async function atualizar() {
		const resultado = await consultar.executar({ codigoInep, atualizar: true });
		if (resultado) {
			toast[resultado.aviso ? "warning" : "success"](resultado.aviso ?? "Saldo conferido no PDDE Info.");
		}
	}

	return (
		<Button variant="secondary" onClick={atualizar} disabled={consultar.executando}>
			{consultar.executando && <Spinner data-icon="inline-start" />}
			Atualizar saldo
		</Button>
	);
}

export function TelaDeInicio() {
	return (
		<PainelCarregado>
			{({ codigoInep, dados, derivados }) => {
				const { prazo, plano, saldoTotal } = derivados;
				const { situacao, hoje } = prazo;
				const noPlano = plano.totalPorCategoria.custeio + plano.totalPorCategoria.capital;
				const semDestino = saldoTotal - noPlano;
				const percentual = saldoTotal > 0 ? Math.min(100, (noPlano / saldoTotal) * 100) : 0;
				const passo = definirProximoPasso(dados, plano);
				const [pendencia] = dados.saldo.pendencias;
				const capitulo = situacao.tipo === "correndo" ? capituloDoPrazo(hoje, situacao.limiteParaUso) : null;
				return (
					<>
						<CabecalhoDaPagina
							titulo="Início"
							frase={`Exercício de ${situacao.exercicio}, simulação em ${DIA_E_MES.format(hoje)}.`}
							acoes={
								<>
									<AtualizarSaldo codigoInep={codigoInep} />
									<Link href={enderecoDaArea(codigoInep, "plano")} className={buttonVariants()}>
										Montar o plano
										<ArrowRightIcon data-icon="inline-end" />
									</Link>
								</>
							}
						/>

						{situacao.tipo === "correndo" && capitulo ? (
							<CapituloAtual
								capitulo={capitulo}
								diasUteis={situacao.diasUteisRestantes}
								limite={DIA_E_MES.format(situacao.limiteParaUso)}
							>
								<CalendarioDoPrazo
									meses={montarMesesDoPrazo({ hoje, limiteParaUso: situacao.limiteParaUso, estorno: situacao.estorno })}
								/>
								<LegendaDoCalendario />
							</CapituloAtual>
						) : (
							<section className="rounded-lg border border-border bg-card p-7">
								<h2 className="text-lg font-semibold">{prazo.risco.mensagem}</h2>
							</section>
						)}

						<div className="flex flex-wrap gap-6">
							<section
								aria-labelledby="titulo-dinheiro"
								className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:p-7"
							>
								<div className="flex flex-col">
									<h2 id="titulo-dinheiro" className="font-semibold">
										Ainda sem destino
									</h2>
									<span className="font-heading text-4xl leading-tight font-extrabold tracking-tight tabular-nums">
										{formatarReais(semDestino)}
									</span>
								</div>
								<div
									role="img"
									aria-label={`${formatarReais(noPlano)} dos ${formatarReais(saldoTotal)} já estão no plano`}
									className="h-2 overflow-hidden rounded bg-pilula"
								>
									<div className="h-full bg-azul" style={{ width: `${percentual}%` }} />
								</div>
								<dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 tabular-nums">
									<dt className="text-muted-foreground">Saldo em conta</dt>
									<dd className="text-right">{formatarReais(saldoTotal)}</dd>
									<dt className="flex items-center gap-2 text-muted-foreground">
										<span aria-hidden="true" className="size-2 rounded-sm bg-azul" />
										No plano de compra
									</dt>
									<dd className="text-right">{formatarReais(noPlano)}</dd>
								</dl>
							</section>
							<section
								aria-labelledby="titulo-passo"
								className="flex min-w-0 flex-[1_1_340px] flex-col gap-3 rounded-lg border border-border bg-card p-5 sm:p-7"
							>
								<h2 id="titulo-passo" className="font-semibold">
									Próximo passo
								</h2>
								<p className="text-xl leading-snug font-semibold text-balance">{passo.titulo}</p>
								<p className="text-muted-foreground">{passo.detalhe}</p>
								<Link
									href={enderecoDaArea(codigoInep, passo.caminho, passo.busca)}
									className={buttonVariants({ variant: "secondary", className: "mt-auto self-start" })}
								>
									{passo.acao}
									<ArrowRightIcon data-icon="inline-end" />
								</Link>
							</section>
						</div>

						{pendencia && (
							<div role="note" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-perigo-fundo px-4 py-3">
								<TriangleAlertIcon aria-hidden="true" className="size-[18px] shrink-0 text-perigo" />
								<span className="flex-[1_1_280px]">
									{pendencia.assunto}: {pendencia.mensagem}
									{dados.saldo.pendencias.length > 1 && ` E mais ${dados.saldo.pendencias.length - 1}.`}
								</span>
								{dados.saldo.fonte.endereco && (
									<a
										href={dados.saldo.fonte.endereco}
										target="_blank"
										rel="noopener noreferrer"
										className="font-semibold text-perigo hover:underline"
									>
										Ver no PDDE Info
									</a>
								)}
							</div>
						)}
					</>
				);
			}}
		</PainelCarregado>
	);
}

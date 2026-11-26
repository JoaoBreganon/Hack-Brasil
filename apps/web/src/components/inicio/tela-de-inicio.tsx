"use client";

import { type CapituloDoPrazo, capituloDoPrazo, formatarReais, montarMesesDoPrazo } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { ArrowRightIcon, TriangleAlertIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarioDoPrazo, LegendaDoCalendario } from "@/components/calendario/calendario-do-prazo";
import { CabecalhoDaPagina } from "@/components/escola/cabecalho-da-pagina";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { ValorAnimado } from "@/components/movimento/valor-animado";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { type CorDaFaixa, enderecoDaArea } from "@/config/navegacao";
import { useOperacao } from "@/hooks/use-operacao";
import { definirProximoPasso } from "@/lib/proximo-passo";

const COR_DO_CAPITULO: Record<CapituloDoPrazo["numero"], CorDaFaixa> = { 1: "cantalupo", 2: "azul-fundo", 3: "tinta" };

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
				const semDestino = Math.max(0, saldoTotal - noPlano);
				const percentual = saldoTotal > 0 ? Math.min(100, (noPlano / saldoTotal) * 100) : 0;
				const passo = definirProximoPasso(dados, plano);
				const [pendencia] = dados.saldo.pendencias;
				const correndo = situacao.tipo === "correndo" ? situacao : null;
				const capitulo = correndo ? capituloDoPrazo(hoje, correndo.limiteParaUso) : null;
				return (
					<>
						<CabecalhoDaPagina
							cor={capitulo ? COR_DO_CAPITULO[capitulo.numero] : "papel"}
							rotulo={capitulo ? `Capítulo ${capitulo.numero} de 3 · ${capitulo.mes}` : dados.escola.nome}
							titulo={
								<>
									<ValorAnimado centavos={semDestino} /> ainda sem destino.
								</>
							}
							frase={
								correndo
									? `${correndo.diasUteisRestantes} dias úteis até ${DIA_E_MES.format(correndo.limiteParaUso)}. O que sobrar depois disso volta para o governo.`
									: prazo.risco.mensagem
							}
							acoes={
								<>
									<Link
										href={enderecoDaArea(codigoInep, passo.caminho, passo.busca)}
										className={buttonVariants({ size: "lg" })}
									>
										{passo.acao}
										<ArrowRightIcon data-icon="inline-end" />
									</Link>
									<AtualizarSaldo codigoInep={codigoInep} />
								</>
							}
						>
							<div className="flex flex-col gap-2.5">
								<div
									role="img"
									aria-label={`${formatarReais(noPlano)} dos ${formatarReais(saldoTotal)} já estão no plano`}
									className="h-2.5 overflow-hidden rounded-full bg-white/60"
								>
									<motion.div
										className="h-full rounded-full bg-tinta"
										initial={{ width: 0 }}
										animate={{ width: `${percentual}%` }}
										transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
									/>
								</div>
								<p className="flex flex-wrap justify-between gap-2 text-[15px] font-medium tabular-nums">
									<span>{formatarReais(noPlano)} no plano</span>
									<span>{formatarReais(saldoTotal)} em conta</span>
								</p>
							</div>
						</CabecalhoDaPagina>

						{pendencia && (
							<div role="note" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-perigo-fundo px-5 py-4">
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

						{correndo && (
							<section aria-labelledby="titulo-calendario" className="flex flex-col gap-5 rounded-[28px] bg-card p-6 sm:p-10">
								<h2 id="titulo-calendario" className="font-heading text-[28px] leading-tight font-extrabold tracking-tight">
									Os dias até o prazo
								</h2>
								<CalendarioDoPrazo
									meses={montarMesesDoPrazo({ hoje, limiteParaUso: correndo.limiteParaUso, estorno: correndo.estorno })}
								/>
								<LegendaDoCalendario />
							</section>
						)}
					</>
				);
			}}
		</PainelCarregado>
	);
}

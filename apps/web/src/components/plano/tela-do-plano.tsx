"use client";

import { formatarData } from "@aloca/dominio";
import { ArrowRightIcon, StampIcon } from "lucide-react";
import Link from "next/link";
import { CabecalhoDaEtapa } from "@/components/escola/cabecalho-da-etapa";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { enderecoDaEtapa, ETAPAS } from "@/config/etapas";
import { AprovacaoDoPlano } from "./aprovacao-do-plano";
import { ForaDoPlano } from "./fora-do-plano";
import { TabelaDoPlano } from "./tabela-do-plano";

export function TelaDoPlano() {
	return (
		<PainelCarregado>
			{({ codigoInep, dados, derivados }) => {
				const { plano, aprovado } = derivados;
				return (
					<>
						<CabecalhoDaEtapa
							titulo="Plano de compra"
							descricao={
								aprovado && dados.plano?.aprovadoEm ? (
									<>
										<StampIcon aria-hidden="true" className="mr-1.5 inline size-4 align-[-2px] text-primary" />
										Aprovado em {formatarData(new Date(dados.plano.aprovadoEm))}. A ata já pode ser impressa.
									</>
								) : (
									<>
										O Aloca monta o plano pela ordem de prioridade, com o menor preço de cada item, e tira o que a regra
										proíbe ou o saldo não cobre.
									</>
								)
							}
							acoes={<AprovacaoDoPlano codigoInep={codigoInep} aprovado={aprovado} podeAprovar={plano.itens.length > 0} />}
						/>
						{dados.itens.length === 0 ? (
							<Empty className="rounded-[20px] border border-dashed border-border py-14">
								<EmptyHeader>
									<EmptyTitle className="font-heading text-xl font-bold">Ainda não há plano</EmptyTitle>
									<EmptyDescription>
										Liste o que a escola precisa e junte os orçamentos. O plano se monta sozinho.
									</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Link
										href={enderecoDaEtapa(codigoInep, ETAPAS[1].caminho)}
										className="font-semibold text-primary underline-offset-2 hover:underline"
									>
										Começar a lista de itens
									</Link>
								</EmptyContent>
							</Empty>
						) : (
							<>
								{plano.itens.length > 0 ? (
									<TabelaDoPlano plano={plano} />
								) : (
									<p className="rounded-2xl bg-papel px-5 py-4 text-[15px]">
										Nenhum item está pronto para compra. Cada item precisa de orçamentos e de um tipo de despesa que o
										PDDE pague.{" "}
										<Link
											href={enderecoDaEtapa(codigoInep, ETAPAS[2].caminho)}
											className="font-semibold text-primary underline-offset-2 hover:underline"
										>
											Revisar os orçamentos
										</Link>
									</p>
								)}
								<ForaDoPlano itens={plano.foraDoPlano} saldoRestante={plano.saldoRestante} />
							</>
						)}
						{aprovado && (
							<Link
								href={enderecoDaEtapa(codigoInep, ETAPAS[4].caminho)}
								className="inline-flex h-12 items-center gap-2 self-start rounded-xl bg-primary px-5 font-semibold text-primary-foreground transition-transform active:translate-y-px"
							>
								Abrir a ata para imprimir
								<ArrowRightIcon aria-hidden="true" className="size-4" />
							</Link>
						)}
					</>
				);
			}}
		</PainelCarregado>
	);
}

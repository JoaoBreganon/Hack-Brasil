"use client";

import { formatarData, formatarReais, motivoForaDoPlano } from "@aloca/dominio";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { CabecalhoDaPagina } from "@/components/escola/cabecalho-da-pagina";
import { Cifra } from "@/components/escola/cifra";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { enderecoDaArea } from "@/config/navegacao";
import { AprovacaoDoPlano } from "./aprovacao-do-plano";
import { BaixarPlanilha } from "./baixar-planilha";
import { PaginaPublica } from "./pagina-publica";

const COLUNAS = "grid grid-cols-[minmax(0,1fr)_104px] items-center gap-x-4 sm:grid-cols-[minmax(0,1fr)_132px_44px_108px_116px]";

export function TelaDoPlano() {
	return (
		<PainelCarregado>
			{({ codigoInep, dados, derivados }) => {
				const { plano, aprovado } = derivados;
				const { saldo } = dados.saldo;
				const total = plano.totalPorCategoria.custeio + plano.totalPorCategoria.capital;
				const aprovadoEm = dados.plano?.aprovadoEm;
				const acoes = (
					<>
						<BaixarPlanilha codigoInep={codigoInep} exercicio={derivados.prazo.situacao.exercicio} plano={plano} />
						{aprovado && (
							<Link href={enderecoDaArea(codigoInep, "ata")} className={buttonVariants({ variant: "secondary" })}>
								Abrir a ata
								<ArrowRightIcon data-icon="inline-end" />
							</Link>
						)}
						{dados.acesso.podeEditar && (
							<AprovacaoDoPlano codigoInep={codigoInep} aprovado={aprovado} podeAprovar={plano.itens.length > 0} />
						)}
					</>
				);
				if (dados.itens.length === 0) {
					return (
						<>
							<CabecalhoDaPagina
								titulo="Plano de compra"
								frase="Menor preço de cada item, na ordem de prioridade da escola."
							/>
							<Empty className="rounded-lg border border-border bg-card py-14">
								<EmptyHeader>
									<EmptyTitle className="text-lg font-semibold">O plano sai da lista de compras</EmptyTitle>
									<EmptyDescription>
										Liste o que a escola precisa e junte os orçamentos. O plano se monta sozinho.
									</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Link href={enderecoDaArea(codigoInep, "compras")} className={buttonVariants()}>
										Abrir compras
										<ArrowRightIcon data-icon="inline-end" />
									</Link>
								</EmptyContent>
							</Empty>
						</>
					);
				}
				return (
					<>
						<CabecalhoDaPagina
							titulo="Plano de compra"
							frase={
								aprovado && aprovadoEm
									? `Aprovado em ${formatarData(new Date(aprovadoEm))}.`
									: "Menor preço de cada item, na ordem de prioridade da escola."
							}
							acoes={acoes}
						/>
						<dl className="flex flex-wrap rounded-lg border border-border bg-card">
							<Cifra
								rotulo="Total do plano"
								valor={formatarReais(total)}
								apoio={`${plano.itens.length} ${plano.itens.length === 1 ? "item" : "itens"}`}
							/>
							<Cifra
								rotulo="Custeio"
								valor={formatarReais(plano.totalPorCategoria.custeio)}
								apoio={`de ${formatarReais(saldo.custeio)}`}
							/>
							<Cifra
								rotulo="Capital"
								valor={formatarReais(plano.totalPorCategoria.capital)}
								apoio={`de ${formatarReais(saldo.capital)}`}
							/>
						</dl>
						<section aria-labelledby="titulo-entram" className="overflow-hidden rounded-lg border border-border bg-card">
							<div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
								<h2 id="titulo-entram" className="font-semibold">
									Entram no plano
								</h2>
								<span className="text-[13px] text-muted-foreground">
									{aprovado ? "Aprovado pela APM" : "Rascunho, ainda não aprovado"}
								</span>
							</div>
							{plano.itens.length === 0 ? (
								<p className="border-t border-regra px-5 py-6 text-muted-foreground">
									Nenhum item está pronto. Cada um precisa de orçamentos e de um tipo de despesa que o PDDE pague.
								</p>
							) : (
								<>
									<div aria-hidden="true" className={`${COLUNAS} px-5 pb-2.5 text-[13px] text-muted-foreground`}>
										<span>Item</span>
										<span className="hidden sm:block">Fornecedor</span>
										<span className="hidden text-right sm:block">Qtd.</span>
										<span className="hidden text-right sm:block">Unitário</span>
										<span className="text-right">Total</span>
									</div>
									<ul>
										{plano.itens.map(({ necessidade, validacao }) => (
											<li
												key={necessidade.id}
												className={`${COLUNAS} border-t border-regra px-5 py-3.5 tabular-nums`}
											>
												<span className="flex min-w-0 flex-col">
													<span className="font-medium text-pretty">{necessidade.descricao}</span>
													<span className="text-[13px] text-muted-foreground sm:hidden">
														{validacao.escolha?.vencedora.fornecedor} · {necessidade.quantidade} un.
													</span>
												</span>
												<span className="hidden truncate text-muted-foreground sm:block">
													{validacao.escolha?.vencedora.fornecedor}
												</span>
												<span className="hidden text-right sm:block">{necessidade.quantidade}</span>
												<span className="hidden text-right text-muted-foreground sm:block">
													{validacao.escolha && formatarReais(validacao.escolha.vencedora.valorEmCentavos)}
												</span>
												<span className="text-right font-semibold">{formatarReais(validacao.totalEmCentavos)}</span>
											</li>
										))}
									</ul>
								</>
							)}
						</section>
						{plano.foraDoPlano.length > 0 && (
							<section aria-labelledby="titulo-fora" className="overflow-hidden rounded-lg border border-border bg-card">
								<h2 id="titulo-fora" className="px-5 py-4 font-semibold">
									Ficam de fora
								</h2>
								<ul>
									{plano.foraDoPlano.map((item) => (
										<li
											key={item.necessidade.id}
											className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-t border-regra px-5 py-3"
										>
											<Link
												href={enderecoDaArea(codigoInep, "compras", { item: item.necessidade.id })}
												className="font-medium text-foreground hover:underline"
											>
												{item.necessidade.descricao}
											</Link>
											<span className="text-muted-foreground">{motivoForaDoPlano(item, plano.saldoRestante)}</span>
										</li>
									))}
								</ul>
							</section>
						)}
						<PaginaPublica
							codigoInep={codigoInep}
							publicada={dados.publicada}
							demonstracao={dados.acesso.demonstracao}
							membro={dados.acesso.membro}
						/>
					</>
				);
			}}
		</PainelCarregado>
	);
}

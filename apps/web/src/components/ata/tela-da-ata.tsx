"use client";

import { montarAta } from "@aloca/dominio";
import { ArrowRightIcon, PrinterIcon } from "lucide-react";
import Link from "next/link";
import { CabecalhoDaPagina } from "@/components/escola/cabecalho-da-pagina";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { enderecoDaArea } from "@/config/navegacao";
import { DocumentoDaAta } from "./documento-da-ata";

function imprimir() {
	window.print();
}

export function TelaDaAta() {
	return (
		<PainelCarregado>
			{({ codigoInep, dados, derivados }) => {
				if (derivados.plano.itens.length === 0) {
					return (
						<>
							<CabecalhoDaPagina titulo="Ata da APM" frase="A ata sai do plano de compra aprovado." />
							<Empty className="rounded-3xl border border-border/70 bg-card py-14">
								<EmptyHeader>
									<EmptyTitle className="text-lg font-semibold">Ainda não há o que aprovar</EmptyTitle>
									<EmptyDescription>Monte o plano de compra para gerar a ata e o mapa de preços.</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Link href={enderecoDaArea(codigoInep, "plano")} className={buttonVariants()}>
										Abrir o plano
										<ArrowRightIcon data-icon="inline-end" />
									</Link>
								</EmptyContent>
							</Empty>
						</>
					);
				}
				const { situacao, hoje } = derivados.prazo;
				const ata = montarAta({ escola: dados.escola, exercicio: situacao.exercicio, plano: derivados.plano, data: hoje });
				return (
					<>
						<CabecalhoDaPagina
							titulo="Ata da APM"
							frase={
								derivados.aprovado
									? "Leve impressa para a reunião e colha as assinaturas."
									: "Rascunho: aprove o plano antes de imprimir a versão final."
							}
							acoes={
								<Button onClick={imprimir}>
									<PrinterIcon data-icon="inline-start" />
									Imprimir ou salvar em PDF
								</Button>
							}
						/>
						<DocumentoDaAta ata={ata} escola={dados.escola} data={hoje} rascunho={!derivados.aprovado} />
					</>
				);
			}}
		</PainelCarregado>
	);
}

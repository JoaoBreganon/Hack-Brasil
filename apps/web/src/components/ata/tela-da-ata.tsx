"use client";

import { montarAta } from "@aloca/dominio";
import { PrinterIcon } from "lucide-react";
import Link from "next/link";
import { CabecalhoDaEtapa } from "@/components/escola/cabecalho-da-etapa";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { enderecoDaEtapa, ETAPAS } from "@/config/etapas";
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
						<Empty className="rounded-[20px] border border-dashed border-border py-14">
							<EmptyHeader>
								<EmptyTitle className="font-heading text-xl font-bold">A ata sai do plano de compra</EmptyTitle>
								<EmptyDescription>Monte e aprove o plano para gerar a ata e o mapa de preços.</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Link
									href={enderecoDaEtapa(codigoInep, ETAPAS[3].caminho)}
									className="font-semibold text-primary underline-offset-2 hover:underline"
								>
									Ir para o plano de compra
								</Link>
							</EmptyContent>
						</Empty>
					);
				}
				const ata = montarAta({
					escola: dados.escola,
					exercicio: derivados.prazo.situacao.exercicio,
					plano: derivados.plano,
					data: derivados.prazo.hoje,
				});
				return (
					<>
						<CabecalhoDaEtapa
							titulo="Ata da APM"
							descricao={
								derivados.aprovado
									? "Imprima, leia na reunião e colha as assinaturas. Na janela de impressão, escolha salvar em PDF para guardar uma cópia."
									: "Este é um rascunho. Aprove o plano para tirar a marca d’água antes de imprimir."
							}
							acoes={
								<Button size="xl" onClick={imprimir}>
									<PrinterIcon data-icon="inline-start" />
									Imprimir ou salvar em PDF
								</Button>
							}
						/>
						<DocumentoDaAta
							ata={ata}
							municipio={dados.escola.municipio}
							data={derivados.prazo.hoje}
							rascunho={!derivados.aprovado}
						/>
					</>
				);
			}}
		</PainelCarregado>
	);
}

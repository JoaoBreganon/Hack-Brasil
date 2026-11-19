"use client";

import { FONTES, ORCAMENTOS_EXIGIDOS } from "@aloca/dominio";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { CabecalhoDaEtapa } from "@/components/escola/cabecalho-da-etapa";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { RegraCitada } from "@/components/plano/regra-citada";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { enderecoDaEtapa, ETAPAS } from "@/config/etapas";
import { CartaoDoItem } from "./cartao-do-item";

export function TelaDeOrcamentos() {
	return (
		<PainelCarregado>
			{({ codigoInep, dados, derivados }) => {
				const itens = [...dados.itens].sort((a, b) => a.prioridade - b.prioridade);
				const prontos = itens.filter(
					({ orcamentos, justificativa }) => orcamentos.length >= ORCAMENTOS_EXIGIDOS || (orcamentos.length > 0 && justificativa),
				);
				return (
					<>
						<CabecalhoDaEtapa
							titulo={`${ORCAMENTOS_EXIGIDOS} orçamentos por item`}
							descricao={
								<>
									Busque os preços na internet ou anote os que a escola já tem. Vale o menor preço de cada item.{" "}
									<span className="tabular-nums">
										{prontos.length} de {itens.length} itens completos.
									</span>
								</>
							}
							acoes={
								itens.length > 0 && (
									<Link
										href={enderecoDaEtapa(codigoInep, ETAPAS[3].caminho)}
										className="inline-flex h-10 items-center gap-2 rounded-lg bg-tinta px-4 text-sm font-semibold text-white transition-transform active:translate-y-px"
									>
										Ver o plano de compra
										<ArrowRightIcon aria-hidden="true" className="size-4" />
									</Link>
								)
							}
						/>
						<RegraCitada fonte={FONTES.tresOrcamentos} />
						{itens.length === 0 ? (
							<Empty className="rounded-[20px] border border-dashed border-border py-14">
								<EmptyHeader>
									<EmptyTitle className="font-heading text-xl font-bold">Nenhum item para orçar</EmptyTitle>
									<EmptyDescription>Liste primeiro o que a escola precisa comprar.</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Link
										href={enderecoDaEtapa(codigoInep, ETAPAS[1].caminho)}
										className="font-semibold text-primary underline-offset-2 hover:underline"
									>
										Ir para a lista de itens
									</Link>
								</EmptyContent>
							</Empty>
						) : (
							<ol className="flex flex-col gap-5">
								{itens.map((item, indice) => (
									<li key={item._id}>
										<CartaoDoItem item={item} ordem={indice + 1} bloqueado={derivados.aprovado} />
									</li>
								))}
							</ol>
						)}
					</>
				);
			}}
		</PainelCarregado>
	);
}

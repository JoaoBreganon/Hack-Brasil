"use client";

import { ORCAMENTOS_EXIGIDOS, REGRAS_POR_TIPO, type ResultadoDaSugestao } from "@aloca/dominio";
import { PlusIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "cn";
import { CabecalhoDaPagina } from "@/components/escola/cabecalho-da-pagina";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { buttonVariants } from "@/components/ui/button";
import { enderecoDaArea, ITEM_NOVO, SUGERIR_ITENS } from "@/config/navegacao";
import type { ItemDoPainel } from "@/hooks/use-painel-da-escola";
import { FormularioDeItem } from "./formulario-de-item";
import { ListaVazia } from "./lista-vazia";
import { PainelDoItem } from "./painel-do-item";
import { ResumoDaSugestao } from "./resumo-da-sugestao";
import { PainelDeSugestao } from "./sugestao-de-itens";
import { TabelaDeItens } from "./tabela-de-itens";

type Filtro = "todos" | "faltam" | "fora";

function faltamOrcamentos({ tipo, orcamentos, justificativa }: ItemDoPainel): boolean {
	return REGRAS_POR_TIPO[tipo].permitido && orcamentos.length < ORCAMENTOS_EXIGIDOS && !justificativa;
}

export function TelaDeCompras() {
	const roteador = useRouter();
	const selecionado = useSearchParams().get("item");
	const [filtro, setFiltro] = useState<Filtro>("todos");
	const [sugestao, setSugestao] = useState<ResultadoDaSugestao | null>(null);

	return (
		<PainelCarregado>
			{({ codigoInep, dados, derivados }) => {
				const foraDoPlano = new Set(derivados.plano.foraDoPlano.map(({ necessidade }) => necessidade.id));
				const ordenados = [...dados.itens].sort(
					(a, b) => a.prioridade - b.prioridade || a.descricao.localeCompare(b.descricao, "pt-BR"),
				);
				const filtros: { chave: Filtro; rotulo: string; itens: ItemDoPainel[] }[] = [
					{ chave: "todos", rotulo: "Todos", itens: ordenados },
					{ chave: "faltam", rotulo: "Faltam orçamentos", itens: ordenados.filter(faltamOrcamentos) },
					{ chave: "fora", rotulo: "Fora do plano", itens: ordenados.filter(({ _id }) => foraDoPlano.has(_id)) },
				];
				const visiveis = filtros.find(({ chave }) => chave === filtro)?.itens ?? ordenados;
				const itemAberto = dados.itens.find(({ _id }) => _id === selecionado);
				const { podeEditar } = dados.acesso;
				const travado = derivados.aprovado || !podeEditar;
				const novo = selecionado === ITEM_NOVO && podeEditar;
				const sugerindo = selecionado === SUGERIR_ITENS && !travado;
				const proximaPrioridade = dados.itens.reduce((maior, { prioridade }) => Math.max(maior, prioridade), 0) + 1;
				const saldoLivre = derivados.plano.saldoRestante;
				const aoSugerir = (resultado: ResultadoDaSugestao) => {
					setSugestao(resultado);
					roteador.replace(enderecoDaArea(codigoInep, "compras"), { scroll: false });
				};
				return (
					<>
						<CabecalhoDaPagina
							titulo="Compras"
							frase="O que a escola precisa, com três orçamentos por item."
							acoes={
								!travado && (
									<>
										{dados.itens.length > 0 && (
											<Link
												href={enderecoDaArea(codigoInep, "compras", { item: SUGERIR_ITENS })}
												scroll={false}
												className={buttonVariants({ variant: "secondary" })}
											>
												<SparklesIcon data-icon="inline-start" />
												Sugerir itens
											</Link>
										)}
										<Link
											href={enderecoDaArea(codigoInep, "compras", { item: ITEM_NOVO })}
											scroll={false}
											className={buttonVariants()}
										>
											<PlusIcon data-icon="inline-start" />
											Novo item
										</Link>
									</>
								)
							}
						/>
						{derivados.aprovado && (
							<p className="rounded-lg bg-pilula px-4 py-3">
								O plano foi aprovado, então a lista está travada.{" "}
								{podeEditar && (
									<Link
										href={enderecoDaArea(codigoInep, "plano")}
										className="font-semibold text-azul-texto hover:underline"
									>
										Reabrir no plano
									</Link>
								)}
							</p>
						)}
						{sugestao && <ResumoDaSugestao resultado={sugestao} aoFechar={() => setSugestao(null)} />}
						{dados.itens.length === 0 && !novo && !sugerindo ? (
							<ListaVazia codigoInep={codigoInep} saldoLivre={saldoLivre} aoSugerir={aoSugerir} podeEditar={podeEditar} />
						) : (
							<>
								<div role="group" aria-label="Filtrar itens" className="flex flex-wrap gap-1">
									{filtros.map(({ chave, rotulo, itens }) => (
										<button
											key={chave}
											type="button"
											aria-pressed={filtro === chave}
											onClick={() => setFiltro(chave)}
											className={cn(
												"inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
												filtro === chave
													? "border-tinta bg-tinta text-white"
													: "border-border bg-card text-muted-foreground hover:text-foreground",
											)}
										>
											{rotulo}
											<span className="font-normal opacity-70 tabular-nums">{itens.length}</span>
										</button>
									))}
								</div>
								<div
									className={cn(
										"flex flex-col gap-6",
										(itemAberto || novo || sugerindo) && "lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start",
									)}
								>
									<TabelaDeItens
										codigoInep={codigoInep}
										itens={visiveis}
										selecionado={selecionado}
										foraDoPlano={foraDoPlano}
									/>
									{(itemAberto || novo || sugerindo) && (
										<div className="order-first lg:sticky lg:top-8 lg:order-none">
											{novo ? (
												<FormularioDeItem codigoInep={codigoInep} proximaPrioridade={proximaPrioridade} />
											) : sugerindo ? (
												<PainelDeSugestao codigoInep={codigoInep} saldoLivre={saldoLivre} aoSugerir={aoSugerir} />
											) : (
												itemAberto && (
													<PainelDoItem
														key={itemAberto._id}
														codigoInep={codigoInep}
														item={itemAberto}
														bloqueado={travado}
													/>
												)
											)}
										</div>
									)}
								</div>
							</>
						)}
					</>
				);
			}}
		</PainelCarregado>
	);
}

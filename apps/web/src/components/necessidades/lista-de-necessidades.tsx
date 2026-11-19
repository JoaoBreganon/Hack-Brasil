"use client";

import { ORCAMENTOS_EXIGIDOS, REGRAS_POR_TIPO } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowRightIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { SeloDeCategoria } from "@/components/plano/selo-de-categoria";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { enderecoDaEtapa, ETAPAS } from "@/config/etapas";
import { useOperacao } from "@/hooks/use-operacao";
import type { ItemDoPainel } from "@/hooks/use-painel-da-escola";

type Propriedades = {
	codigoInep: string;
	itens: ItemDoPainel[];
	bloqueado: boolean;
};

function ListaVazia({ codigoInep, bloqueado }: { codigoInep: string; bloqueado: boolean }) {
	const preencher = useMutation(api.itens.preencherComExemplo);
	const { executar, executando } = useOperacao(preencher);

	return (
		<Empty className="flex-[2_1_480px] rounded-[20px] border border-dashed border-border py-14">
			<EmptyHeader>
				<EmptyTitle className="font-heading text-xl font-bold">A lista está vazia</EmptyTitle>
				<EmptyDescription>
					Comece pelo que a escola mais precisa. Para ver o Aloca funcionando, use a lista de exemplo com orçamentos.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button variant="outline" size="lg" onClick={() => executar({ codigoInep })} disabled={bloqueado || executando}>
					{executando ? <Spinner data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
					Usar a lista de exemplo
				</Button>
			</EmptyContent>
		</Empty>
	);
}

function BotaoDeRemover({ item, bloqueado }: { item: ItemDoPainel; bloqueado: boolean }) {
	const remover = useMutation(api.itens.remover);
	const { executar, executando } = useOperacao(remover);

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={() => executar({ itemId: item._id })}
			disabled={bloqueado || executando}
			aria-label={`Remover ${item.descricao}`}
		>
			{executando ? <Spinner /> : <Trash2Icon />}
		</Button>
	);
}

export function ListaDeNecessidades({ codigoInep, itens, bloqueado }: Propriedades) {
	if (itens.length === 0) {
		return <ListaVazia codigoInep={codigoInep} bloqueado={bloqueado} />;
	}
	const ordenados = [...itens].sort((a, b) => a.prioridade - b.prioridade || a.descricao.localeCompare(b.descricao, "pt-BR"));

	return (
		<section aria-labelledby="titulo-lista" className="flex min-w-0 flex-[2_1_480px] flex-col gap-4">
			<div className="flex flex-wrap items-baseline justify-between gap-3">
				<h2 id="titulo-lista" className="font-heading text-xl font-bold tracking-tight">
					{itens.length} {itens.length === 1 ? "item na lista" : "itens na lista"}
				</h2>
				<Link
					href={enderecoDaEtapa(codigoInep, ETAPAS[2].caminho)}
					className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-2 hover:underline"
				>
					Juntar os orçamentos
					<ArrowRightIcon aria-hidden="true" className="size-4" />
				</Link>
			</div>
			<ol className="overflow-hidden rounded-[20px] bg-card shadow-[0_0_0_1px_var(--pauta)]">
				{ordenados.map((item) => {
					const regra = REGRAS_POR_TIPO[item.tipo];
					return (
						<li key={item._id} className="flex items-center gap-4 border-b border-pauta px-5 py-4 last:border-b-0 sm:px-6">
							<span
								aria-label={`Prioridade ${item.prioridade}`}
								className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border font-semibold tabular-nums"
							>
								{item.prioridade}
							</span>
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="font-semibold text-pretty">{item.descricao}</span>
								<div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
									{regra.permitido ? (
										<SeloDeCategoria categoria={regra.categoria} />
									) : (
										<Badge variant="destructive">Vedado</Badge>
									)}
									<span>{item.tipo}</span>
									<span aria-hidden="true">·</span>
									<span className="tabular-nums">{item.quantidade} un.</span>
									<span aria-hidden="true">·</span>
									<span className="tabular-nums">
										{Math.min(item.orcamentos.length, ORCAMENTOS_EXIGIDOS)} de {ORCAMENTOS_EXIGIDOS} orçamentos
									</span>
								</div>
							</div>
							<BotaoDeRemover item={item} bloqueado={bloqueado} />
						</li>
					);
				})}
			</ol>
		</section>
	);
}

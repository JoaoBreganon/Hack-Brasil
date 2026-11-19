"use client";

import { FONTES, formatarReais, LIMITES, ORCAMENTOS_EXIGIDOS, REGRAS_POR_TIPO } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { ExternalLinkIcon, GlobeIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { RegraCitada } from "@/components/plano/regra-citada";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useOperacao } from "@/hooks/use-operacao";
import type { ItemDoPainel } from "@/hooks/use-painel-da-escola";
import { FormularioDeOrcamento } from "./formulario-de-orcamento";
import { Justificativa } from "./justificativa";

type Orcamento = ItemDoPainel["orcamentos"][number];

const ROTULO_DA_ORIGEM: Record<Orcamento["origem"], string> = {
	manual: "Anotado à mão",
	busca: "Achado na internet",
	exemplo: "Orçamento de exemplo",
};

type Propriedades = {
	item: ItemDoPainel;
	ordem: number;
	bloqueado: boolean;
};

function LinhaDoOrcamento({ orcamento, menor, bloqueado }: { orcamento: Orcamento; menor: boolean; bloqueado: boolean }) {
	const remover = useMutation(api.orcamentos.remover);
	const { executar, executando } = useOperacao(remover);

	return (
		<li className="flex items-center gap-3 border-b border-pauta py-3 last:border-b-0">
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				{orcamento.endereco ? (
					<a
						href={orcamento.endereco}
						target="_blank"
						rel="noopener noreferrer nofollow"
						className="inline-flex min-w-0 items-center gap-1.5 font-medium underline-offset-2 hover:underline"
					>
						<span className="truncate">{orcamento.fornecedor}</span>
						<ExternalLinkIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
						<span className="sr-only">(abre o anúncio em outra aba)</span>
					</a>
				) : (
					<span className="truncate font-medium">{orcamento.fornecedor}</span>
				)}
				<span className="text-xs text-muted-foreground">{ROTULO_DA_ORIGEM[orcamento.origem]}</span>
			</div>
			<span
				className={cn(
					"rounded-full border-2 px-3 py-1 tabular-nums",
					menor ? "-rotate-[1.5deg] border-primary font-semibold text-tinta" : "border-transparent text-muted-foreground",
				)}
			>
				{formatarReais(orcamento.valorEmCentavos)}
				{menor && <span className="sr-only"> (menor preço)</span>}
			</span>
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={() => executar({ orcamentoId: orcamento._id })}
				disabled={bloqueado || executando}
				aria-label={`Remover o orçamento de ${orcamento.fornecedor}`}
			>
				{executando ? <Spinner /> : <Trash2Icon />}
			</Button>
		</li>
	);
}

function BuscaDePrecos({ item, bloqueado }: { item: ItemDoPainel; bloqueado: boolean }) {
	const buscar = useAction(api.precos.buscar);
	const { executar, executando } = useOperacao(buscar);

	async function buscarPrecos() {
		const resultado = await executar({ itemId: item._id });
		if (resultado) {
			toast[resultado.encontrados > 0 ? "success" : "info"](
				resultado.encontrados > 0
					? `${resultado.encontrados} preços novos para "${item.descricao}".`
					: "Nenhum preço novo encontrado. Anote os orçamentos à mão.",
			);
		}
	}

	return (
		<Button
			variant="outline"
			size="lg"
			onClick={buscarPrecos}
			disabled={bloqueado || executando || item.orcamentos.length >= LIMITES.orcamentosPorItem}
		>
			{executando ? <Spinner data-icon="inline-start" /> : <GlobeIcon data-icon="inline-start" />}
			{executando ? "Buscando preços…" : "Buscar preços na internet"}
		</Button>
	);
}

export function CartaoDoItem({ item, ordem, bloqueado }: Propriedades) {
	const regra = REGRAS_POR_TIPO[item.tipo];
	const ordenados = [...item.orcamentos].sort((a, b) => a.valorEmCentavos - b.valorEmCentavos);
	const quantidade = item.orcamentos.length;
	const completo = quantidade >= ORCAMENTOS_EXIGIDOS;
	const tituloId = `item-${item._id}`;

	return (
		<article
			aria-labelledby={tituloId}
			className="flex flex-col gap-5 rounded-[20px] bg-card p-5 shadow-[0_0_0_1px_var(--pauta)] sm:p-7"
		>
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div className="flex min-w-0 items-start gap-4">
					<span
						aria-hidden="true"
						className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border font-semibold tabular-nums"
					>
						{ordem}
					</span>
					<div className="flex min-w-0 flex-col gap-1">
						<h2 id={tituloId} className="text-lg font-semibold text-pretty">
							{item.descricao}
						</h2>
						<p className="text-[13px] text-muted-foreground">
							{item.tipo} · <span className="tabular-nums">{item.quantidade} un.</span>
						</p>
					</div>
				</div>
				<span
					className={cn(
						"rounded-full px-3 py-1 text-[13px] font-semibold tabular-nums",
						completo ? "bg-custeio-fundo text-custeio" : "bg-capital-fundo text-capital",
					)}
				>
					{Math.min(quantidade, ORCAMENTOS_EXIGIDOS)} de {ORCAMENTOS_EXIGIDOS} orçamentos
				</span>
			</header>

			{!regra.permitido && (
				<p className="rounded-xl bg-perigo/8 px-4 py-3 text-sm text-perigo">
					O PDDE não paga {item.tipo}. Este item fica fora do plano mesmo com orçamentos.
				</p>
			)}

			{ordenados.length > 0 && (
				<ul aria-label={`Orçamentos de ${item.descricao}, do menor para o maior`} className="flex flex-col">
					{ordenados.map((orcamento, posicao) => (
						<LinhaDoOrcamento key={orcamento._id} orcamento={orcamento} menor={posicao === 0} bloqueado={bloqueado} />
					))}
				</ul>
			)}

			<div className="flex flex-wrap items-start gap-3">
				<BuscaDePrecos item={item} bloqueado={bloqueado} />
				<FormularioDeOrcamento itemId={item._id} bloqueado={bloqueado || quantidade >= LIMITES.orcamentosPorItem} />
			</div>

			{quantidade > 0 && !completo && (
				<div className="flex flex-col gap-2 border-t border-dashed border-border pt-5">
					<Justificativa itemId={item._id} atual={item.justificativa} bloqueado={bloqueado} />
					<RegraCitada fonte={FONTES.menosDeTresOrcamentos} />
				</div>
			)}
		</article>
	);
}

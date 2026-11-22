"use client";

import {
	formatarReais,
	LIMITES,
	type MotivoDoExemplo,
	ORCAMENTOS_EXIGIDOS,
	REGRAS_POR_TIPO,
	type ResultadoDaBuscaDePrecos,
} from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { ExternalLinkIcon, PencilLineIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { enderecoDaArea } from "@/config/navegacao";
import { useOperacao } from "@/hooks/use-operacao";
import type { ItemDoPainel } from "@/hooks/use-painel-da-escola";
import { FecharPainel } from "./fechar-painel";
import { FormularioDeOrcamento } from "./formulario-de-orcamento";
import { Justificativa } from "./justificativa";

type Orcamento = ItemDoPainel["orcamentos"][number];

const ORIGEM: Record<Orcamento["origem"], string> = {
	manual: "Anotado à mão",
	busca: "Achado na internet",
	exemplo: "Orçamento de exemplo",
};

const MOTIVO_DO_EXEMPLO: Record<MotivoDoExemplo, string> = {
	"sem configuração": "A busca de preços nas lojas da internet ainda não está ligada.",
	falha: "A busca de preços nas lojas da internet não respondeu.",
	"sem preço": "A busca não achou preços novos deste item nas lojas da internet.",
	limite: "A busca de preços nas lojas da internet chegou ao limite da hora.",
};

function avisoDaBusca(resultado: ResultadoDaBuscaDePrecos): { tipo: "success" | "warning" | "info"; mensagem: string } {
	const { encontrados } = resultado;
	if (resultado.origem === "busca") {
		return encontrados > 0
			? {
					tipo: "success",
					mensagem: `${encontrados} ${encontrados === 1 ? "preço novo achado" : "preços novos achados"} em lojas da internet.`,
				}
			: { tipo: "info", mensagem: "Nenhum preço novo nas lojas. Anote os orçamentos que a escola tiver." };
	}
	const motivo = MOTIVO_DO_EXEMPLO[resultado.motivo];
	if (encontrados === 0) {
		return { tipo: "info", mensagem: `${motivo} O item já tem ${ORCAMENTOS_EXIGIDOS} orçamentos, então nada mudou.` };
	}
	const quantos = encontrados === 1 ? "Entrou 1 preço de exemplo" : `Entraram ${encontrados} preços de exemplo`;
	return { tipo: "warning", mensagem: `${motivo} ${quantos}, só para ilustrar. Troque pelos orçamentos reais da escola.` };
}

type Propriedades = {
	codigoInep: string;
	item: ItemDoPainel;
	bloqueado: boolean;
};

function LinhaDoOrcamento({ orcamento, menor, bloqueado }: { orcamento: Orcamento; menor: boolean; bloqueado: boolean }) {
	const remover = useOperacao(useMutation(api.orcamentos.remover));
	return (
		<li className="flex items-center gap-3 border-t border-regra py-3">
			<div className="flex min-w-0 flex-1 flex-col">
				{orcamento.endereco ? (
					<a
						href={orcamento.endereco}
						target="_blank"
						rel="noopener noreferrer nofollow"
						className="inline-flex min-w-0 items-center gap-1.5 font-medium text-foreground hover:underline"
					>
						<span className="truncate">{orcamento.fornecedor}</span>
						<ExternalLinkIcon aria-hidden="true" className="size-3.5 shrink-0 text-apagado" />
						<span className="sr-only">(abre o anúncio em outra aba)</span>
					</a>
				) : (
					<span className="truncate font-medium">{orcamento.fornecedor}</span>
				)}
				<span className="text-[13px] text-muted-foreground">{ORIGEM[orcamento.origem]}</span>
			</div>
			<div className="flex flex-col items-end">
				<span className={cn("tabular-nums", menor ? "font-bold text-azul-texto" : "text-muted-foreground")}>
					{formatarReais(orcamento.valorEmCentavos)}
				</span>
				{menor && <span className="text-xs font-semibold text-azul-texto">menor preço</span>}
			</div>
			{!bloqueado && (
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => remover.executar({ orcamentoId: orcamento._id })}
					disabled={remover.executando}
					aria-label={`Remover o orçamento de ${orcamento.fornecedor}`}
					className="-mr-2 text-apagado"
				>
					{remover.executando ? <Spinner /> : <Trash2Icon />}
				</Button>
			)}
		</li>
	);
}

export function PainelDoItem({ codigoInep, item, bloqueado }: Propriedades) {
	const roteador = useRouter();
	const buscar = useOperacao(useAction(api.precos.buscar));
	const remover = useOperacao(useMutation(api.itens.remover));
	const [anotando, setAnotando] = useState(false);
	const regra = REGRAS_POR_TIPO[item.tipo];
	const ordenados = [...item.orcamentos].sort((a, b) => a.valorEmCentavos - b.valorEmCentavos);
	const [menor] = ordenados;
	const cheio = item.orcamentos.length >= LIMITES.orcamentosPorItem;

	async function buscarPrecos() {
		const resultado = await buscar.executar({ itemId: item._id });
		if (resultado) {
			const { tipo, mensagem } = avisoDaBusca(resultado);
			toast[tipo](mensagem);
		}
	}

	async function removerItem() {
		if ((await remover.executar({ itemId: item._id })) !== undefined) {
			roteador.replace(enderecoDaArea(codigoInep, "compras"), { scroll: false });
		}
	}

	return (
		<aside aria-labelledby="titulo-item" className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:p-6">
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col">
					<h2 id="titulo-item" className="text-lg leading-snug font-semibold text-pretty">
						{item.descricao}
					</h2>
					<span className="text-sm text-muted-foreground">
						{item.quantidade} {item.quantidade === 1 ? "unidade" : "unidades"} · {regra.permitido ? regra.categoria : "vedado"}
					</span>
				</div>
				<FecharPainel codigoInep={codigoInep} rotulo="Fechar o item" />
			</div>

			{!regra.permitido && (
				<p className="rounded-lg bg-perigo-fundo px-3.5 py-2.5 text-sm text-perigo">
					O PDDE não paga {item.tipo}. Este item fica fora do plano.
				</p>
			)}

			{ordenados.length > 0 ? (
				<ul aria-label="Orçamentos, do menor para o maior">
					{ordenados.map((orcamento) => (
						<LinhaDoOrcamento key={orcamento._id} orcamento={orcamento} menor={orcamento === menor} bloqueado={bloqueado} />
					))}
				</ul>
			) : (
				<p className="border-t border-regra pt-4 text-muted-foreground">
					Nenhum orçamento ainda. São necessários {ORCAMENTOS_EXIGIDOS}.
				</p>
			)}

			{!bloqueado &&
				(anotando ? (
					<FormularioDeOrcamento itemId={item._id} aoTerminar={() => setAnotando(false)} />
				) : (
					<div className="flex flex-wrap gap-2">
						<Button variant="secondary" onClick={buscarPrecos} disabled={buscar.executando || cheio || !regra.permitido}>
							{buscar.executando ? <Spinner data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
							{buscar.executando ? "Buscando…" : "Buscar preços"}
						</Button>
						<Button variant="ghost" onClick={() => setAnotando(true)} disabled={cheio}>
							<PencilLineIcon data-icon="inline-start" />
							Anotar
						</Button>
					</div>
				))}

			{regra.permitido && item.orcamentos.length > 0 && item.orcamentos.length < ORCAMENTOS_EXIGIDOS && (
				<Justificativa itemId={item._id} atual={item.justificativa} bloqueado={bloqueado} />
			)}

			{menor && regra.permitido && (
				<div className="flex items-baseline justify-between gap-3 border-t border-regra pt-4 tabular-nums">
					<span className="text-muted-foreground">
						Total com {item.quantidade} {item.quantidade === 1 ? "unidade" : "unidades"}
					</span>
					<span className="text-lg font-bold">{formatarReais(menor.valorEmCentavos * item.quantidade)}</span>
				</div>
			)}

			{!bloqueado && (
				<Button
					variant="ghost"
					size="sm"
					onClick={removerItem}
					disabled={remover.executando}
					className="self-start text-perigo hover:text-perigo"
				>
					{remover.executando ? <Spinner data-icon="inline-start" /> : <Trash2Icon data-icon="inline-start" />}
					Remover item
				</Button>
			)}
		</aside>
	);
}

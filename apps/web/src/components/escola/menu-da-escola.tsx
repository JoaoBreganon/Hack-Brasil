"use client";

import { ArrowLeftRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { BotaoDaConta } from "@/components/conta/botao-da-conta";
import { Skeleton } from "@/components/ui/skeleton";
import { type Area, AREAS, AREAS_DA_ESCOLA, enderecoDaArea } from "@/config/navegacao";
import { usePainelDaEscola } from "@/hooks/use-painel-da-escola";

function ItemDoMenu({ area, codigoInep, caminhoAtual }: { area: Area; codigoInep: string; caminhoAtual: string }) {
	const endereco = enderecoDaArea(codigoInep, area.caminho);
	const atual = caminhoAtual === endereco;
	const Icone = area.icone;
	return (
		<li>
			<Link
				href={endereco}
				aria-current={atual ? "page" : undefined}
				className={cn(
					"flex h-10 items-center gap-2.5 rounded-lg px-2.5 transition-colors",
					atual ? "bg-pilula font-semibold text-foreground" : "text-muted-foreground hover:bg-pilula/60 hover:text-foreground",
				)}
			>
				<Icone aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
				{area.rotulo}
			</Link>
		</li>
	);
}

export function MenuDaEscola() {
	const { codigoInep, carregando, dados } = usePainelDaEscola();
	const caminhoAtual = usePathname();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 pl-3">
				<div className="flex min-w-0 flex-1 flex-col leading-snug">
					{carregando ? (
						<Skeleton className="h-4 w-36" />
					) : (
						<span className="truncate text-sm font-semibold">{dados?.escola.nome ?? "Escola ainda não buscada"}</span>
					)}
					<span className="text-[13px] text-muted-foreground tabular-nums">INEP {codigoInep}</span>
				</div>
				<Link
					href="/entrar"
					aria-label="Trocar de escola"
					title="Trocar de escola"
					className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-pilula hover:text-foreground"
				>
					<ArrowLeftRightIcon aria-hidden="true" className="size-4" strokeWidth={1.75} />
				</Link>
			</div>
			<nav aria-label="Áreas da escola" className="flex flex-col gap-6">
				<ul className="flex flex-col gap-0.5">
					{AREAS.map((area) => (
						<ItemDoMenu key={area.rotulo} area={area} codigoInep={codigoInep} caminhoAtual={caminhoAtual} />
					))}
				</ul>
				<div className="flex flex-col gap-1">
					<span className="px-2.5 text-[13px] text-muted-foreground">Escola</span>
					<ul className="flex flex-col gap-0.5">
						{AREAS_DA_ESCOLA.map((area) => (
							<ItemDoMenu key={area.rotulo} area={area} codigoInep={codigoInep} caminhoAtual={caminhoAtual} />
						))}
					</ul>
				</div>
			</nav>
			<BotaoDaConta />
		</div>
	);
}

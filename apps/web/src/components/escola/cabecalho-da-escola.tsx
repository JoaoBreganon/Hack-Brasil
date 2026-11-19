"use client";

import { BellRingIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";
import { ETAPA_DE_ALERTAS, ETAPAS, enderecoDaEtapa } from "@/config/etapas";
import { SITE } from "@/config/site";
import { usePainelDaEscola } from "@/hooks/use-painel-da-escola";

export function CabecalhoDaEscola() {
	const { codigoInep, carregando, dados } = usePainelDaEscola();
	const caminhoAtual = usePathname();
	const enderecoDosAlertas = enderecoDaEtapa(codigoInep, ETAPA_DE_ALERTAS.caminho);

	return (
		<header className="border-b border-pauta bg-background print:hidden">
			<a
				href="#conteudo"
				className="sr-only rounded-lg bg-tinta px-4 py-2 font-semibold text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-10"
			>
				Pular para o conteúdo
			</a>
			<div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 pt-4 sm:px-8 sm:pt-5">
				<div className="flex items-center justify-between gap-4">
					<div className="flex min-w-0 items-center gap-4 sm:gap-5">
						<Link href="/" className="font-heading text-2xl font-extrabold tracking-tight text-tinta">
							{SITE.nome}
						</Link>
						<span aria-hidden="true" className="h-7 w-px shrink-0 bg-pauta" />
						<div className="flex min-w-0 flex-col leading-tight">
							{carregando ? (
								<Skeleton className="h-4 w-48" />
							) : (
								<span className="truncate text-[15px] font-semibold">
									{dados?.escola.nome ?? "Escola ainda não buscada"}
								</span>
							)}
							<span className="text-xs text-muted-foreground tabular-nums">
								INEP {codigoInep}
								{dados && ` · ${dados.escola.municipio}`}
							</span>
						</div>
					</div>
					<Link
						href={enderecoDosAlertas}
						aria-current={caminhoAtual === enderecoDosAlertas ? "page" : undefined}
						className="flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-papel hover:text-tinta aria-[current=page]:bg-papel aria-[current=page]:text-tinta"
					>
						<BellRingIcon aria-hidden="true" className="size-4" />
						<span className="hidden sm:inline">{ETAPA_DE_ALERTAS.rotulo}</span>
						<span className="sm:hidden">{ETAPA_DE_ALERTAS.curto}</span>
					</Link>
				</div>
				<nav aria-label="Etapas da compra" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
					<ol className="flex min-w-max gap-1 pb-3">
						{ETAPAS.map((etapa, indice) => {
							const endereco = enderecoDaEtapa(codigoInep, etapa.caminho);
							const atual = caminhoAtual === endereco;
							return (
								<li key={etapa.rotulo}>
									<Link
										href={endereco}
										aria-current={atual ? "step" : undefined}
										className={cn(
											"flex items-center gap-2 rounded-full px-3.5 py-2.5 text-sm transition-colors",
											atual
												? "bg-tinta font-semibold text-white"
												: "font-medium text-muted-foreground hover:bg-papel hover:text-tinta",
										)}
									>
										<span className={cn("tabular-nums", atual ? "text-cantalupo" : "text-muted-foreground/70")}>
											{indice + 1}
										</span>
										<span className="hidden md:inline">{etapa.rotulo}</span>
										<span className="md:hidden">{etapa.curto}</span>
									</Link>
								</li>
							);
						})}
					</ol>
				</nav>
			</div>
		</header>
	);
}

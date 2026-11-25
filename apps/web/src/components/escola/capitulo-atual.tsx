import type { CapituloDoPrazo } from "@aloca/dominio";
import { cn } from "cn";
import type { ReactNode } from "react";

const CORES: Record<CapituloDoPrazo["numero"], { fundo: string; rotulo: string }> = {
	1: { fundo: "bg-cantalupo text-tinta", rotulo: "text-tinta" },
	2: { fundo: "bg-azul-fundo text-tinta", rotulo: "text-azul-texto" },
	3: { fundo: "bg-tinta text-white", rotulo: "text-cantalupo" },
};

type Propriedades = {
	capitulo: CapituloDoPrazo;
	diasUteis: number;
	limite: string;
	children: ReactNode;
};

export function CapituloAtual({ capitulo, diasUteis, limite, children }: Propriedades) {
	const cores = CORES[capitulo.numero];
	return (
		<section aria-labelledby="titulo-capitulo" className={cn("flex flex-col gap-6 rounded-2xl p-5 sm:p-8", cores.fundo)}>
			<div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
				<div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
					<span className={cn("text-[15px] font-semibold", cores.rotulo)}>Capítulo {capitulo.numero} de 3</span>
					<h2
						id="titulo-capitulo"
						className="font-heading text-[clamp(48px,7vw,96px)] leading-[0.88] font-extrabold tracking-[-0.05em]"
					>
						{capitulo.mes}
					</h2>
					<p className="max-w-[44ch] text-lg leading-snug text-pretty">{capitulo.resumo}</p>
				</div>
				<p className="flex flex-col">
					<span className="font-heading text-[clamp(44px,5vw,64px)] leading-none font-extrabold tracking-tight tabular-nums">
						{diasUteis}
					</span>
					<span className="font-semibold">dias úteis, até {limite}</span>
				</p>
			</div>
			<div className="flex flex-col gap-4 rounded-xl bg-card p-5 text-foreground">{children}</div>
		</section>
	);
}

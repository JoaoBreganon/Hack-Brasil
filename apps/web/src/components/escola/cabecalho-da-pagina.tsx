"use client";

import { cn } from "cn";
import { m } from "motion/react";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { areaDoEndereco, type CorDaFaixa } from "@/config/navegacao";
import { useCodigoInep } from "@/hooks/use-painel-da-escola";

const ESCURAS: CorDaFaixa[] = ["azul", "tinta"];

const FUNDO: Record<CorDaFaixa, string> = {
	cantalupo: "bg-cantalupo text-tinta",
	azul: "bg-azul text-white",
	tinta: "bg-tinta text-white",
	"azul-fundo": "bg-azul-fundo text-tinta",
	papel: "bg-pilula text-tinta",
};

const BOTOES_NO_ESCURO = {
	"--primary": "#ffffff",
	"--primary-foreground": "var(--tinta)",
	"--secondary": "rgb(255 255 255 / 0.14)",
	"--secondary-foreground": "#ffffff",
} as CSSProperties;

const BOTOES_NO_CLARO = { "--secondary": "#ffffff" } as CSSProperties;

type Propriedades = {
	titulo: ReactNode;
	frase: ReactNode;
	rotulo?: ReactNode;
	acoes?: ReactNode;
	cor?: CorDaFaixa;
	children?: ReactNode;
};

export function CabecalhoDaPagina({ titulo, frase, rotulo, acoes, cor, children }: Propriedades) {
	const codigoInep = useCodigoInep();
	const caminho = usePathname();
	const corDaFaixa = cor ?? areaDoEndereco(codigoInep, caminho)?.cor ?? "papel";
	const escura = ESCURAS.includes(corDaFaixa);

	return (
		<m.header
			initial={{ opacity: 0, scale: 0.985 }}
			animate={{ opacity: 1, scale: 1 }}
			style={escura ? BOTOES_NO_ESCURO : BOTOES_NO_CLARO}
			className={cn(
				"flex min-h-[min(46svh,500px)] flex-col justify-end gap-8 rounded-[32px] px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14 print:hidden",
				FUNDO[corDaFaixa],
			)}
		>
			<div className="flex flex-col gap-4">
				{rotulo && <span className={cn("text-[15px] font-semibold", escura ? "text-white/80" : "text-tinta/75")}>{rotulo}</span>}
				<m.h1
					initial={{ opacity: 0, y: 14 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.06 }}
					className="max-w-[18ch] font-heading text-[clamp(44px,7vw,120px)] leading-[0.92] font-extrabold tracking-[-0.05em] text-balance"
				>
					{titulo}
				</m.h1>
			</div>
			<div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
				<p
					className={cn(
						"max-w-[52ch] flex-[1_1_360px] text-lg leading-snug text-pretty sm:text-xl",
						escura ? "text-white/85" : "text-tinta/80",
					)}
				>
					{frase}
				</p>
				{acoes && <div className="flex flex-wrap items-center gap-2.5">{acoes}</div>}
			</div>
			{children}
		</m.header>
	);
}

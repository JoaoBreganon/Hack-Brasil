import type { ReactNode } from "react";

type Propriedades = {
	titulo: string;
	frase: ReactNode;
	acoes?: ReactNode;
};

export function CabecalhoDaPagina({ titulo, frase, acoes }: Propriedades) {
	return (
		<header className="flex flex-wrap items-center justify-between gap-4 print:hidden">
			<div className="flex flex-col gap-0.5">
				<h1 className="font-heading text-[26px] leading-tight font-bold tracking-tight max-md:sr-only">{titulo}</h1>
				<p className="text-pretty text-muted-foreground">{frase}</p>
			</div>
			{acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
		</header>
	);
}

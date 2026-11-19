import type { ReactNode } from "react";

type Propriedades = {
	titulo: string;
	descricao: ReactNode;
	acoes?: ReactNode;
};

export function CabecalhoDaEtapa({ titulo, descricao, acoes }: Propriedades) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
			<div className="flex max-w-2xl flex-col gap-2.5">
				<h1 className="font-heading text-[32px] leading-[1.05] font-extrabold tracking-tight text-balance sm:text-[40px]">
					{titulo}
				</h1>
				<p className="text-base text-pretty text-muted-foreground">{descricao}</p>
			</div>
			{acoes && <div className="flex flex-wrap items-center gap-3 print:hidden">{acoes}</div>}
		</div>
	);
}

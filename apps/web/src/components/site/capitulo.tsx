import { cn } from "cn";
import type { ReactNode } from "react";

type Propriedades = {
	id: string;
	rotulo: string;
	titulo: string;
	texto: string;
	className: string;
	classeDoRotulo?: string;
	children: ReactNode;
};

export function Capitulo({ id, rotulo, titulo, texto, className, classeDoRotulo, children }: Propriedades) {
	return (
		<section
			id={id}
			aria-labelledby={`titulo-${id}`}
			className={cn("flex flex-wrap items-end gap-12 px-5 py-14 sm:min-h-[90svh] sm:px-10 sm:py-20 lg:px-16 lg:py-24", className)}
		>
			<div className="flex min-w-0 flex-[1_1_520px] flex-col gap-5">
				<span className={cn("text-[15px] font-semibold", classeDoRotulo)}>{rotulo}</span>
				<h2
					id={`titulo-${id}`}
					className="font-heading text-[clamp(56px,11vw,180px)] leading-[0.88] font-extrabold tracking-[-0.055em]"
				>
					{titulo}
				</h2>
				<p className="max-w-[30ch] text-[clamp(20px,1.8vw,26px)] leading-snug text-pretty">{texto}</p>
			</div>
			<div className="flex min-w-0 flex-[1_1_360px] lg:justify-end">{children}</div>
		</section>
	);
}

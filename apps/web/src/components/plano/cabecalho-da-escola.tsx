import Link from "next/link";
import { SITE } from "@/config/site";

const ETAPAS = ["Saldo", "Plano de compra", "Orçamentos", "Ata da APM"];
const ETAPA_ATUAL = 1;

type Propriedades = {
	nome: string;
	codigoInep: string;
	municipio: string;
};

export function CabecalhoDaEscola({ nome, codigoInep, municipio }: Propriedades) {
	return (
		<header className="border-b border-pauta">
			<div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-[18px] sm:px-8">
				<div className="flex flex-wrap items-center gap-5">
					<Link href="/" className="font-heading text-2xl font-extrabold tracking-tight text-tinta">
						{SITE.nome}
					</Link>
					<span aria-hidden="true" className="h-7 w-px bg-pauta" />
					<div className="flex flex-col leading-tight">
						<span className="text-[15px] font-semibold">{nome}</span>
						<span className="text-xs text-muted-foreground">
							INEP {codigoInep} · {municipio}
						</span>
					</div>
				</div>
				<nav aria-label="Etapas da compra">
					<ol className="flex flex-wrap gap-1">
						{ETAPAS.map((etapa, indice) => {
							const atual = indice === ETAPA_ATUAL;
							return (
								<li
									key={etapa}
									aria-current={atual ? "step" : undefined}
									className={`flex items-center gap-2 rounded-full px-3.5 py-2.5 ${atual ? "bg-tinta font-semibold text-white" : "font-medium text-muted-foreground"}`}
								>
									<span className={`tabular-nums ${atual ? "text-cantalupo" : "text-muted-foreground/70"}`}>
										{indice + 1}
									</span>
									{etapa}
								</li>
							);
						})}
					</ol>
				</nav>
			</div>
		</header>
	);
}

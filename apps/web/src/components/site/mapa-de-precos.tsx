import { formatarReais, NECESSIDADES_EXEMPLO } from "@aloca/dominio";
import { cn } from "cn";

const [ITEM] = NECESSIDADES_EXEMPLO;
const COTACOES = [...ITEM.cotacoes].sort((a, b) => a.valorEmCentavos - b.valorEmCentavos);

export function MapaDePrecos() {
	return (
		<figure className="m-0 flex w-full max-w-[560px] flex-col rounded-2xl border border-border bg-card p-7 text-[15px]">
			<figcaption className="mb-3 text-[17px] font-semibold">Mapa de preços · {ITEM.descricao}</figcaption>
			<ul className="m-0 flex list-none flex-col p-0">
				{COTACOES.map((cotacao, indice) => (
					<li
						key={cotacao.fornecedor}
						className={cn(
							"flex justify-between gap-4 border-t border-regra py-3 tabular-nums",
							indice > 0 && "text-muted-foreground",
						)}
					>
						<span>{cotacao.fornecedor}</span>
						<span className={cn(indice === 0 && "font-bold text-azul-texto")}>
							{formatarReais(cotacao.valorEmCentavos)}
							{indice === 0 && " · escolhido"}
						</span>
					</li>
				))}
			</ul>
			<span className="mt-4 inline-flex h-8 items-center self-start rounded-full bg-tinta px-3.5 text-sm font-semibold text-primary-foreground">
				Aprovado em ata da APM
			</span>
		</figure>
	);
}

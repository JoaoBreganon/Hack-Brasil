import { formatarReais, ORCAMENTOS_EXIGIDOS, REGRAS_POR_TIPO } from "@aloca/dominio";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";
import { enderecoDaArea } from "@/config/navegacao";
import type { ItemDoPainel } from "@/hooks/use-painel-da-escola";

const COLUNAS = "grid grid-cols-[minmax(0,1fr)_88px_16px] items-center gap-x-4 sm:grid-cols-[minmax(0,1fr)_72px_92px_104px_16px]";

type Propriedades = {
	codigoInep: string;
	itens: ItemDoPainel[];
	selecionado: string | null;
	foraDoPlano: Set<string>;
};

function Orcamentos({ item }: { item: ItemDoPainel }) {
	if (!REGRAS_POR_TIPO[item.tipo].permitido) {
		return <span className="text-perigo">Não pode</span>;
	}
	const quantidade = Math.min(item.orcamentos.length, ORCAMENTOS_EXIGIDOS);
	const completo = quantidade >= ORCAMENTOS_EXIGIDOS || Boolean(item.justificativa);
	return (
		<span className={cn("tabular-nums", completo ? "text-muted-foreground" : "font-semibold text-ambar")}>
			{quantidade} de {ORCAMENTOS_EXIGIDOS}
		</span>
	);
}

export function TabelaDeItens({ codigoInep, itens, selecionado, foraDoPlano }: Propriedades) {
	return (
		<section aria-label="Itens" className="overflow-hidden rounded-lg border border-border bg-card">
			<div aria-hidden="true" className={cn(COLUNAS, "px-5 py-3 text-[13px] text-muted-foreground")}>
				<span>Item</span>
				<span className="hidden sm:block">Tipo</span>
				<span className="hidden sm:block">Orçamentos</span>
				<span className="text-right">Menor preço</span>
				<span />
			</div>
			{itens.length === 0 ? (
				<p className="border-t border-regra px-5 py-8 text-center text-muted-foreground">Nenhum item neste filtro.</p>
			) : (
				<ul>
					{itens.map((item) => {
						const regra = REGRAS_POR_TIPO[item.tipo];
						const menor = item.orcamentos.reduce<number | null>(
							(atual, { valorEmCentavos }) => (atual === null ? valorEmCentavos : Math.min(atual, valorEmCentavos)),
							null,
						);
						const aberto = item._id === selecionado;
						return (
							<li key={item._id} className="border-t border-regra">
								<Link
									href={enderecoDaArea(codigoInep, "compras", { item: item._id })}
									scroll={false}
									aria-current={aberto ? "true" : undefined}
									className={cn(COLUNAS, "px-5 py-3 transition-colors hover:bg-background", aberto && "bg-background")}
								>
									<span className="flex min-w-0 flex-col">
										<span className="font-medium text-pretty">{item.descricao}</span>
										<span className="text-[13px] text-muted-foreground">
											{item.quantidade} un.
											<span className="sm:hidden">
												{" · "}
												<Orcamentos item={item} />
											</span>
											{foraDoPlano.has(item._id) && <span className="sr-only">, fora do plano</span>}
										</span>
									</span>
									<span
										className={cn("hidden text-sm sm:block", regra.permitido ? "text-muted-foreground" : "text-perigo")}
									>
										{regra.permitido ? (regra.categoria === "custeio" ? "Custeio" : "Capital") : "Vedado"}
									</span>
									<span className="hidden text-sm sm:block">
										<Orcamentos item={item} />
									</span>
									<span className={cn("text-right tabular-nums", menor === null && "text-apagado")}>
										{menor === null ? "—" : formatarReais(menor)}
									</span>
									<ChevronRightIcon aria-hidden="true" className="size-4 text-apagado" />
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}

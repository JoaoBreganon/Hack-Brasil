import { FONTES, formatarReais, ORCAMENTOS_EXIGIDOS, type PlanoDeCompra, REGRAS_POR_TIPO } from "@aloca/dominio";
import { RegraCitada } from "./regra-citada";
import { SeloDeCategoria } from "./selo-de-categoria";

const CABECALHO = "px-4 py-4 text-left text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase first:pl-7 last:pr-7";
const CELULA = "px-4 py-[22px] align-middle first:pl-7 last:pr-7";

export function TabelaDoPlano({ plano }: { plano: PlanoDeCompra }) {
	const totalDoPlano = plano.totalPorCategoria.custeio + plano.totalPorCategoria.capital;
	const sobra = plano.saldoRestante.custeio + plano.saldoRestante.capital;

	return (
		<section id="plano" aria-labelledby="titulo-plano" className="flex flex-col gap-5">
			<div>
				<h2 id="titulo-plano" className="font-heading text-[26px] font-extrabold tracking-tight">
					Dentro das regras
				</h2>
				<p className="mt-2.5 text-base text-muted-foreground">
					{plano.itens.length} {plano.itens.length === 1 ? "item" : "itens"} dentro das regras, somando{" "}
					<strong className="text-tinta tabular-nums">{formatarReais(totalDoPlano)}</strong>. Sobram{" "}
					<strong className="bg-cantalupo px-1 text-tinta tabular-nums">{formatarReais(sobra)}</strong> para planejar.
				</p>
			</div>

			<div className="overflow-x-auto rounded-[20px] bg-card shadow-[0_0_0_1px_var(--pauta),0_1px_2px_rgb(11_15_28/0.05)]">
				<table className="w-full min-w-[1000px] border-collapse">
					<caption className="sr-only">Itens do plano de compra, com os três orçamentos e a regra de cada um</caption>
					<thead>
						<tr className="border-b border-pauta">
							<th scope="col" className={`${CABECALHO} w-16`}>
								Ordem
							</th>
							<th scope="col" className={CABECALHO}>
								Item e regra
							</th>
							<th scope="col" className={`${CABECALHO} w-14 text-right`}>
								Qtd.
							</th>
							<th scope="col" className={CABECALHO}>
								Três orçamentos · menor preço circulado
							</th>
							<th scope="col" className={`${CABECALHO} w-40 text-right`}>
								Total
							</th>
						</tr>
					</thead>
					<tbody>
						{plano.itens.map(({ necessidade, validacao }, indice) => (
							<tr key={necessidade.id} className="border-b border-pauta/75">
								<td className={CELULA}>
									<span className="flex size-9 items-center justify-center rounded-full border border-border font-semibold tabular-nums">
										{indice + 1}
									</span>
								</td>
								<td className={CELULA}>
									<div className="flex min-w-0 flex-col gap-1.5">
										<span className="text-base font-semibold">{necessidade.descricao}</span>
										<div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
											{validacao.categoria && <SeloDeCategoria categoria={validacao.categoria} />}
											<span>{necessidade.tipo}</span>
										</div>
										<RegraCitada fonte={REGRAS_POR_TIPO[necessidade.tipo].fonte} />
									</div>
								</td>
								<td className={`${CELULA} text-right font-medium tabular-nums`}>{necessidade.quantidade}</td>
								<td className={CELULA}>
									<ul className="grid grid-cols-3 gap-2">
										{validacao.escolha?.cotacoesOrdenadas.slice(0, ORCAMENTOS_EXIGIDOS).map((cotacao, posicao) => {
											const menor = posicao === 0;
											return (
												<li
													key={`${posicao}-${cotacao.fornecedor}`}
													className={`flex flex-col rounded-full border-2 px-3 py-2 leading-tight ${menor ? "-rotate-[1.5deg] border-primary" : "border-transparent"}`}
												>
													<span
														className={`text-[11px] ${menor ? "font-semibold text-primary" : "text-muted-foreground"}`}
													>
														{cotacao.fornecedor}
														{menor && " · menor"}
													</span>
													<span className={`tabular-nums ${menor ? "font-semibold" : "text-muted-foreground"}`}>
														{formatarReais(cotacao.valorEmCentavos)}
													</span>
												</li>
											);
										})}
									</ul>
								</td>
								<td className={`${CELULA} text-right font-heading text-xl font-bold tracking-tight tabular-nums`}>
									{formatarReais(validacao.totalEmCentavos)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
				<div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 rounded-b-[20px] bg-background/60 px-7 py-5">
					<div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted-foreground tabular-nums">
						<span>
							Custeio <strong className="text-tinta">{formatarReais(plano.totalPorCategoria.custeio)}</strong>
						</span>
						<span>
							Capital <strong className="text-tinta">{formatarReais(plano.totalPorCategoria.capital)}</strong>
						</span>
						<span>Menor preço em todos os itens. Regra: {FONTES.menorPreco.norma}.</span>
					</div>
					<div className="flex items-baseline gap-3">
						<span className="text-[13px] text-muted-foreground">Total do plano</span>
						<span className="font-heading text-[28px] font-extrabold tracking-tight tabular-nums">
							{formatarReais(totalDoPlano)}
						</span>
					</div>
				</div>
			</div>
		</section>
	);
}

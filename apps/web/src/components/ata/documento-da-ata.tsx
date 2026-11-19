import { type Ata, formatarData, formatarReais } from "@aloca/dominio";
import { cn } from "cn";
import { SeloDeCategoria } from "@/components/plano/selo-de-categoria";

type Propriedades = {
	ata: Ata;
	municipio: string;
	data: Date;
	rascunho: boolean;
};

const CABECALHO =
	"border-b border-tinta/20 py-2 pr-3 text-left text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase last:pr-0";
const CELULA = "border-b border-pauta py-2.5 pr-3 align-top last:pr-0";

export function DocumentoDaAta({ ata, municipio, data, rascunho }: Propriedades) {
	return (
		<article
			aria-label={ata.titulo}
			className="relative mx-auto w-full max-w-[860px] overflow-hidden rounded-[6px] bg-white px-6 py-10 text-[15px] leading-relaxed shadow-[0_0_0_1px_var(--pauta),0_24px_48px_-24px_rgb(11_15_28/0.25)] sm:px-14 sm:py-14 print:max-w-none print:rounded-none print:p-0 print:shadow-none"
		>
			{rascunho && (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -rotate-[18deg] rounded-xl border-[6px] border-perigo/25 px-8 py-2 font-heading text-7xl font-extrabold tracking-[0.18em] text-perigo/25 select-none sm:text-8xl"
				>
					RASCUNHO
				</span>
			)}
			<header className="flex flex-col gap-2 border-b-2 border-tinta pb-5">
				<p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
					Associação de Pais e Mestres · Unidade Executora do PDDE
				</p>
				<h2 className="font-heading text-2xl leading-tight font-extrabold tracking-tight text-balance sm:text-[28px]">
					{ata.titulo}
				</h2>
				{rascunho && <p className="text-sm font-semibold text-perigo">Rascunho: o plano ainda não foi aprovado.</p>}
			</header>

			<div className="mt-6 flex flex-col gap-4 text-pretty">
				<p>{ata.abertura}</p>
				<p>{ata.deliberacao}</p>
			</div>

			<section aria-labelledby="titulo-itens-da-ata" className="mt-8">
				<h3 id="titulo-itens-da-ata" className="font-heading text-lg font-bold">
					Itens aprovados
				</h3>
				<div className="mt-3 overflow-x-auto">
					<table className="w-full min-w-[620px] border-collapse text-sm">
						<thead>
							<tr>
								<th scope="col" className={CABECALHO}>
									Item
								</th>
								<th scope="col" className={CABECALHO}>
									Fornecedor
								</th>
								<th scope="col" className={cn(CABECALHO, "text-right")}>
									Qtd.
								</th>
								<th scope="col" className={cn(CABECALHO, "text-right")}>
									Unitário
								</th>
								<th scope="col" className={cn(CABECALHO, "text-right")}>
									Total
								</th>
							</tr>
						</thead>
						<tbody>
							{ata.itens.map((item) => (
								<tr key={item.descricao}>
									<td className={CELULA}>
										<span className="flex flex-col gap-1">
											<span className="font-medium">{item.descricao}</span>
											<span className="flex items-center gap-2 text-xs text-muted-foreground">
												<SeloDeCategoria categoria={item.categoria} />
												{item.tipo}
											</span>
										</span>
									</td>
									<td className={CELULA}>{item.fornecedor}</td>
									<td className={cn(CELULA, "text-right tabular-nums")}>{item.quantidade}</td>
									<td className={cn(CELULA, "text-right tabular-nums")}>{formatarReais(item.valorUnitarioEmCentavos)}</td>
									<td className={cn(CELULA, "text-right font-semibold tabular-nums")}>
										{formatarReais(item.totalEmCentavos)}
									</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr>
								<td colSpan={4} className="pt-3 pr-3 text-right text-sm text-muted-foreground">
									Custeio {formatarReais(ata.total.custeio)} · Capital {formatarReais(ata.total.capital)} · Total
								</td>
								<td className="pt-3 text-right font-heading text-lg font-extrabold tabular-nums">
									{formatarReais(ata.total.geral)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</section>

			<section aria-labelledby="titulo-mapa" className="mt-10 break-inside-avoid-page">
				<h3 id="titulo-mapa" className="font-heading text-lg font-bold">
					Mapa de preços
				</h3>
				<p className="text-sm text-muted-foreground">Orçamentos de cada item, do menor para o maior. O vencedor está marcado.</p>
				<ul className="mt-3 flex flex-col">
					{ata.mapaDePrecos.map((linha) => (
						<li key={linha.descricao} className="flex flex-col gap-1.5 border-b border-pauta py-3 last:border-b-0">
							<span className="font-medium">{linha.descricao}</span>
							<ol className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
								{linha.cotacoes.map((cotacao, posicao) => (
									<li
										key={`${posicao}-${cotacao.fornecedor}`}
										className={cn("tabular-nums", cotacao.vencedora ? "font-semibold" : "text-muted-foreground")}
									>
										{posicao + 1}. {cotacao.fornecedor}: {formatarReais(cotacao.valorEmCentavos)}
										{cotacao.vencedora && " (vencedor)"}
									</li>
								))}
							</ol>
							{linha.justificativa && (
								<p className="text-sm text-muted-foreground">
									Justificativa para menos de três orçamentos: {linha.justificativa}
								</p>
							)}
						</li>
					))}
				</ul>
			</section>

			<p className="mt-10">{ata.encerramento}</p>
			<p className="mt-4">
				{municipio}, {formatarData(data)}.
			</p>

			<div className="mt-14 grid gap-x-12 gap-y-14 sm:grid-cols-2 print:grid-cols-2">
				{ata.assinaturas.map((assinatura) => (
					<div key={assinatura} className="flex flex-col gap-2 border-t border-tinta pt-2">
						<span className="text-sm font-medium">{assinatura}</span>
						<span className="text-xs text-muted-foreground">Nome e assinatura</span>
					</div>
				))}
			</div>
		</article>
	);
}

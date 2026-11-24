import { formatarData, formatarReais, ORCAMENTOS_EXIGIDOS } from "@aloca/dominio";
import { Cifra } from "@/components/escola/cifra";
import { JsonLd } from "@/components/seo/json-ld";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { enderecoDaPaginaPublica } from "@/config/navegacao";
import { SITE } from "@/config/site";
import type { PaginaPublica } from "@/lib/pagina-publica";

const ROTULO_DA_CATEGORIA = { custeio: "Custeio", capital: "Capital" } as const;

function dadosEstruturados({ escola, plano }: PaginaPublica) {
	return {
		"@context": "https://schema.org",
		"@type": "WebPage",
		name: `PDDE da ${escola.nome}`,
		url: `${SITE.url}${enderecoDaPaginaPublica(escola.codigoInep)}`,
		inLanguage: SITE.idioma,
		...(plano ? { dateModified: new Date(plano.aprovadoEm).toISOString() } : {}),
		about: {
			"@type": "School",
			name: escola.nome,
			identifier: escola.codigoInep,
			address: { "@type": "PostalAddress", addressLocality: escola.municipio, addressCountry: "BR" },
		},
	};
}

function PlanoAprovado({ plano }: { plano: NonNullable<PaginaPublica["plano"]> }) {
	const saldoTotal = plano.saldo.custeio + plano.saldo.capital;
	const total = plano.total.custeio + plano.total.capital;
	return (
		<>
			<dl className="flex flex-wrap rounded-lg border border-border bg-card">
				<Cifra
					rotulo={`Saldo do PDDE de ${plano.exercicio}`}
					valor={formatarReais(saldoTotal)}
					apoio={`${formatarReais(plano.saldo.custeio)} custeio · ${formatarReais(plano.saldo.capital)} capital`}
				/>
				<Cifra
					rotulo="Plano aprovado"
					valor={formatarReais(total)}
					apoio={`${plano.itens.length} ${plano.itens.length === 1 ? "item" : "itens"}`}
				/>
				<Cifra rotulo="Fica para a próxima compra" valor={formatarReais(saldoTotal - total)} apoio="Continua na conta da escola" />
			</dl>
			<section aria-labelledby="titulo-compras" className="overflow-hidden rounded-lg border border-border bg-card">
				<h2 id="titulo-compras" className="px-5 py-4 font-semibold">
					O que a escola vai comprar
				</h2>
				<table className="w-full text-left tabular-nums">
					<thead className="text-[13px] text-muted-foreground">
						<tr>
							<th scope="col" className="px-5 pb-2.5 font-normal">
								Item
							</th>
							<th scope="col" className="hidden pb-2.5 font-normal sm:table-cell">
								Fornecedor
							</th>
							<th scope="col" className="hidden pb-2.5 text-right font-normal sm:table-cell">
								Qtd.
							</th>
							<th scope="col" className="px-5 pb-2.5 text-right font-normal">
								Total
							</th>
						</tr>
					</thead>
					<tbody>
						{plano.itens.map((item) => (
							<tr key={item.descricao} className="border-t border-regra align-top">
								<td className="px-5 py-3.5">
									<span className="block font-medium text-pretty">{item.descricao}</span>
									<span className="block text-[13px] text-muted-foreground">
										{item.categoria && ROTULO_DA_CATEGORIA[item.categoria]}
										<span className="sm:hidden">
											{" · "}
											{item.fornecedor} · {item.quantidade} un.
										</span>
									</span>
								</td>
								<td className="hidden py-3.5 pr-4 text-muted-foreground sm:table-cell">{item.fornecedor}</td>
								<td className="hidden py-3.5 text-right sm:table-cell">{item.quantidade}</td>
								<td className="px-5 py-3.5 text-right font-semibold">{formatarReais(item.totalEmCentavos)}</td>
							</tr>
						))}
					</tbody>
					<tfoot>
						<tr className="border-t border-border">
							<th scope="row" colSpan={3} className="hidden px-5 py-3.5 font-semibold sm:table-cell">
								Total
							</th>
							<th scope="row" className="px-5 py-3.5 font-semibold sm:hidden">
								Total
							</th>
							<td className="px-5 py-3.5 text-right font-bold">{formatarReais(total)}</td>
						</tr>
					</tfoot>
				</table>
			</section>
			<p className="text-[13px] text-pretty text-muted-foreground">
				Saldo do {plano.fonte.nome}, coletado em {formatarData(new Date(plano.coletadoEm))}. Cada item sai do menor de{" "}
				{ORCAMENTOS_EXIGIDOS} orçamentos, como pede o FNDE.
			</p>
		</>
	);
}

export function PaginaDaEscola({ pagina }: { pagina: PaginaPublica }) {
	const { escola, plano } = pagina;
	return (
		<>
			<JsonLd dados={dadosEstruturados(pagina)} />
			<header className="flex flex-col gap-3">
				<p className="text-sm text-muted-foreground">
					{escola.municipio} · INEP {escola.codigoInep}
				</p>
				<h1 className="font-heading text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
					{escola.nome}
				</h1>
				<p className="max-w-2xl text-lg text-pretty text-muted-foreground">
					{plano
						? `Como a escola vai usar o dinheiro do PDDE, aprovado pela APM em ${formatarData(new Date(plano.aprovadoEm))}.`
						: "Como a escola vai usar o dinheiro do PDDE."}
				</p>
			</header>
			{plano ? (
				<PlanoAprovado plano={plano} />
			) : (
				<Empty className="rounded-lg border border-border bg-card py-14">
					<EmptyHeader>
						<EmptyTitle className="text-lg font-semibold">O plano ainda não foi aprovado</EmptyTitle>
						<EmptyDescription>Quando a APM aprovar o plano de compra, os itens e os valores aparecem aqui.</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</>
	);
}

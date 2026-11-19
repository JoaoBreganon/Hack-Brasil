import { type Ata, type Escola, formatarData, formatarReais } from "@aloca/dominio";
import { cn } from "cn";

type Propriedades = {
	ata: Ata;
	escola: Escola;
	data: Date;
	rascunho: boolean;
};

export function DocumentoDaAta({ ata, escola, data, rascunho }: Propriedades) {
	return (
		<article
			aria-label={ata.titulo}
			className="mx-auto w-full max-w-[720px] rounded bg-card p-7 text-[15px] leading-relaxed shadow-[0_0_0_1px_var(--border),0_18px_40px_-24px_rgb(11_15_28/0.25)] sm:p-14 print:max-w-none print:p-0 print:shadow-none"
		>
			<h2 className="font-heading text-[22px] leading-snug font-bold tracking-tight text-balance">{ata.titulo}</h2>
			<p className="mt-1 text-sm text-muted-foreground">
				APM da {escola.nome} · INEP {escola.codigoInep} · {escola.municipio}
			</p>
			{rascunho && <p className="mt-3 text-sm font-semibold text-perigo">Rascunho: o plano ainda não foi aprovado.</p>}

			<div className="mt-6 flex flex-col gap-3 text-pretty">
				<p>{ata.abertura}</p>
				<p>{ata.deliberacao}</p>
			</div>

			<ul className="mt-6 border-t border-regra">
				{ata.itens.map((item) => (
					<li key={item.descricao} className="flex justify-between gap-4 border-b border-regra py-2.5 tabular-nums">
						<span>
							{item.descricao}
							{item.quantidade > 1 && `, ${item.quantidade} unidades`}, {item.fornecedor}
						</span>
						<span className="shrink-0">{formatarReais(item.totalEmCentavos)}</span>
					</li>
				))}
				<li className="flex justify-between gap-4 py-2.5 font-semibold tabular-nums">
					<span>Total</span>
					<span>{formatarReais(ata.total.geral)}</span>
				</li>
			</ul>

			<section aria-labelledby="titulo-mapa" className="mt-8 break-inside-avoid">
				<h3 id="titulo-mapa" className="font-semibold">
					Mapa de preços
				</h3>
				<ul className="mt-2 flex flex-col gap-2 text-sm">
					{ata.mapaDePrecos.map((linha) => (
						<li key={linha.descricao}>
							<span className="font-medium">{linha.descricao}: </span>
							{linha.cotacoes.map((cotacao, posicao) => (
								<span
									key={`${posicao}-${cotacao.fornecedor}`}
									className={cn("tabular-nums", !cotacao.vencedora && "text-muted-foreground")}
								>
									{posicao > 0 && " · "}
									{cotacao.fornecedor} {formatarReais(cotacao.valorEmCentavos)}
									{cotacao.vencedora && " (escolhido)"}
								</span>
							))}
							{linha.justificativa && (
								<span className="block text-muted-foreground">Menos de três orçamentos: {linha.justificativa}</span>
							)}
						</li>
					))}
				</ul>
			</section>

			<p className="mt-8">{ata.encerramento}</p>
			<p className="mt-2">
				{escola.municipio}, {formatarData(data)}.
			</p>

			<div className="mt-14 grid grid-cols-2 gap-x-10 gap-y-12 text-[13px]">
				{ata.assinaturas.map((assinatura) => (
					<span key={assinatura} className="border-t border-foreground pt-1.5">
						{assinatura}
					</span>
				))}
			</div>
		</article>
	);
}

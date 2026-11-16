import { type Categoria, FONTES, formatarReais, type Saldo } from "@aloca/dominio";

const CATEGORIAS: { chave: Categoria; rotulo: string }[] = [
	{ chave: "custeio", rotulo: "Custeio" },
	{ chave: "capital", rotulo: "Capital" },
];

type Propriedades = {
	saldoTotal: number;
	saldo: Saldo;
	noPlano: Saldo;
	fonte: string;
};

export function CartaoDoSaldo({ saldoTotal, saldo, noPlano, fonte }: Propriedades) {
	return (
		<section aria-labelledby="titulo-saldo" className="flex min-w-0 flex-[1_1_340px] flex-col gap-6 rounded-[20px] bg-papel p-6 sm:p-8">
			<div>
				<h2 id="titulo-saldo" className="text-[13px] font-normal text-muted-foreground">
					Saldo em conta
				</h2>
				<p className="mt-0.5 font-heading text-4xl leading-tight sm:text-5xl font-extrabold tracking-tight tabular-nums">
					{formatarReais(saldoTotal)}
				</p>
				<p className="mt-1.5 text-xs text-muted-foreground">{fonte}</p>
			</div>

			{CATEGORIAS.map(({ chave, rotulo }) => {
				const percentual = saldo[chave] > 0 ? Math.min(100, Math.round((noPlano[chave] / saldo[chave]) * 100)) : 0;
				return (
					<div key={chave} className="flex flex-col gap-2">
						<div className="flex items-baseline justify-between gap-3 font-semibold">
							<span>{rotulo}</span>
							<span className="tabular-nums">{formatarReais(saldo[chave])}</span>
						</div>
						<div
							role="img"
							aria-label={`${percentual}% do ${rotulo.toLowerCase()} já está no plano`}
							className="h-3 overflow-hidden rounded-full bg-tinta/8"
						>
							<div className="h-full rounded-full bg-primary" style={{ width: `${percentual}%` }} />
						</div>
						<div className="flex justify-between gap-3 text-[13px] text-muted-foreground tabular-nums">
							<span>{formatarReais(noPlano[chave])} no plano</span>
							<span className="font-semibold text-tinta">sobram {formatarReais(saldo[chave] - noPlano[chave])}</span>
						</div>
					</div>
				);
			})}

			<p className="mt-auto border-t border-dashed border-border pt-4 text-xs text-muted-foreground">
				Divisão padrão de 80% custeio e 20% capital. Regra: {FONTES.percentualPadrao.norma}.
			</p>
		</section>
	);
}

import { formatarReais, type ItemDoPlano, type Saldo } from "@aloca/dominio";
import { RegraCitada } from "./regra-citada";

type Propriedades = {
	itens: ItemDoPlano[];
	saldoRestante: Saldo;
};

export function ForaDoPlano({ itens, saldoRestante }: Propriedades) {
	if (itens.length === 0) {
		return null;
	}

	return (
		<section aria-labelledby="titulo-fora" className="flex flex-col gap-4">
			<div>
				<h2 id="titulo-fora" className="font-heading text-[26px] font-extrabold tracking-tight">
					Fora do plano
				</h2>
				<p className="mt-1.5 text-[15px] text-muted-foreground">
					O Aloca não deixa entrar o que a regra proíbe ou o saldo não cobre, e mostra o porquê.
				</p>
			</div>
			<div className="flex flex-wrap gap-5">
				{itens.map(({ necessidade, validacao }) => {
					const vedado = validacao.categoria === null;
					const [problema] = validacao.problemas;
					return (
						<article
							key={necessidade.id}
							className="relative flex min-w-0 flex-[1_1_420px] flex-col gap-2.5 overflow-hidden rounded-[20px] bg-card p-6 sm:p-7 sm:pb-6 shadow-[0_0_0_1px_var(--pauta)]"
						>
							<span
								className={`-rotate-[7deg] self-start sm:absolute sm:top-6 sm:right-6 rounded-lg border-[3px] px-3.5 py-1 font-heading text-lg font-extrabold tracking-[0.12em] ${vedado ? "border-perigo text-perigo" : "border-tinta text-tinta"}`}
							>
								{vedado ? "VEDADO" : "SEM SALDO"}
							</span>
							<h3 className="text-[17px] font-semibold sm:pr-40">{necessidade.descricao}</h3>
							<p className="font-heading text-[22px] font-bold tracking-tight tabular-nums">
								{formatarReais(validacao.totalEmCentavos)}
							</p>
							<p className="text-sm text-muted-foreground">
								{problema?.mensagem}
								{validacao.categoria &&
									` Sobram ${formatarReais(saldoRestante[validacao.categoria])} em ${validacao.categoria}.`}
							</p>
							{problema && <RegraCitada fonte={problema.fonte} />}
						</article>
					);
				})}
			</div>
		</section>
	);
}

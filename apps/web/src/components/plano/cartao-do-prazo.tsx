import { FONTES, formatarData, type NivelDeRisco, type Risco, type SituacaoDoPrazo } from "@aloca/dominio";
import { ReguaDoPrazo } from "./regua-do-prazo";

const ESTILO_DO_RISCO: Record<NivelDeRisco, { rotulo: string; selo: string; ponto: string }> = {
	"em dia": { rotulo: "Em dia", selo: "bg-custeio-fundo text-custeio", ponto: "bg-primary" },
	atenção: { rotulo: "Atenção", selo: "bg-capital-fundo text-capital", ponto: "bg-cantalupo" },
	urgente: { rotulo: "Urgente", selo: "bg-perigo text-white", ponto: "bg-white" },
	perdido: { rotulo: "Prazo encerrado", selo: "bg-perigo text-white", ponto: "bg-white" },
	"sem saldo": { rotulo: "Sem saldo", selo: "bg-secondary text-secondary-foreground", ponto: "bg-muted-foreground" },
	"sem prazo": { rotulo: "Sem prazo de estorno", selo: "bg-secondary text-secondary-foreground", ponto: "bg-muted-foreground" },
};

type Propriedades = {
	hoje: Date;
	situacao: SituacaoDoPrazo;
	risco: Risco;
};

export function CartaoDoPrazo({ hoje, situacao, risco }: Propriedades) {
	const estilo = ESTILO_DO_RISCO[risco.nivel];

	return (
		<section
			aria-labelledby="titulo-prazo"
			className="flex min-w-0 flex-[999_1_620px] flex-col gap-7 rounded-[20px] bg-card px-6 py-7 sm:px-9 sm:py-8 shadow-[0_0_0_1px_var(--pauta),0_1px_2px_rgb(11_15_28/0.05),0_8px_24px_-12px_rgb(11_15_28/0.12)]"
		>
			<div className="flex flex-wrap items-center gap-3">
				<span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-semibold ${estilo.selo}`}>
					<span aria-hidden="true" className={`size-2 rounded-full ${estilo.ponto}`} />
					{estilo.rotulo}
				</span>
				<span className="text-[13px] text-muted-foreground">
					Saldo do exercício de {situacao.exercicio} · simulação em {formatarData(hoje)}
				</span>
			</div>

			{situacao.tipo === "sem prazo" ? (
				<h1 id="titulo-prazo" className="font-heading text-4xl font-bold tracking-tight">
					{risco.mensagem}
				</h1>
			) : (
				<>
					<h1 id="titulo-prazo" className="flex items-baseline gap-3.5 font-heading leading-[0.85] tracking-tighter">
						<span className="text-[96px] font-extrabold tabular-nums sm:text-[128px]">{situacao.diasUteisRestantes}</span>
						<span className="text-[26px] font-bold tracking-tight whitespace-nowrap sm:text-[34px]">dias úteis</span>
					</h1>
					<ReguaDoPrazo hoje={hoje} limiteParaUso={situacao.limiteParaUso} estorno={situacao.estorno} />
					<dl className="grid gap-4 sm:grid-cols-2 border-t border-dashed border-border pt-6">
						<div>
							<dt className="text-[13px] text-muted-foreground">Último dia para usar o saldo</dt>
							<dd className="mt-1 font-heading text-xl font-bold tracking-tight sm:text-[22px]">
								{formatarData(situacao.limiteParaUso)}
							</dd>
						</div>
						<div>
							<dt className="text-[13px] text-muted-foreground">Estorno do que sobrar</dt>
							<dd className="mt-1 font-heading text-xl font-bold tracking-tight text-perigo sm:text-[22px]">
								{formatarData(situacao.estorno)}
							</dd>
						</div>
					</dl>
					<p className="-mt-3 text-xs text-muted-foreground">Regra: {FONTES.prazoDeUso.norma}.</p>
				</>
			)}
		</section>
	);
}

import { formatarDataCurta, listarDiasUteis } from "@aloca/dominio";

type Propriedades = {
	hoje: Date;
	limiteParaUso: Date;
	estorno: Date;
};

export function ReguaDoPrazo({ hoje, limiteParaUso, estorno }: Propriedades) {
	const dias = listarDiasUteis(hoje, limiteParaUso);
	if (dias.length === 0) {
		return null;
	}
	const ultimo = dias.length - 1;
	const viradasDeMes = dias.filter((dia, indice) => indice > 0 && dia.getUTCMonth() !== dias[indice - 1].getUTCMonth());

	return (
		<div>
			<div
				role="img"
				aria-label={`Régua com os ${dias.length} dias úteis entre ${formatarDataCurta(hoje)} e ${formatarDataCurta(limiteParaUso)}`}
				className="flex h-[52px] items-end gap-[3px]"
			>
				{dias.map((dia, indice) => {
					const ponta = indice === 0 || indice === ultimo;
					const viraMes = viradasDeMes.includes(dia);
					const cor =
						indice === 0 ? "bg-tinta" : indice === ultimo ? "bg-cantalupo" : viraMes ? "bg-muted-foreground/60" : "bg-border";
					const altura = ponta ? "h-[52px]" : viraMes ? "h-[34px]" : "h-[22px]";
					return <span key={dia.getTime()} className={`min-w-0 flex-1 rounded-[2px] ${cor} ${altura}`} />;
				})}
				<span className="w-[18px] shrink-0" />
				<span className="h-[52px] w-1 shrink-0 rounded-[2px] bg-[repeating-linear-gradient(var(--perigo)_0_4px,transparent_4px_7px)]" />
			</div>
			<div aria-hidden="true" className="relative mt-2.5 h-[18px] text-xs whitespace-nowrap text-muted-foreground tabular-nums">
				<span className="absolute left-0 font-semibold text-tinta">hoje · {formatarDataCurta(hoje)}</span>
				{viradasDeMes.map((dia) => (
					<span
						key={dia.getTime()}
						className="absolute hidden sm:block"
						style={{ left: `${(dias.indexOf(dia) / dias.length) * 100}%` }}
					>
						{formatarDataCurta(dia)}
					</span>
				))}
				<span className="absolute right-0 font-semibold text-tinta">
					{formatarDataCurta(limiteParaUso)} · <span className="text-perigo">estorno {estorno.getUTCDate()}</span>
				</span>
			</div>
		</div>
	);
}

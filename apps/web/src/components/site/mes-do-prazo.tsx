import { criarData, formatarData, montarMesesDoPrazo, type PrazoDoExercicio } from "@aloca/dominio";
import { cn } from "cn";

const DIAS_DA_SEMANA = ["seg", "ter", "qua", "qui", "sex"];

export function MesDoPrazo({ prazo }: { prazo: PrazoDoExercicio }) {
	const { limiteParaUso, estorno } = prazo;
	const inicio = criarData(limiteParaUso.getUTCFullYear(), limiteParaUso.getUTCMonth() + 1, 1);
	const [mes] = montarMesesDoPrazo({ hoje: inicio, limiteParaUso, estorno });
	const semanas = mes.semanas.map((semana) => semana.slice(1, 6)).filter((semana) => semana.some(Boolean));

	return (
		<figure className="m-0 flex w-full max-w-[460px] flex-col gap-4 rounded-2xl border border-noite-borda p-7">
			<figcaption className="font-semibold">{mes.nome}</figcaption>
			<table className="w-full border-separate border-spacing-2 text-center text-[15px] tabular-nums">
				<thead>
					<tr>
						{DIAS_DA_SEMANA.map((dia) => (
							<th key={dia} scope="col" className="text-xs font-normal text-noite-apagado">
								{dia}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{semanas.map((semana) => (
						<tr key={semana.find(Boolean)?.iso}>
							{semana.map((dia, indice) => (
								<td
									key={dia?.iso ?? indice}
									className={cn(
										"rounded-lg py-2",
										dia && dia.tipo !== "livre" && "bg-noite",
										dia?.tipo === "ultimo" && "bg-cantalupo font-bold text-tinta",
										dia?.tipo === "livre" && "text-noite-apagado",
									)}
								>
									{dia?.dia}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			<p className="m-0 text-sm text-noite-texto">{formatarData(limiteParaUso)}: 10º dia útil e último dia para usar o saldo.</p>
		</figure>
	);
}

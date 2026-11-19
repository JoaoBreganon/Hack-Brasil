import type { DiaDoCalendario, MesDoCalendario, TipoDoDia } from "@aloca/dominio";
import { cn } from "cn";

const DIAS_DA_SEMANA = [
	["D", "domingo"],
	["S", "segunda"],
	["T", "terça"],
	["Q", "quarta"],
	["Q", "quinta"],
	["S", "sexta"],
	["S", "sábado"],
] as const;

const ESTILO_DO_DIA: Record<TipoDoDia, string> = {
	passado: "text-apagado",
	livre: "text-apagado",
	util: "bg-azul-fundo font-semibold text-azul-texto",
	hoje: "font-bold text-foreground ring-[1.5px] ring-foreground ring-inset",
	ultimo: "bg-azul font-bold text-white",
	estorno: "rounded-full font-bold text-perigo ring-2 ring-perigo ring-inset",
};

const DESCRICAO_DO_DIA: Partial<Record<TipoDoDia, string>> = {
	hoje: "hoje",
	util: "dia útil para comprar",
	ultimo: "último dia para usar o saldo",
	estorno: "estorno do que sobrar",
};

function Dia({ dia }: { dia: DiaDoCalendario | null }) {
	if (!dia) {
		return <td />;
	}
	const descricao = DESCRICAO_DO_DIA[dia.tipo];
	return (
		<td className="p-0.5">
			<span
				title={descricao}
				className={cn(
					"mx-auto flex size-8 items-center justify-center rounded-md text-[13px] tabular-nums sm:size-[34px] sm:text-sm",
					ESTILO_DO_DIA[dia.tipo],
				)}
			>
				{dia.dia}
				{descricao && <span className="sr-only">, {descricao}</span>}
			</span>
		</td>
	);
}

function Mes({ mes, soNaTelaGrande }: { mes: MesDoCalendario; soNaTelaGrande: boolean }) {
	return (
		<table className={cn("border-separate border-spacing-0", soNaTelaGrande && "max-sm:hidden")}>
			<caption className="pb-2.5 text-left text-sm font-semibold">{mes.nome}</caption>
			<thead>
				<tr>
					{DIAS_DA_SEMANA.map(([letra, nome], indice) => (
						<th key={indice} scope="col" className="pb-1 text-xs font-normal text-muted-foreground">
							<abbr title={nome} className="no-underline">
								{letra}
							</abbr>
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{mes.semanas.map((semana, indice) => (
					<tr key={indice}>
						{semana.map((dia, posicao) => (
							<Dia key={dia?.iso ?? `vazio-${posicao}`} dia={dia} />
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

export function LegendaDoCalendario() {
	return (
		<ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
			<li className="flex items-center gap-2">
				<span aria-hidden="true" className="size-3.5 rounded bg-azul-fundo" />
				Dia útil para comprar
			</li>
			<li className="flex items-center gap-2">
				<span aria-hidden="true" className="size-3.5 rounded bg-azul" />
				Último dia para usar
			</li>
			<li className="flex items-center gap-2">
				<span aria-hidden="true" className="size-3.5 rounded-full ring-2 ring-perigo ring-inset" />
				Estorno do que sobrar
			</li>
		</ul>
	);
}

export function CalendarioDoPrazo({ meses }: { meses: MesDoCalendario[] }) {
	return (
		<div className="flex flex-wrap items-start gap-x-10 gap-y-6">
			{meses.map((mes, indice) => (
				<Mes key={mes.chave} mes={mes} soNaTelaGrande={indice < meses.length - 1} />
			))}
		</div>
	);
}

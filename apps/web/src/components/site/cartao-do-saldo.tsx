import { ESCOLA_EXEMPLO, formatarReais } from "@aloca/dominio";

const { saldo } = ESCOLA_EXEMPLO;
const TOTAL = saldo.custeio + saldo.capital;
const PARTE_DE_CUSTEIO = `${(saldo.custeio / TOTAL) * 100}%`;

export function CartaoDoSaldo() {
	return (
		<figure className="m-0 flex w-full max-w-[520px] flex-col gap-4 rounded-2xl bg-card p-7 text-foreground">
			<figcaption className="text-sm text-muted-foreground">
				{ESCOLA_EXEMPLO.nome} · INEP {ESCOLA_EXEMPLO.codigoInep}
			</figcaption>
			<p className="m-0 font-heading text-[clamp(40px,4.4vw,60px)] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
				{formatarReais(TOTAL)}
			</p>
			<div aria-hidden="true" className="flex h-3.5 overflow-hidden rounded-full bg-tinta">
				<span className="bg-azul" style={{ width: PARTE_DE_CUSTEIO }} />
			</div>
			<dl className="m-0 flex flex-wrap justify-between gap-3 text-[15px] tabular-nums">
				<div className="flex gap-1.5">
					<dd className="m-0 font-bold">{formatarReais(saldo.custeio)}</dd>
					<dt>custeio</dt>
				</div>
				<div className="flex gap-1.5">
					<dd className="m-0 font-bold">{formatarReais(saldo.capital)}</dd>
					<dt>capital</dt>
				</div>
			</dl>
			<p className="m-0 text-[13px] text-muted-foreground">Saldo real lido no PDDE Info, em {ESCOLA_EXEMPLO.municipio}</p>
		</figure>
	);
}

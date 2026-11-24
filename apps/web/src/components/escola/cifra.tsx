type Propriedades = {
	rotulo: string;
	valor: string;
	apoio: string;
};

export function Cifra({ rotulo, valor, apoio }: Propriedades) {
	return (
		<div className="flex min-w-[180px] flex-1 flex-col px-5 py-4 sm:px-6 sm:py-5">
			<dt className="text-sm text-muted-foreground">{rotulo}</dt>
			<dd className="text-2xl font-bold tabular-nums">{valor}</dd>
			<dd className="text-[13px] text-muted-foreground tabular-nums">{apoio}</dd>
		</div>
	);
}

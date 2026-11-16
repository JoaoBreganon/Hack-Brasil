import type { Fonte } from "@aloca/dominio";

export function RegraCitada({ fonte }: { fonte: Fonte }) {
	return (
		<p className="text-xs text-muted-foreground">
			Regra:{" "}
			<a
				href={fonte.endereco}
				title={fonte.trecho}
				target="_blank"
				rel="noopener noreferrer"
				className="underline-offset-2 hover:underline"
			>
				{fonte.norma}
			</a>
		</p>
	);
}

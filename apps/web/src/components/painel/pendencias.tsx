import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { DadosDoPainel } from "@/hooks/use-painel-da-escola";

const NOME_DA_ENTIDADE = { UEx: "APM (Unidade Executora)", EEx: "Prefeitura ou Secretaria", EM: "Entidade mantenedora" } as const;

export function Pendencias({ pendencias }: { pendencias: NonNullable<DadosDoPainel["saldo"]>["pendencias"] }) {
	if (pendencias.length === 0) {
		return null;
	}
	return (
		<Alert variant="destructive" className="rounded-[20px] border-perigo/30 px-6 py-5">
			<TriangleAlertIcon aria-hidden="true" />
			<AlertTitle className="font-heading text-lg font-bold">
				{pendencias.length === 1 ? "Uma pendência no PDDE Info" : `${pendencias.length} pendências no PDDE Info`}
			</AlertTitle>
			<AlertDescription>
				<p className="text-tinta/80">Pendência pode suspender o próximo repasse. Resolva antes de comprar.</p>
				<ul className="mt-2 flex flex-col gap-1.5">
					{pendencias.map(({ entidade, assunto, mensagem }) => (
						<li key={`${entidade}-${assunto}-${mensagem}`}>
							<strong className="font-semibold">
								{NOME_DA_ENTIDADE[entidade]} · {assunto}:
							</strong>{" "}
							{mensagem}
						</li>
					))}
				</ul>
			</AlertDescription>
		</Alert>
	);
}

import type { OrigemDaSugestao, ResultadoDaSugestao } from "@aloca/dominio";
import { ExternalLinkIcon, ShieldXIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const ORIGEM: Record<OrigemDaSugestao, string> = {
	ia: "Sugestões da IA, conferidas com as regras do PDDE.",
	regras: "Sugestões das regras fixas do PDDE, dentro do saldo livre.",
};

function titulo(adicionados: number): string {
	if (adicionados === 0) {
		return "Nenhum item novo entrou na lista";
	}
	return adicionados === 1 ? "1 item novo entrou na lista" : `${adicionados} itens novos entraram na lista`;
}

export function ResumoDaSugestao({ resultado, aoFechar }: { resultado: ResultadoDaSugestao; aoFechar: () => void }) {
	const { origem, adicionados, bloqueadas, descartadas, aviso } = resultado;
	return (
		<section
			aria-labelledby="titulo-resumo-da-sugestao"
			aria-live="polite"
			className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:p-6"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-0.5">
					<h2 id="titulo-resumo-da-sugestao" className="font-semibold">
						{titulo(adicionados)}
					</h2>
					<p className="text-pretty text-muted-foreground">
						{ORIGEM[origem]}{" "}
						{adicionados > 0
							? "Agora junte os orçamentos de cada item."
							: "O que veio já estava na lista ou não pode ser comprado com o PDDE."}
					</p>
				</div>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={aoFechar}
					aria-label="Fechar o resumo da sugestão"
					className="-mt-1 -mr-2 text-muted-foreground"
				>
					<XIcon />
				</Button>
			</div>
			{aviso && <p className="rounded-lg bg-pilula px-3.5 py-2.5 text-sm">{aviso}</p>}
			{bloqueadas.length > 0 && (
				<div className="flex flex-col">
					<h3 className="flex items-center gap-2 pb-2 text-sm font-semibold text-perigo">
						<ShieldXIcon aria-hidden="true" className="size-4" />
						{bloqueadas.length === 1 ? "1 sugestão barrada" : `${bloqueadas.length} sugestões barradas`} pelas regras do PDDE
					</h3>
					<ul>
						{bloqueadas.map(({ descricao, motivo, fonte }, indice) => (
							<li key={`${indice}-${descricao}`} className="flex flex-col gap-0.5 border-t border-regra py-3">
								<span className="font-medium text-pretty">{descricao}</span>
								<span className="text-sm text-muted-foreground">
									{motivo}.{" "}
									<a
										href={fonte.endereco}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 text-azul-texto hover:underline"
									>
										{fonte.norma}
										<ExternalLinkIcon aria-hidden="true" className="size-3.5 shrink-0" />
										<span className="sr-only">(abre a norma em outra aba)</span>
									</a>
								</span>
							</li>
						))}
					</ul>
				</div>
			)}
			{descartadas > 0 && (
				<p className="text-sm text-muted-foreground">
					{descartadas === 1
						? "1 sugestão repetida ou incompleta foi descartada."
						: `${descartadas} sugestões repetidas ou incompletas foram descartadas.`}
				</p>
			)}
		</section>
	);
}

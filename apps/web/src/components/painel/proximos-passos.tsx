import { ORCAMENTOS_EXIGIDOS, type PlanoDeCompra } from "@aloca/dominio";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";
import { ETAPA_DE_ALERTAS, ETAPAS, enderecoDaEtapa } from "@/config/etapas";
import type { DadosDoPainel } from "@/hooks/use-painel-da-escola";

type Passo = {
	titulo: string;
	detalhe: string;
	feito: boolean;
	caminho: string;
};

type Propriedades = {
	codigoInep: string;
	dados: DadosDoPainel;
	plano: PlanoDeCompra;
};

function montarPassos(dados: DadosDoPainel, plano: PlanoDeCompra): Passo[] {
	const totalDeItens = dados.itens.length;
	const itensProntos = dados.itens.filter(
		({ orcamentos, justificativa }) => orcamentos.length >= ORCAMENTOS_EXIGIDOS || (orcamentos.length > 0 && justificativa),
	).length;
	const aprovado = dados.plano?.status === "aprovado";
	return [
		{
			titulo: "Listar o que a escola precisa",
			detalhe:
				totalDeItens === 0 ? "Nenhum item ainda." : `${totalDeItens} ${totalDeItens === 1 ? "item listado" : "itens listados"}.`,
			feito: totalDeItens > 0,
			caminho: ETAPAS[1].caminho,
		},
		{
			titulo: `Juntar ${ORCAMENTOS_EXIGIDOS} orçamentos por item`,
			detalhe: totalDeItens === 0 ? "Liste os itens primeiro." : `${itensProntos} de ${totalDeItens} itens com orçamentos completos.`,
			feito: totalDeItens > 0 && itensProntos === totalDeItens,
			caminho: ETAPAS[2].caminho,
		},
		{
			titulo: "Aprovar o plano com a APM",
			detalhe: aprovado ? "Plano aprovado." : `${plano.itens.length} itens dentro das regras, esperando aprovação.`,
			feito: aprovado,
			caminho: ETAPAS[3].caminho,
		},
		{
			titulo: "Imprimir a ata e colher as assinaturas",
			detalhe: aprovado ? "A ata está pronta para imprimir." : "Disponível depois da aprovação.",
			feito: false,
			caminho: ETAPAS[4].caminho,
		},
		{
			titulo: "Cadastrar os celulares para o alerta",
			detalhe: "O diretor e o tesoureiro recebem o aviso de prazo.",
			feito: false,
			caminho: ETAPA_DE_ALERTAS.caminho,
		},
	];
}

export function ProximosPassos({ codigoInep, dados, plano }: Propriedades) {
	const passos = montarPassos(dados, plano);
	const proximo = passos.findIndex(({ feito }) => !feito);

	return (
		<section aria-labelledby="titulo-passos" className="flex flex-col gap-4">
			<h2 id="titulo-passos" className="font-heading text-[26px] font-extrabold tracking-tight">
				Do saldo à compra
			</h2>
			<ol className="overflow-hidden rounded-[20px] bg-card shadow-[0_0_0_1px_var(--pauta)]">
				{passos.map((passo, indice) => {
					const atual = indice === proximo;
					return (
						<li key={passo.titulo} className="border-b border-pauta last:border-b-0">
							<Link
								href={enderecoDaEtapa(codigoInep, passo.caminho)}
								className={cn(
									"group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-background sm:px-7",
									atual && "bg-custeio-fundo/60",
								)}
							>
								<span
									aria-hidden="true"
									className={cn(
										"flex size-9 shrink-0 items-center justify-center rounded-full border font-semibold tabular-nums",
										passo.feito
											? "border-transparent bg-tinta text-white"
											: atual
												? "border-primary text-primary"
												: "border-border text-muted-foreground",
									)}
								>
									{passo.feito ? <CheckIcon className="size-4" /> : indice + 1}
								</span>
								<span className="flex min-w-0 flex-1 flex-col gap-0.5">
									<span className="font-semibold">
										{passo.titulo}
										{passo.feito && <span className="sr-only"> (feito)</span>}
									</span>
									<span className="text-sm text-muted-foreground">{passo.detalhe}</span>
								</span>
								<ArrowRightIcon
									aria-hidden="true"
									className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
								/>
							</Link>
						</li>
					);
				})}
			</ol>
		</section>
	);
}

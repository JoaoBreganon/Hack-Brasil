"use client";

import { formatarReais, type LinhaDaRede } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { XIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { enderecoDaArea } from "@/config/navegacao";
import { useOperacao } from "@/hooks/use-operacao";
import { SituacaoDaEscola } from "./situacao-da-escola";

function Valor({ centavos }: { centavos: number | null }) {
	return centavos === null ? <span className="text-apagado">—</span> : <>{formatarReais(centavos)}</>;
}

function LinhaDaEscola({ escola }: { escola: LinhaDaRede }) {
	const remover = useOperacao(useMutation(api.redes.removerEscola));
	const nome = escola.nome ?? `Escola ${escola.codigoInep}`;
	return (
		<tr className="border-t border-regra align-middle tabular-nums">
			<td className="py-3 pr-3 pl-5">
				<Link href={enderecoDaArea(escola.codigoInep, "")} className="font-medium text-foreground hover:underline">
					{nome}
				</Link>
				<span className="block text-[13px] text-muted-foreground">
					{escola.municipio ? `${escola.municipio} · ` : ""}INEP {escola.codigoInep}
					{escola.pendencias > 0 && (
						<span className="text-perigo">
							{" · "}
							{escola.pendencias === 1 ? "1 pendência" : `${escola.pendencias} pendências`}
						</span>
					)}
				</span>
				<span className="mt-1.5 block sm:hidden">
					<SituacaoDaEscola nivel={escola.nivel} />
				</span>
			</td>
			<td className="hidden py-3 pr-3 sm:table-cell">
				<SituacaoDaEscola nivel={escola.nivel} />
			</td>
			<td className="hidden py-3 pr-3 text-right md:table-cell">
				<Valor centavos={escola.saldoTotal} />
			</td>
			<td className="py-3 pr-3 text-right font-semibold">
				<Valor centavos={escola.saldoTotal === null ? null : escola.saldoEmRisco} />
			</td>
			<td className="hidden py-3 pr-3 text-muted-foreground lg:table-cell">
				{escola.totalAprovado !== null ? "Aprovado" : escola.temResponsavel ? "Em montagem" : "Ninguém no Aloca"}
			</td>
			<td className="py-3 pr-3 text-right">
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => remover.executar({ codigoInep: escola.codigoInep })}
					disabled={remover.executando}
					aria-label={`Tirar ${nome} da rede`}
					title="Tirar da rede"
				>
					<XIcon />
				</Button>
			</td>
		</tr>
	);
}

export function TabelaDaRede({ escolas }: { escolas: LinhaDaRede[] }) {
	return (
		<section aria-labelledby="titulo-escolas" className="overflow-hidden rounded-lg border border-border bg-card">
			<h2 id="titulo-escolas" className="px-5 py-4 font-semibold">
				Escolas, da mais urgente para a mais tranquila
			</h2>
			<table className="w-full text-left text-sm">
				<thead className="text-[13px] text-muted-foreground">
					<tr>
						<th scope="col" className="pb-2.5 pl-5 font-normal">
							Escola
						</th>
						<th scope="col" className="hidden pb-2.5 font-normal sm:table-cell">
							Situação
						</th>
						<th scope="col" className="hidden pb-2.5 pr-3 text-right font-normal md:table-cell">
							Saldo
						</th>
						<th scope="col" className="pb-2.5 pr-3 text-right font-normal">
							Em risco
						</th>
						<th scope="col" className="hidden pb-2.5 font-normal lg:table-cell">
							Plano
						</th>
						<th scope="col" className="pb-2.5">
							<span className="sr-only">Ações</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{escolas.map((escola) => (
						<LinhaDaEscola key={escola.codigoInep} escola={escola} />
					))}
				</tbody>
			</table>
		</section>
	);
}

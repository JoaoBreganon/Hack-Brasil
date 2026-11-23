"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { BotaoDaConta } from "@/components/conta/botao-da-conta";
import { enderecoDaArea } from "@/config/navegacao";
import { useConta } from "@/hooks/use-conta";

export function MinhasEscolas() {
	const conta = useConta();
	const escolas = useQuery(api.acessos.minhasEscolas, conta.usuario ? {} : "skip");

	if (!conta.configurada) {
		return null;
	}
	return (
		<div className="flex flex-col gap-3 border-t border-regra pt-6">
			{escolas && escolas.length > 0 && (
				<nav aria-label="Suas escolas" className="flex flex-col gap-1">
					<span className="text-sm font-semibold">Suas escolas</span>
					<ul className="flex flex-col">
						{escolas.map((escola) => (
							<li key={escola.codigoInep}>
								<Link
									href={enderecoDaArea(escola.codigoInep, "")}
									className="flex items-center gap-2 rounded-lg py-2 text-foreground hover:text-azul-texto"
								>
									<span className="flex min-w-0 flex-1 flex-col leading-snug">
										<span className="truncate font-medium">{escola.nome}</span>
										<span className="text-[13px] text-muted-foreground tabular-nums">
											INEP {escola.codigoInep} · {escola.municipio}
										</span>
									</span>
									<ArrowRightIcon aria-hidden="true" className="size-4 shrink-0" />
								</Link>
							</li>
						))}
					</ul>
				</nav>
			)}
			<BotaoDaConta />
		</div>
	);
}

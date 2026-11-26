import type { ReactNode } from "react";
import { ProvedorDoPainel } from "@/hooks/use-painel-da-escola";
import { AvisoDeAcesso } from "./aviso-de-acesso";
import { BarraDaEscola } from "./barra-da-escola";

export function CascaDaEscola({ children }: { children: ReactNode }) {
	return (
		<ProvedorDoPainel>
			<div className="flex min-h-svh flex-col">
				<a
					href="#conteudo"
					className="sr-only rounded-full bg-tinta px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
				>
					Pular para o conteúdo
				</a>
				<BarraDaEscola />
				<main
					id="conteudo"
					className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col gap-6 px-4 pt-2 pb-16 sm:px-6 lg:px-10 print:p-0"
				>
					<AvisoDeAcesso />
					{children}
				</main>
			</div>
		</ProvedorDoPainel>
	);
}

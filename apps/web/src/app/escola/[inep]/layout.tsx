import type { Metadata } from "next";
import { Suspense } from "react";
import { CabecalhoDaEscola } from "@/components/escola/cabecalho-da-escola";
import { ExigeConvex } from "@/components/escola/exige-convex";
import { CarregandoEtapa } from "@/components/escola/painel-carregado";

export const metadata: Metadata = {
	robots: { index: false, follow: false },
};

export default function LayoutDaEscola({ children }: LayoutProps<"/escola/[inep]">) {
	return (
		<ExigeConvex>
			<Suspense>
				<CabecalhoDaEscola />
			</Suspense>
			<main
				id="conteudo"
				className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-10 px-4 pt-8 pb-18 sm:px-8 sm:pt-10 print:p-0"
			>
				<Suspense fallback={<CarregandoEtapa />}>{children}</Suspense>
			</main>
		</ExigeConvex>
	);
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { CascaDaRede } from "@/components/rede/casca-da-rede";
import { TelaDaRede } from "@/components/rede/tela-da-rede";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
	title: "Painel da rede",
	description: "Para a secretaria de educação: saldo do PDDE, risco de estorno e planos aprovados de cada escola da rede.",
	robots: { index: false, follow: false },
};

export default function PaginaDaRede() {
	return (
		<CascaDaRede>
			<Suspense fallback={<Skeleton className="h-96 w-full" />}>
				<TelaDaRede />
			</Suspense>
		</CascaDaRede>
	);
}

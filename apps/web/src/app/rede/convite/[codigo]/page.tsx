import type { Metadata } from "next";
import { Suspense } from "react";
import { CascaDaRede } from "@/components/rede/casca-da-rede";
import { ConviteDaRede } from "@/components/rede/convite-da-rede";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
	title: "Convite para o painel da rede",
	description: "Convite para acompanhar as escolas de uma rede no Aloca.",
	robots: { index: false, follow: false },
};

export default function PaginaDoConviteDaRede() {
	return (
		<CascaDaRede>
			<div className="max-w-xl">
				<Suspense fallback={<Skeleton className="h-40 w-full" />}>
					<ConviteDaRede />
				</Suspense>
			</div>
		</CascaDaRede>
	);
}

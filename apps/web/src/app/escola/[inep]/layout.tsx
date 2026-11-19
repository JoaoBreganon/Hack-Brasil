import type { Metadata } from "next";
import { Suspense } from "react";
import { CascaDaEscola } from "@/components/escola/casca-da-escola";
import { ExigeConvex } from "@/components/escola/exige-convex";
import { Carregando } from "@/components/escola/painel-carregado";

export const metadata: Metadata = {
	robots: { index: false, follow: false },
};

export default function LayoutDaEscola({ children }: LayoutProps<"/escola/[inep]">) {
	return (
		<ExigeConvex>
			<Suspense fallback={<Carregando />}>
				<CascaDaEscola>{children}</CascaDaEscola>
			</Suspense>
		</ExigeConvex>
	);
}

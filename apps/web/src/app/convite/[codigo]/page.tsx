import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TelaDoConvite } from "@/components/convite/tela-do-convite";
import { ExigeConvex } from "@/components/escola/exige-convex";
import { MarcaDoAloca } from "@/components/escola/marca";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
	title: "Convite",
	description: "Convite para cuidar de uma escola no Aloca.",
	robots: { index: false, follow: false },
};

export default function PaginaDoConvite() {
	return (
		<ExigeConvex>
			<main id="conteudo" className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-10 px-5 py-8 sm:px-8">
				<Link href="/" className="flex items-center gap-2.5 self-start text-foreground">
					<MarcaDoAloca className="size-7" />
					<span className="font-heading text-[22px] font-extrabold tracking-tight">{SITE.nome}</span>
				</Link>
				<Suspense fallback={<Skeleton className="h-40 w-full" />}>
					<TelaDoConvite />
				</Suspense>
			</main>
		</ExigeConvex>
	);
}

import Link from "next/link";
import type { ReactNode } from "react";
import { ExigeConvex } from "@/components/escola/exige-convex";
import { MarcaDoAloca } from "@/components/escola/marca";
import { SITE } from "@/config/site";

export function CascaDaRede({ children }: { children: ReactNode }) {
	return (
		<ExigeConvex>
			<main id="conteudo" className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8">
				<nav aria-label="Aloca" className="flex flex-wrap items-center justify-between gap-3">
					<Link href="/" className="flex items-center gap-2.5 text-foreground">
						<MarcaDoAloca className="size-7" />
						<span className="font-heading text-[22px] font-extrabold tracking-tight">{SITE.nome}</span>
					</Link>
					<span className="rounded-full bg-pilula px-3 py-1 text-[13px] font-medium">Secretaria de educação</span>
				</nav>
				{children}
			</main>
		</ExigeConvex>
	);
}

import Link from "next/link";
import type { ReactNode } from "react";
import { ExigeConvex } from "@/components/escola/exige-convex";
import { MarcaDoAloca } from "@/components/escola/marca";
import { SITE } from "@/config/site";

export function CascaDaRede({ children }: { children: ReactNode }) {
	return (
		<ExigeConvex>
			<div className="bg-azul px-5 text-white sm:px-8">
				<nav aria-label="Aloca" className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 py-5">
					<Link href="/" className="flex items-center gap-2.5 text-white">
						<MarcaDoAloca className="size-7" clara />
						<span className="font-heading text-[22px] font-extrabold tracking-tight">{SITE.nome}</span>
					</Link>
					<span className="rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-tinta">Secretaria de educação</span>
				</nav>
			</div>
			<main id="conteudo" className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
				{children}
			</main>
		</ExigeConvex>
	);
}

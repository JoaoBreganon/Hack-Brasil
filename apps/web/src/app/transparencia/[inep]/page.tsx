import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MarcaDoAloca } from "@/components/escola/marca";
import { PaginaDaEscola } from "@/components/transparencia/pagina-da-escola";
import { Skeleton } from "@/components/ui/skeleton";
import { enderecoDaPaginaPublica } from "@/config/navegacao";
import { SITE } from "@/config/site";
import { lerPaginaPublica } from "@/lib/pagina-publica";

type Propriedades = PageProps<"/transparencia/[inep]">;

export async function generateMetadata({ params }: Propriedades): Promise<Metadata> {
	const { inep } = await params;
	const pagina = await lerPaginaPublica(inep);
	if (!pagina) {
		return { title: "Página não encontrada", robots: { index: false, follow: false } };
	}
	const { escola, plano } = pagina;
	const titulo = `PDDE da ${escola.nome}`;
	const descricao = plano
		? `Plano de compra do PDDE de ${plano.exercicio} aprovado pela APM da ${escola.nome}, em ${escola.municipio}: itens, fornecedores e valores.`
		: `Como a ${escola.nome}, em ${escola.municipio}, vai usar o dinheiro do PDDE.`;
	const endereco = enderecoDaPaginaPublica(escola.codigoInep);
	return {
		title: titulo,
		description: descricao,
		alternates: { canonical: endereco },
		openGraph: { type: "article", url: endereco, title: titulo, description: descricao, locale: SITE.localidade, siteName: SITE.nome },
		twitter: { card: "summary_large_image", title: titulo, description: descricao },
	};
}

async function Conteudo({ params }: Pick<Propriedades, "params">) {
	const { inep } = await params;
	const pagina = await lerPaginaPublica(inep);
	if (!pagina) {
		notFound();
	}
	return <PaginaDaEscola pagina={pagina} />;
}

export default function PaginaPublicaDaEscola({ params }: Propriedades) {
	return (
		<main id="conteudo" className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
			<nav aria-label="Aloca" className="flex flex-wrap items-center justify-between gap-3">
				<Link href="/" className="flex items-center gap-2.5 text-foreground">
					<MarcaDoAloca className="size-7" />
					<span className="font-heading text-[22px] font-extrabold tracking-tight">{SITE.nome}</span>
				</Link>
				<span className="rounded-full bg-pilula px-3 py-1 text-[13px] font-medium">Transparência do PDDE</span>
			</nav>
			<Suspense fallback={<Skeleton className="h-96 w-full" />}>
				<Conteudo params={params} />
			</Suspense>
			<footer className="mt-auto border-t border-regra pt-6 text-[13px] text-muted-foreground">
				A escola publicou esta página no{" "}
				<Link href="/" className="font-medium text-foreground hover:underline">
					{SITE.nome}
				</Link>
				, que ajuda a APM a usar o saldo do PDDE antes do prazo.
			</footer>
		</main>
	);
}

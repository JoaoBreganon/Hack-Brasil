import { ESCOLA_EXEMPLO } from "@aloca/dominio";
import type { Metadata } from "next";
import Link from "next/link";
import { ExigeConvex } from "@/components/escola/exige-convex";
import { FormularioDeEntrada } from "@/components/entrar/formulario-de-entrada";
import { enderecoDaEtapa } from "@/config/etapas";
import { SITE } from "@/config/site";

const DESCRICAO = "Digite o código INEP da escola para ver o saldo do PDDE, o prazo de uso e montar o plano de compra antes do estorno.";
const O_QUE_O_ALOCA_LE = ["Saldo das contas do PDDE", "Repasses do ano, com custeio e capital", "Pendências que podem travar o repasse"];

export const metadata: Metadata = {
	title: "Entrar com o código INEP",
	description: DESCRICAO,
	alternates: { canonical: "/entrar" },
	openGraph: { url: "/entrar", title: `Entrar com o código INEP · ${SITE.nome}`, description: DESCRICAO },
};

export default function PaginaDeEntrada() {
	return (
		<ExigeConvex>
			<main
				id="conteudo"
				className="mx-auto grid w-full max-w-[1100px] flex-1 items-center gap-12 px-6 py-14 md:grid-cols-[1.1fr_1fr] md:py-20"
			>
				<div className="flex flex-col gap-6">
					<Link href="/" className="font-heading text-2xl font-extrabold tracking-tight">
						{SITE.nome}
					</Link>
					<h1 className="font-heading text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl">
						Qual é a sua escola?
					</h1>
					<p className="max-w-md text-lg text-pretty text-muted-foreground">
						O Aloca busca os dados públicos da escola no PDDE Info, do FNDE. Não precisa de senha nem de cadastro.
					</p>
					<ul className="flex flex-col gap-2 text-[15px]">
						{O_QUE_O_ALOCA_LE.map((item) => (
							<li key={item} className="flex items-center gap-3">
								<span aria-hidden="true" className="size-2 rounded-full bg-cantalupo" />
								{item}
							</li>
						))}
					</ul>
				</div>
				<div className="flex flex-col gap-6 rounded-[24px] bg-card p-6 shadow-[0_0_0_1px_var(--pauta),0_24px_48px_-28px_rgb(11_15_28/0.3)] sm:p-9">
					<FormularioDeEntrada />
					<p className="border-t border-dashed border-border pt-5 text-sm text-muted-foreground">
						Só quer conhecer?{" "}
						<Link
							href={enderecoDaEtapa(ESCOLA_EXEMPLO.codigoInep, "")}
							className="font-semibold text-primary underline-offset-2 hover:underline"
						>
							Abra a {ESCOLA_EXEMPLO.nome}, de {ESCOLA_EXEMPLO.municipio}
						</Link>
						.
					</p>
				</div>
			</main>
		</ExigeConvex>
	);
}

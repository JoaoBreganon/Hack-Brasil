import { ESCOLA_EXEMPLO, HOJE_SIMULADO, montarMesesDoPrazo, prazoDoExercicio, EXERCICIO_SIMULADO } from "@aloca/dominio";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarioDoPrazo, LegendaDoCalendario } from "@/components/calendario/calendario-do-prazo";
import { FormularioDeEntrada } from "@/components/entrar/formulario-de-entrada";
import { MinhasEscolas } from "@/components/entrar/minhas-escolas";
import { ExigeConvex } from "@/components/escola/exige-convex";
import { MarcaDoAloca } from "@/components/escola/marca";
import { enderecoDaArea } from "@/config/navegacao";
import { SITE } from "@/config/site";

const DESCRICAO = "Digite o código INEP da escola para ver o saldo do PDDE, o prazo de uso e montar o plano de compra antes do estorno.";
const PRAZO = prazoDoExercicio(EXERCICIO_SIMULADO);
const MES_DO_PRAZO = PRAZO
	? montarMesesDoPrazo({ hoje: HOJE_SIMULADO, limiteParaUso: PRAZO.limiteParaUso, estorno: PRAZO.estorno }).slice(-1)
	: [];

export const metadata: Metadata = {
	title: "Entrar com o código INEP",
	description: DESCRICAO,
	alternates: { canonical: "/entrar" },
	openGraph: { url: "/entrar", title: `Entrar com o código INEP · ${SITE.nome}`, description: DESCRICAO },
};

export default function PaginaDeEntrada() {
	return (
		<ExigeConvex>
			<div className="flex min-h-svh flex-wrap">
				<main id="conteudo" className="flex flex-[1_1_420px] flex-col px-5 py-8 sm:px-12 lg:px-16">
					<Link href="/" className="flex items-center gap-2.5 self-start text-foreground">
						<MarcaDoAloca className="size-7" />
						<span className="font-heading text-[22px] font-extrabold tracking-tight">{SITE.nome}</span>
					</Link>
					<div className="flex w-full max-w-[380px] flex-1 flex-col justify-center gap-6 py-14">
						<div className="flex flex-col gap-2">
							<h1 className="font-heading text-[34px] leading-tight font-extrabold tracking-tight">Qual é a sua escola?</h1>
							<p className="text-muted-foreground">
								Digite o código INEP para ver o saldo no PDDE Info. Para montar o plano da escola, entre com sua conta.
							</p>
						</div>
						<FormularioDeEntrada />
						<Link
							href={enderecoDaArea(ESCOLA_EXEMPLO.codigoInep, "")}
							className="self-start text-sm font-semibold text-azul-texto hover:underline"
						>
							Abrir a escola de demonstração
						</Link>
						<Link href="/rede" className="self-start text-sm font-semibold text-azul-texto hover:underline">
							É da secretaria de educação? Abra o painel da rede
						</Link>
						<MinhasEscolas />
					</div>
				</main>
				{MES_DO_PRAZO.length > 0 && (
					<aside
						aria-label="O prazo do PDDE"
						className="flex flex-[1_1_420px] items-center justify-center bg-azul px-5 py-12 text-white sm:px-12"
					>
						<div className="flex max-w-[400px] flex-col gap-8">
							<p className="font-heading text-[clamp(40px,4.4vw,64px)] leading-[0.92] font-extrabold tracking-[-0.05em] text-balance">
								O saldo da escola tem prazo.
							</p>
							<div className="flex flex-col gap-4 rounded-2xl bg-card p-5 text-foreground">
								<CalendarioDoPrazo meses={MES_DO_PRAZO} />
								<LegendaDoCalendario />
							</div>
						</div>
					</aside>
				)}
			</div>
		</ExigeConvex>
	);
}

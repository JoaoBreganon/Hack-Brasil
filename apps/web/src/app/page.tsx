import { ESCOLA_EXEMPLO, prazoDoExercicio } from "@aloca/dominio";
import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoDoSite } from "@/components/site/cabecalho-do-site";
import { Capitulo } from "@/components/site/capitulo";
import { CartaoDoSaldo } from "@/components/site/cartao-do-saldo";
import { MapaDePrecos } from "@/components/site/mapa-de-precos";
import { MesDoPrazo } from "@/components/site/mes-do-prazo";
import { enderecoDaArea } from "@/config/navegacao";
import { SITE } from "@/config/site";

const PRIMEIRO_EXERCICIO = 2027;
const PRAZO = prazoDoExercicio(PRIMEIRO_EXERCICIO);
const TITULO = "Aloca: o saldo do PDDE da escola tem prazo";

export const metadata: Metadata = {
	title: { absolute: TITULO },
	description: SITE.descricao,
	alternates: { canonical: "/" },
	openGraph: { type: "website", url: "/", title: TITULO, description: SITE.descricao, locale: SITE.localidade, siteName: SITE.nome },
	twitter: { card: "summary_large_image", title: TITULO, description: SITE.descricao },
};

const NA_SECRETARIA = [
	{
		titulo: "Painel da rede",
		texto: "O saldo de cada escola, o que está em risco de estorno e quem já aprovou o plano, da mais urgente para a mais tranquila.",
	},
	{ titulo: "Planilha do plano", texto: "O plano aprovado sai em planilha, com os três orçamentos de cada item." },
	{ titulo: "Prestação de contas", texto: "Continua no sistema do FNDE. O Aloca cuida do que vem antes: decidir e comprar a tempo." },
];

export default function Inicio() {
	return (
		<main id="conteudo" className="flex flex-1 flex-col">
			<section aria-labelledby="titulo-inicio" className="flex min-h-svh flex-col bg-azul px-5 text-white sm:px-10 lg:px-16">
				<CabecalhoDoSite />
				<div className="flex flex-1 flex-col justify-end gap-8 pt-16 pb-12 sm:pb-20 lg:pb-24">
					<p className="m-0 text-[15px] font-semibold tracking-[0.06em] uppercase">
						PDDE · a partir do exercício de {PRIMEIRO_EXERCICIO}
					</p>
					<h1
						id="titulo-inicio"
						className="max-w-[12ch] font-heading text-[clamp(56px,10vw,168px)] leading-[0.92] font-extrabold tracking-[-0.05em]"
					>
						O saldo da escola tem prazo.
					</h1>
					<div className="flex flex-wrap items-end justify-between gap-6">
						<p className="m-0 max-w-[560px] text-[clamp(18px,1.5vw,22px)] leading-snug text-pretty">
							O que não for usado até o 10º dia útil de fevereiro volta para o governo. O Aloca conduz a escola pelos três
							meses até lá.
						</p>
						<p className="m-0 font-heading text-[22px] font-bold">Dezembro → Janeiro → Fevereiro</p>
					</div>
				</div>
			</section>

			<Capitulo
				id="dezembro"
				rotulo="Capítulo 1"
				titulo="Dezembro"
				texto="A escola descobre quanto tem. O Aloca lê o saldo e as pendências no PDDE Info pelo código INEP."
				className="bg-cantalupo text-tinta"
			>
				<CartaoDoSaldo />
			</Capitulo>

			<Capitulo
				id="janeiro"
				rotulo="Capítulo 2"
				titulo="Janeiro"
				texto="A APM escolhe e aprova. Cada item sai do menor de três orçamentos, e a ata chega pronta para assinar."
				className="bg-background text-tinta"
			>
				<MapaDePrecos />
			</Capitulo>

			{PRAZO && (
				<Capitulo
					id="fevereiro"
					rotulo="Capítulo 3"
					titulo="Fevereiro"
					texto="O dinheiro já virou compra. Alertas por WhatsApp e e-mail avisam diretor e tesoureiro antes do último dia."
					className="bg-tinta text-white"
					classeDoRotulo="text-cantalupo"
				>
					<MesDoPrazo prazo={PRAZO} />
				</Capitulo>
			)}

			<section
				id="secretaria"
				aria-labelledby="titulo-secretaria"
				className="flex flex-col justify-between gap-12 bg-azul-fundo px-5 py-14 text-tinta min-h-svh sm:px-10 sm:py-20 lg:px-16 lg:py-24"
			>
				<div className="flex flex-col gap-5">
					<span className="text-[15px] font-semibold">E a secretaria</span>
					<h2
						id="titulo-secretaria"
						className="max-w-[14ch] font-heading text-[clamp(48px,7.5vw,120px)] leading-[0.92] font-extrabold tracking-[-0.05em]"
					>
						Acompanha a rede inteira.
					</h2>
				</div>
				<div className="grid gap-8 text-[17px] sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
					{NA_SECRETARIA.map(({ titulo, texto }) => (
						<div key={titulo} className="border-t-2 border-tinta pt-4">
							<h3 className="m-0 mb-2 text-[22px] font-semibold">{titulo}</h3>
							<p className="m-0 text-pretty text-tinta/85">{texto}</p>
						</div>
					))}
				</div>
				<Link href="/rede" className="self-start font-semibold text-azul-texto hover:underline">
					Abrir o painel da rede
				</Link>
			</section>

			<section
				aria-labelledby="titulo-comecar"
				className="flex min-h-svh flex-col gap-8 bg-azul px-5 pt-14 pb-8 text-white sm:px-10 sm:pt-24 lg:px-16"
			>
				<h2
					id="titulo-comecar"
					className="max-w-[16ch] font-heading text-[clamp(40px,6vw,96px)] leading-[0.95] font-extrabold tracking-[-0.045em]"
				>
					Em que capítulo está a sua escola?
				</h2>
				<div className="flex flex-wrap gap-3">
					<Link
						href="/entrar"
						className="inline-flex h-14 items-center gap-2.5 rounded-full bg-tinta px-7 text-[17px] font-semibold text-white hover:bg-noite"
					>
						Buscar pelo código INEP
						<ArrowRightIcon aria-hidden="true" className="size-5" />
					</Link>
					<Link
						href={enderecoDaArea(ESCOLA_EXEMPLO.codigoInep, "")}
						className="inline-flex h-14 items-center rounded-full border-2 border-white px-7 text-[17px] font-semibold text-white hover:bg-white hover:text-tinta"
					>
						Ver a escola de demonstração
					</Link>
				</div>
				<footer className="mt-auto flex flex-wrap justify-between gap-4 border-t border-white/35 pt-5 text-sm">
					<span>{SITE.nome} · Hack Brasil 2026, trilha Acesso à educação</span>
					<span>Dados públicos do PDDE Info (FNDE)</span>
				</footer>
			</section>
		</main>
	);
}

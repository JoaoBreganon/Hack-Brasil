import { formatarData, prazoDoExercicio } from "@aloca/dominio";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE } from "@/config/site";

const PRIMEIRO_EXERCICIO = 2027;
const PRAZO = prazoDoExercicio(PRIMEIRO_EXERCICIO);

export default function Inicio() {
	return (
		<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-12 px-6 py-20">
			<header>
				<p className="font-heading text-sm font-bold tracking-[0.2em] text-primary uppercase">{SITE.nome}</p>
				<h1 className="mt-4 font-heading text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl">
					Nenhuma escola perde o que <span className="bg-accent px-1">já é dela</span>.
				</h1>
				<p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">{SITE.descricao}</p>
				<Link
					href="/plano"
					className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
				>
					Ver o plano da escola exemplo
				</Link>
			</header>

			{PRAZO && (
				<Card>
					<CardHeader>
						<Badge variant="secondary">Regra nova do FNDE</Badge>
						<CardTitle className="mt-2 font-heading text-2xl font-bold">
							O saldo de {PRIMEIRO_EXERCICIO} tem data para acabar
						</CardTitle>
						<CardDescription>O que não for usado até o 10º dia útil de fevereiro volta para o governo.</CardDescription>
					</CardHeader>
					<CardContent>
						<dl className="grid gap-4 sm:grid-cols-2">
							<div>
								<dt className="text-sm text-muted-foreground">Último dia para usar</dt>
								<dd className="font-heading text-2xl font-bold">{formatarData(PRAZO.limiteParaUso)}</dd>
							</div>
							<div>
								<dt className="text-sm text-muted-foreground">Estorno do saldo</dt>
								<dd className="font-heading text-2xl font-bold">{formatarData(PRAZO.estorno)}</dd>
							</div>
						</dl>
					</CardContent>
				</Card>
			)}
		</main>
	);
}

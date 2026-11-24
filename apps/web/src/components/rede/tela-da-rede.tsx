"use client";

import { formatarData, formatarReais } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { LogInIcon } from "lucide-react";
import type { ReactNode } from "react";
import { LinkDeConvite } from "@/components/conta/link-de-convite";
import { Cifra } from "@/components/escola/cifra";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useConta } from "@/hooks/use-conta";
import { enderecoDeEntrada } from "@/lib/conta";
import { AdicionarEscolas } from "./adicionar-escolas";
import { CriarRede } from "./criar-rede";
import { TabelaDaRede } from "./tabela-da-rede";

function Cabecalho({ titulo, frase }: { titulo: string; frase: ReactNode }) {
	return (
		<header className="flex flex-col gap-1">
			<h1 className="font-heading text-[30px] leading-tight font-extrabold tracking-tight text-balance">{titulo}</h1>
			<p className="max-w-2xl text-pretty text-muted-foreground">{frase}</p>
		</header>
	);
}

function Painel({ dados }: { dados: NonNullable<FunctionReturnType<typeof api.redes.minha>> }) {
	const criarConvite = useMutation(api.redes.criarConvite);
	const { resumo, prazo } = dados;
	return (
		<>
			<Cabecalho
				titulo={dados.rede.nome}
				frase={
					prazo
						? `O saldo do PDDE precisa ser usado até ${formatarData(new Date(prazo.limiteParaUso))}. Faltam ${prazo.diasUteis} dias úteis.`
						: "O exercício simulado ainda não tem prazo de estorno."
				}
			/>
			<dl className="flex flex-wrap rounded-lg border border-border bg-card">
				<Cifra
					rotulo="Saldo das escolas"
					valor={formatarReais(resumo.saldoTotal)}
					apoio={`${resumo.escolas} ${resumo.escolas === 1 ? "escola" : "escolas"}`}
				/>
				<Cifra
					rotulo="Em risco de estorno"
					valor={formatarReais(resumo.saldoEmRisco)}
					apoio={`${resumo.precisamAgir} ${resumo.precisamAgir === 1 ? "escola precisa" : "escolas precisam"} agir`}
				/>
				<Cifra
					rotulo="Planos aprovados"
					valor={`${resumo.comPlanoAprovado} de ${resumo.escolas}`}
					apoio="pela APM de cada escola"
				/>
			</dl>
			{dados.escolas.length > 0 ? (
				<TabelaDaRede escolas={dados.escolas} />
			) : (
				<Empty className="rounded-lg border border-border bg-card py-12">
					<EmptyHeader>
						<EmptyTitle className="text-lg font-semibold">A rede ainda não tem escolas</EmptyTitle>
						<EmptyDescription>Cole abaixo os códigos INEP das escolas que a secretaria acompanha.</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
			<div className="flex flex-wrap items-start gap-6">
				<AdicionarEscolas />
				<LinkDeConvite
					descricao={`Chame colegas da secretaria para ver este painel. Hoje: ${dados.membros.map(({ nome, souEu }) => (souEu ? `${nome} (você)` : nome)).join(", ")}.`}
					criar={() => criarConvite({})}
					caminho={(codigo) => `/rede/convite/${codigo}`}
				/>
			</div>
		</>
	);
}

export function TelaDaRede() {
	const conta = useConta();
	const dados = useQuery(api.redes.minha, conta.usuario ? {} : "skip");

	if (!conta.configurada) {
		return <Cabecalho titulo="Painel da rede" frase="O painel da secretaria precisa do login, que não está ligado neste ambiente." />;
	}
	if (conta.carregando || (conta.usuario && dados === undefined)) {
		return <Skeleton className="h-96 w-full" />;
	}
	if (!conta.usuario) {
		return (
			<>
				<Cabecalho
					titulo="Painel da rede"
					frase="Para a secretaria de educação: o saldo do PDDE de cada escola da rede, o que está em risco de estorno e quem já aprovou o plano de compra."
				/>
				<a href={enderecoDeEntrada("/rede")} className={buttonVariants({ size: "lg", className: "self-start" })}>
					<LogInIcon data-icon="inline-start" />
					Entrar com sua conta
				</a>
			</>
		);
	}
	if (!dados) {
		return (
			<>
				<Cabecalho
					titulo="Crie o painel da sua rede"
					frase="Acompanhe as escolas da secretaria num lugar só. Se um colega já criou o painel, peça a ele um link de convite."
				/>
				<CriarRede seuNome={conta.usuario.nome} />
			</>
		);
	}
	return <Painel dados={dados} />;
}

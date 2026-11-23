"use client";

import { formatarData } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { CopyIcon, LinkIcon, UserMinusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CabecalhoDaPagina } from "@/components/escola/cabecalho-da-pagina";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useOperacao } from "@/hooks/use-operacao";

function LinhaDoMembro({
	membro,
	podeRemover,
}: {
	membro: { _id: Id<"membro">; nome: string; entrouEm: number; souEu: boolean };
	podeRemover: boolean;
}) {
	const remover = useOperacao(useMutation(api.acessos.removerMembro));
	const rotulo = membro.souEu ? "Sair da escola" : `Tirar ${membro.nome} da escola`;
	return (
		<li className="flex items-center gap-3 border-t border-regra px-5 py-3">
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="truncate font-medium">
					{membro.nome}
					{membro.souEu && <span className="font-normal text-muted-foreground"> (você)</span>}
				</span>
				<span className="text-[13px] text-muted-foreground">Desde {formatarData(new Date(membro.entrouEm))}</span>
			</span>
			{podeRemover && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => remover.executar({ membroId: membro._id })}
					disabled={remover.executando}
					aria-label={rotulo}
					className="text-perigo hover:text-perigo"
				>
					{remover.executando ? <Spinner data-icon="inline-start" /> : <UserMinusIcon data-icon="inline-start" />}
					{membro.souEu ? "Sair" : "Tirar"}
				</Button>
			)}
		</li>
	);
}

function Membros({ codigoInep }: { codigoInep: string }) {
	const membros = useQuery(api.acessos.membros, { codigoInep });
	return (
		<section
			aria-labelledby="titulo-membros"
			className="flex min-w-0 flex-[1_1_360px] flex-col overflow-hidden rounded-lg border border-border bg-card"
		>
			<div className="px-5 py-4">
				<h2 id="titulo-membros" className="font-semibold">
					Quem cuida
				</h2>
				<p className="text-sm text-muted-foreground">Estas pessoas podem mudar o plano, os celulares e os alertas.</p>
			</div>
			{membros === undefined ? (
				<Skeleton className="mx-5 mb-5 h-20" />
			) : (
				<ul>
					{membros.map((membro) => (
						<LinhaDoMembro key={membro._id} membro={membro} podeRemover={membros.length > 1} />
					))}
				</ul>
			)}
		</section>
	);
}

function Convite({ codigoInep }: { codigoInep: string }) {
	const criar = useOperacao(useMutation(api.acessos.criarConvite));
	const [endereco, setEndereco] = useState<string | null>(null);

	async function criarConvite() {
		const codigo = await criar.executar({ codigoInep });
		if (codigo) {
			setEndereco(`${window.location.origin}/convite/${codigo}`);
		}
	}

	async function copiar() {
		if (!endereco) {
			return;
		}
		try {
			await navigator.clipboard.writeText(endereco);
			toast.success("Link copiado.");
		} catch {
			toast.error("Não deu para copiar. Selecione o link e copie à mão.");
		}
	}

	return (
		<section
			aria-labelledby="titulo-convite"
			className="flex min-w-0 flex-[1_1_360px] flex-col gap-4 rounded-lg border border-border bg-card p-5"
		>
			<div className="flex flex-col gap-0.5">
				<h2 id="titulo-convite" className="font-semibold">
					Convidar alguém
				</h2>
				<p className="text-sm text-pretty text-muted-foreground">
					Mande o link para quem também cuida do PDDE, como o tesoureiro da APM. Ele vale por 7 dias e para uma pessoa só.
				</p>
			</div>
			{endereco && (
				<div className="flex gap-2">
					<Input readOnly value={endereco} aria-label="Link do convite" onFocus={(evento) => evento.target.select()} />
					<Button variant="secondary" size="icon" onClick={copiar} aria-label="Copiar o link" title="Copiar o link">
						<CopyIcon />
					</Button>
				</div>
			)}
			<Button onClick={criarConvite} disabled={criar.executando} className="self-start">
				{criar.executando ? <Spinner data-icon="inline-start" /> : <LinkIcon data-icon="inline-start" />}
				{endereco ? "Criar outro link" : "Criar link de convite"}
			</Button>
		</section>
	);
}

export function TelaDePessoas() {
	return (
		<PainelCarregado>
			{({ codigoInep, dados }) => (
				<>
					<CabecalhoDaPagina titulo="Quem cuida" frase="As pessoas que podem mudar os dados desta escola no Aloca." />
					{dados.acesso.demonstracao ? (
						<p className="rounded-lg bg-pilula px-4 py-3">
							A escola de demonstração é aberta para todos e não tem quem cuide dela.
						</p>
					) : dados.acesso.membro ? (
						<div className="flex flex-wrap items-start gap-6">
							<Membros codigoInep={codigoInep} />
							<Convite codigoInep={codigoInep} />
						</div>
					) : (
						<p className="rounded-lg bg-pilula px-4 py-3">Só quem cuida desta escola no Aloca vê esta lista.</p>
					)}
				</>
			)}
		</PainelCarregado>
	);
}

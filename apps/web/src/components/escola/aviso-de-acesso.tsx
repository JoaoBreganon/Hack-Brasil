"use client";

import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowLeftIcon, LogInIcon, RotateCcwIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useConta } from "@/hooks/use-conta";
import { useOperacao } from "@/hooks/use-operacao";
import { usePainelDaEscola } from "@/hooks/use-painel-da-escola";
import { enderecoDeEntrada } from "@/lib/conta";

function Aviso({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
	return (
		<div role="note" className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-pilula py-3 pr-3 pl-5 print:hidden">
			<p className="flex-[1_1_320px] text-pretty">{children}</p>
			{acao}
		</div>
	);
}

function RecomecarDemonstracao() {
	const recomecar = useOperacao(useMutation(api.demonstracao.recomecar));

	async function executar() {
		if ((await recomecar.executar({})) !== undefined) {
			toast.success("A demonstração voltou ao começo.");
		}
	}

	return (
		<Button variant="secondary" onClick={executar} disabled={recomecar.executando}>
			{recomecar.executando ? <Spinner data-icon="inline-start" /> : <RotateCcwIcon data-icon="inline-start" />}
			Recomeçar a demonstração
		</Button>
	);
}

function AssumirEscola({ codigoInep, nome }: { codigoInep: string; nome: string }) {
	const assumir = useOperacao(useMutation(api.acessos.assumir));

	async function executar() {
		if ((await assumir.executar({ codigoInep, nome })) !== undefined) {
			toast.success("Pronto. Agora você cuida desta escola no Aloca.");
		}
	}

	return (
		<Button onClick={executar} disabled={assumir.executando}>
			{assumir.executando ? <Spinner data-icon="inline-start" /> : <ShieldCheckIcon data-icon="inline-start" />}
			Assumir a escola
		</Button>
	);
}

export function AvisoDeAcesso() {
	const { codigoInep, dados } = usePainelDaEscola();
	const conta = useConta();
	const caminhoAtual = usePathname();

	if (!dados) {
		return null;
	}
	const { acesso } = dados;
	if (acesso.demonstracao) {
		return (
			<Aviso
				acao={
					<div className="flex flex-wrap gap-2">
						<RecomecarDemonstracao />
						<Link href="/" className={buttonVariants({ variant: "ghost" })}>
							<ArrowLeftIcon data-icon="inline-start" />
							Sair da demonstração
						</Link>
					</div>
				}
			>
				Escola de demonstração: qualquer pessoa pode testar o plano aqui, sem conta. Ele volta ao começo depois de uma hora parado.
			</Aviso>
		);
	}
	if (acesso.podeEditar) {
		return null;
	}
	if (!conta.configurada) {
		return <Aviso>Só leitura. O login não está ligado neste ambiente, então só a escola de demonstração aceita mudanças.</Aviso>;
	}
	if (!acesso.entrou) {
		return (
			<Aviso
				acao={
					<a href={enderecoDeEntrada(caminhoAtual)} className={buttonVariants()}>
						<LogInIcon data-icon="inline-start" />
						Entrar com sua conta
					</a>
				}
			>
				Só leitura. Para montar o plano, cadastrar contatos e mandar alertas desta escola, entre com sua conta.
			</Aviso>
		);
	}
	if (!acesso.temResponsavel) {
		return (
			<Aviso acao={<AssumirEscola codigoInep={codigoInep} nome={conta.usuario?.nome ?? ""} />}>
				Esta escola ainda não tem quem cuide dela no Aloca. Se você é da direção ou da APM, assuma a escola para montar o plano.
			</Aviso>
		);
	}
	return <Aviso>Só leitura. Esta escola já tem quem cuide dela no Aloca. Peça um convite a essa pessoa para participar.</Aviso>;
}

"use client";

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { LogInIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { enderecoDaArea } from "@/config/navegacao";
import { useConta } from "@/hooks/use-conta";
import { useOperacao } from "@/hooks/use-operacao";
import { enderecoDeEntrada } from "@/lib/conta";

function Quadro({ titulo, children }: { titulo: string; children?: ReactNode }) {
	return (
		<div className="flex flex-col gap-4">
			<h1 className="font-heading text-[30px] leading-tight font-extrabold tracking-tight text-balance">{titulo}</h1>
			{children}
		</div>
	);
}

export function TelaDoConvite() {
	const { codigo } = useParams<{ codigo: string }>();
	const roteador = useRouter();
	const conta = useConta();
	const convite = useQuery(api.acessos.convite, { codigo });
	const aceitar = useOperacao(useMutation(api.acessos.aceitarConvite));

	async function aceitarConvite() {
		const codigoInep = await aceitar.executar({ codigo, nome: conta.usuario?.nome ?? "" });
		if (codigoInep) {
			toast.success("Pronto. Agora você também cuida desta escola no Aloca.");
			roteador.push(enderecoDaArea(codigoInep, ""));
		}
	}

	if (convite === undefined || conta.carregando) {
		return <Skeleton className="h-40 w-full" />;
	}
	if (!convite || !convite.valido) {
		return (
			<Quadro titulo={convite ? "Este convite venceu" : "Não achamos este convite"}>
				<p className="text-muted-foreground">
					{convite ? "Convites valem por 7 dias." : "Ele pode já ter sido usado."} Peça um link novo a quem cuida da escola.
				</p>
				<Link href="/entrar" className="self-start font-semibold text-azul-texto hover:underline">
					Ir para o início
				</Link>
			</Quadro>
		);
	}
	return (
		<Quadro titulo={`Convite para cuidar da ${convite.nomeDaEscola}`}>
			<p className="text-pretty text-muted-foreground">
				Ao aceitar, você pode montar o plano de compra, cadastrar celulares e mandar alertas da escola {convite.codigoInep} no
				Aloca.
			</p>
			{!conta.configurada ? (
				<p className="text-muted-foreground">O login não está ligado neste ambiente.</p>
			) : conta.usuario ? (
				<Button size="lg" onClick={aceitarConvite} disabled={aceitar.executando} className="self-start">
					{aceitar.executando ? <Spinner data-icon="inline-start" /> : <ShieldCheckIcon data-icon="inline-start" />}
					Aceitar o convite
				</Button>
			) : (
				<a href={enderecoDeEntrada(`/convite/${codigo}`)} className={buttonVariants({ size: "lg", className: "self-start" })}>
					<LogInIcon data-icon="inline-start" />
					Entrar para aceitar
				</a>
			)}
		</Quadro>
	);
}

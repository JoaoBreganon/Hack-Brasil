"use client";

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { LogInIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useConta } from "@/hooks/use-conta";
import { useOperacao } from "@/hooks/use-operacao";
import { enderecoDeEntrada } from "@/lib/conta";

export function ConviteDaRede() {
	const { codigo } = useParams<{ codigo: string }>();
	const roteador = useRouter();
	const conta = useConta();
	const convite = useQuery(api.redes.convite, { codigo });
	const aceitar = useOperacao(useMutation(api.redes.aceitarConvite));

	async function aceitarConvite() {
		if ((await aceitar.executar({ codigo, nome: conta.usuario?.nome ?? "" })) !== undefined) {
			toast.success("Pronto. Agora você vê o painel da rede.");
			roteador.push("/rede");
		}
	}

	if (convite === undefined || conta.carregando) {
		return <Skeleton className="h-40 w-full" />;
	}
	return (
		<div className="flex flex-col gap-4">
			<h1 className="font-heading text-[30px] leading-tight font-extrabold tracking-tight text-balance">
				{convite?.valido
					? `Convite para o painel da ${convite.nomeDaRede}`
					: convite
						? "Este convite venceu"
						: "Não achamos este convite"}
			</h1>
			{!convite?.valido ? (
				<>
					<p className="text-muted-foreground">
						Convites valem por 7 dias e para uma pessoa só. Peça um link novo a quem está na rede.
					</p>
					<Link href="/rede" className="self-start font-semibold text-azul-texto hover:underline">
						Ir para o painel da rede
					</Link>
				</>
			) : !conta.configurada ? (
				<p className="text-muted-foreground">O login não está ligado neste ambiente.</p>
			) : conta.usuario ? (
				<Button size="lg" onClick={aceitarConvite} disabled={aceitar.executando} className="self-start">
					{aceitar.executando ? <Spinner data-icon="inline-start" /> : <ShieldCheckIcon data-icon="inline-start" />}
					Aceitar o convite
				</Button>
			) : (
				<a href={enderecoDeEntrada(`/rede/convite/${codigo}`)} className={buttonVariants({ size: "lg", className: "self-start" })}>
					<LogInIcon data-icon="inline-start" />
					Entrar para aceitar
				</a>
			)}
		</div>
	);
}

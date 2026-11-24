"use client";

import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { ExternalLinkIcon, GlobeIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { enderecoDaPaginaPublica } from "@/config/navegacao";
import { useOperacao } from "@/hooks/use-operacao";

type Propriedades = {
	codigoInep: string;
	publicada: boolean;
	demonstracao: boolean;
	membro: boolean;
};

export function PaginaPublica({ codigoInep, publicada, demonstracao, membro }: Propriedades) {
	const publicar = useOperacao(useMutation(api.transparencia.publicar));
	const noAr = publicada || demonstracao;
	const podeMudar = membro && !demonstracao;

	if (!noAr && !podeMudar) {
		return null;
	}

	async function alternar() {
		if ((await publicar.executar({ codigoInep, publicar: !publicada })) !== undefined) {
			toast.success(publicada ? "A página saiu do ar." : "Página publicada. Mande o link para a comunidade.");
		}
	}

	return (
		<section
			aria-labelledby="titulo-pagina-publica"
			className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4"
		>
			<div className="flex min-w-0 flex-col gap-0.5">
				<h2 id="titulo-pagina-publica" className="font-semibold">
					Página pública
				</h2>
				<p className="text-sm text-pretty text-muted-foreground">
					{noAr
						? "Pais e comunidade veem o plano aprovado pela APM, sem precisar de conta."
						: "Mostre aos pais e à comunidade o plano aprovado pela APM."}
				</p>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				{noAr && (
					<Link
						href={enderecoDaPaginaPublica(codigoInep)}
						target="_blank"
						rel="noopener"
						className={buttonVariants({ variant: "secondary" })}
					>
						Abrir a página
						<ExternalLinkIcon data-icon="inline-end" />
					</Link>
				)}
				{podeMudar && (
					<Button variant={publicada ? "ghost" : "secondary"} onClick={alternar} disabled={publicar.executando}>
						{publicar.executando ? <Spinner data-icon="inline-start" /> : <GlobeIcon data-icon="inline-start" />}
						{publicada ? "Tirar do ar" : "Publicar a página"}
					</Button>
				)}
			</div>
		</section>
	);
}

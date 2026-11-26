"use client";

import { LogInIcon, LogOutIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConta } from "@/hooks/use-conta";
import { enderecoDeEntrada } from "@/lib/conta";

export function BotaoDaConta() {
	const { configurada, carregando, usuario } = useConta();
	const caminhoAtual = usePathname();

	if (!configurada) {
		return null;
	}
	if (carregando) {
		return <Skeleton className="h-10 w-full" />;
	}
	if (!usuario) {
		return (
			<a href={enderecoDeEntrada(caminhoAtual)} className={buttonVariants({ variant: "secondary", className: "w-full" })}>
				<LogInIcon data-icon="inline-start" />
				Entrar com sua conta
			</a>
		);
	}
	return (
		<div className="flex items-center gap-2 rounded-3xl border border-border/70 bg-card p-2.5 pl-3">
			<span className="flex min-w-0 flex-1 flex-col leading-snug">
				<span className="text-[13px] text-muted-foreground">Você entrou como</span>
				<span className="truncate text-sm font-semibold">{usuario.nome}</span>
			</span>
			<form action="/conta/sair" method="post">
				<Button type="submit" variant="ghost" size="icon" aria-label="Sair da conta" title="Sair da conta">
					<LogOutIcon />
				</Button>
			</form>
		</div>
	);
}

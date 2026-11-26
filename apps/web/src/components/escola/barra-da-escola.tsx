"use client";

import { cn } from "cn";
import { ArrowLeftRightIcon, LogInIcon, LogOutIcon, MenuIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { AREAS, enderecoDaArea } from "@/config/navegacao";
import { SITE } from "@/config/site";
import { useConta } from "@/hooks/use-conta";
import { usePainelDaEscola } from "@/hooks/use-painel-da-escola";
import { enderecoDeEntrada } from "@/lib/conta";
import { MarcaDoAloca } from "./marca";

const ID_DO_MENU = "menu-da-escola";

function Conta() {
	const { configurada, carregando, usuario } = useConta();
	const caminhoAtual = usePathname();

	if (!configurada || carregando) {
		return null;
	}
	if (!usuario) {
		return (
			<a href={enderecoDeEntrada(caminhoAtual)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
				<LogInIcon data-icon="inline-start" />
				Entrar
			</a>
		);
	}
	return (
		<form action="/conta/sair" method="post" className="flex items-center gap-1">
			<span
				title={`Você entrou como ${usuario.nome}`}
				className="grid size-10 place-items-center rounded-full bg-azul font-semibold text-white"
			>
				{usuario.nome.slice(0, 1).toUpperCase()}
			</span>
			<Button type="submit" variant="ghost" size="icon-sm" aria-label="Sair da conta" title="Sair da conta">
				<LogOutIcon />
			</Button>
		</form>
	);
}

function TrocarDeEscola() {
	const { codigoInep, dados } = usePainelDaEscola();
	return (
		<Link
			href="/entrar"
			title="Trocar de escola"
			className="flex h-10 max-w-[240px] items-center gap-2 rounded-full border border-border bg-card pr-3 pl-4 text-sm transition-colors hover:bg-pilula"
		>
			<span className="truncate font-semibold">{dados?.escola.nome ?? `INEP ${codigoInep}`}</span>
			<ArrowLeftRightIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
		</Link>
	);
}

function Logotipo({ codigoInep }: { codigoInep: string }) {
	return (
		<Link href={enderecoDaArea(codigoInep, "")} className="flex shrink-0 items-center gap-2.5 text-foreground">
			<MarcaDoAloca className="size-8" />
			<span className="font-heading text-[23px] font-extrabold tracking-tight">{SITE.nome}</span>
		</Link>
	);
}

export function BarraDaEscola() {
	const { codigoInep } = usePainelDaEscola();
	const caminhoAtual = usePathname();
	const [aberto, setAberto] = useState(false);
	const [caminhoDoMenu, setCaminhoDoMenu] = useState(caminhoAtual);

	if (caminhoDoMenu !== caminhoAtual) {
		setCaminhoDoMenu(caminhoAtual);
		setAberto(false);
	}

	useEffect(() => {
		if (!aberto) {
			return;
		}
		function fecharComEsc(evento: KeyboardEvent) {
			if (evento.key === "Escape") {
				setAberto(false);
			}
		}
		document.addEventListener("keydown", fecharComEsc);
		return () => document.removeEventListener("keydown", fecharComEsc);
	}, [aberto]);

	return (
		<header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md print:hidden">
			<div className="mx-auto flex h-[76px] w-full max-w-[1680px] items-center gap-4 px-4 sm:px-6 lg:px-10">
				<Logotipo codigoInep={codigoInep} />
				<nav aria-label="Áreas da escola" className="mx-auto hidden lg:block">
					<ul className="flex items-center gap-1 rounded-full bg-pilula p-1">
						{AREAS.map((area) => {
							const endereco = enderecoDaArea(codigoInep, area.caminho);
							const atual = caminhoAtual === endereco;
							return (
								<li key={area.caminho} className="relative">
									{atual && (
										<motion.span
											layoutId="area-atual"
											aria-hidden="true"
											className="absolute inset-0 rounded-full bg-tinta"
										/>
									)}
									<Link
										href={endereco}
										aria-current={atual ? "page" : undefined}
										className={cn(
											"relative flex h-10 items-center rounded-full px-4 text-[15px] font-semibold transition-colors",
											atual ? "text-white" : "text-muted-foreground hover:text-foreground",
										)}
									>
										{area.curto}
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>
				<div className="ml-auto hidden items-center gap-2 lg:flex">
					<TrocarDeEscola />
					<Conta />
				</div>
				<Button
					variant="secondary"
					size="icon-sm"
					className="ml-auto lg:hidden"
					aria-expanded={aberto}
					aria-controls={ID_DO_MENU}
					aria-label={aberto ? "Fechar o menu" : "Abrir o menu"}
					onClick={() => setAberto((valor) => !valor)}
				>
					{aberto ? <XIcon /> : <MenuIcon />}
				</Button>
			</div>
			<AnimatePresence>
				{aberto && (
					<motion.nav
						id={ID_DO_MENU}
						aria-label="Áreas da escola"
						initial={{ opacity: 0, y: -12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -12 }}
						className="fixed inset-x-0 top-[76px] bottom-0 z-20 flex flex-col gap-8 overflow-y-auto bg-background px-5 pt-4 pb-10 lg:hidden"
					>
						<ul className="flex flex-col">
							{AREAS.map((area, indice) => {
								const endereco = enderecoDaArea(codigoInep, area.caminho);
								return (
									<motion.li
										key={area.caminho}
										initial={{ opacity: 0, x: -16 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: indice * 0.04 }}
									>
										<Link
											href={endereco}
											aria-current={caminhoAtual === endereco ? "page" : undefined}
											className="flex border-b border-regra py-3.5 font-heading text-[34px] leading-none font-extrabold tracking-[-0.04em] text-foreground aria-[current=page]:text-azul"
										>
											{area.rotulo}
										</Link>
									</motion.li>
								);
							})}
						</ul>
						<div className="flex flex-wrap items-center gap-3">
							<TrocarDeEscola />
							<Conta />
						</div>
					</motion.nav>
				)}
			</AnimatePresence>
		</header>
	);
}

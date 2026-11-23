"use client";

import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AREAS, AREAS_DA_ESCOLA, enderecoDaArea } from "@/config/navegacao";
import { SITE } from "@/config/site";
import { useCodigoInep } from "@/hooks/use-painel-da-escola";
import { AvisoDeAcesso } from "./aviso-de-acesso";
import { MarcaDoAloca } from "./marca";
import { MenuDaEscola } from "./menu-da-escola";

const ID_DO_MENU = "menu-da-escola";

function Logotipo({ codigoInep }: { codigoInep: string }) {
	return (
		<Link href={enderecoDaArea(codigoInep, "")} className="flex items-center gap-2.5 text-foreground">
			<MarcaDoAloca className="size-7 shrink-0" />
			<span className="font-heading text-[22px] font-extrabold tracking-tight">{SITE.nome}</span>
		</Link>
	);
}

function useTituloDaArea(codigoInep: string): string {
	const caminhoAtual = usePathname();
	const area = [...AREAS, ...AREAS_DA_ESCOLA].find(({ caminho }) => enderecoDaArea(codigoInep, caminho) === caminhoAtual);
	return area?.rotulo ?? SITE.nome;
}

export function CascaDaEscola({ children }: { children: ReactNode }) {
	const codigoInep = useCodigoInep();
	const caminhoAtual = usePathname();
	const titulo = useTituloDaArea(codigoInep);
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
		<div className="flex min-h-svh flex-col md:flex-row">
			<a
				href="#conteudo"
				className="sr-only rounded-lg bg-tinta px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
			>
				Pular para o conteúdo
			</a>
			<aside className="hidden w-60 shrink-0 flex-col gap-6 px-3.5 py-6 md:sticky md:top-0 md:flex md:h-svh md:overflow-y-auto print:hidden">
				<div className="px-2.5">
					<Logotipo codigoInep={codigoInep} />
				</div>
				<MenuDaEscola />
			</aside>
			<header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-background pr-1.5 pl-4 md:hidden print:hidden">
				<Link href={enderecoDaArea(codigoInep, "")} aria-label={`${SITE.nome}, início`}>
					<MarcaDoAloca className="size-7" />
				</Link>
				<span className="flex-1 truncate font-semibold">{titulo}</span>
				<Button
					variant="ghost"
					size="icon"
					aria-expanded={aberto}
					aria-controls={ID_DO_MENU}
					aria-label={aberto ? "Fechar o menu" : "Abrir o menu"}
					onClick={() => setAberto((valor) => !valor)}
				>
					{aberto ? <XIcon /> : <MenuIcon />}
				</Button>
			</header>
			{aberto && (
				<div
					id={ID_DO_MENU}
					className="fixed inset-x-0 top-14 bottom-0 z-20 overflow-y-auto bg-background px-4 pt-2 pb-8 md:hidden"
				>
					<MenuDaEscola />
				</div>
			)}
			<main id="conteudo" className="min-w-0 flex-1 px-4 pt-2 pb-14 sm:px-8 md:pt-8 lg:px-12 print:p-0">
				<div className="mx-auto flex w-full max-w-[1080px] flex-col gap-6">
					<AvisoDeAcesso />
					{children}
				</div>
			</main>
		</div>
	);
}

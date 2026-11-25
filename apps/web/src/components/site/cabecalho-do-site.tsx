import { ESCOLA_EXEMPLO } from "@aloca/dominio";
import Link from "next/link";
import { MarcaDoAloca } from "@/components/escola/marca";
import { enderecoDaArea } from "@/config/navegacao";
import { SITE } from "@/config/site";

export function CabecalhoDoSite() {
	return (
		<nav aria-label="Principal" className="flex flex-wrap items-center justify-between gap-4 py-7">
			<Link href="/" className="flex items-center gap-2.5 text-white">
				<MarcaDoAloca className="size-[30px]" clara />
				<span className="font-heading text-2xl font-extrabold tracking-tight">{SITE.nome}</span>
			</Link>
			<div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[15px] font-medium">
				<a href="#dezembro" className="text-white hover:underline">
					O prazo
				</a>
				<a href="#secretaria" className="text-white hover:underline">
					Secretarias
				</a>
				<Link href="/entrar" className="text-white hover:underline">
					Entrar
				</Link>
				<Link
					href={enderecoDaArea(ESCOLA_EXEMPLO.codigoInep, "")}
					className="inline-flex h-11 items-center rounded-full bg-white px-5 font-semibold text-tinta hover:bg-azul-fundo"
				>
					Abrir a demonstração
				</Link>
			</div>
		</nav>
	);
}

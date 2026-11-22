"use client";

import { ehCodigoInepValido } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { enderecoDaArea } from "@/config/navegacao";
import { useOperacao } from "@/hooks/use-operacao";

const TAMANHO_DO_INEP = 8;

export function FormularioDeEntrada() {
	const roteador = useRouter();
	const consultar = useOperacao(useAction(api.pddeInfo.consultar));
	const [codigo, setCodigo] = useState("");
	const [erro, setErro] = useState<string | undefined>();
	const [semPddeInfo, setSemPddeInfo] = useState<string | null>(null);

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		const codigoInep = codigo.replace(/\D/g, "");
		if (!ehCodigoInepValido(codigoInep)) {
			setErro("O código INEP tem 8 números.");
			return;
		}
		setErro(undefined);
		setSemPddeInfo(null);
		const resultado = await consultar.executar({ codigoInep });
		if (!resultado) {
			setSemPddeInfo(codigoInep);
			return;
		}
		if (resultado.aviso) {
			toast.warning(resultado.aviso);
		}
		roteador.push(enderecoDaArea(resultado.codigoInep, ""));
	}

	return (
		<form onSubmit={enviar} noValidate className="flex flex-col gap-5">
			<Field data-invalid={Boolean(erro)}>
				<FieldLabel htmlFor="codigo-inep">Código INEP</FieldLabel>
				<Input
					id="codigo-inep"
					value={codigo}
					onChange={(evento) => setCodigo(evento.target.value)}
					inputMode="numeric"
					autoComplete="off"
					maxLength={TAMANHO_DO_INEP + 2}
					placeholder="8 números"
					aria-invalid={Boolean(erro)}
					disabled={consultar.executando}
					className="h-13 text-xl font-semibold tracking-[0.08em] tabular-nums placeholder:font-normal placeholder:tracking-normal md:text-xl"
				/>
				<FieldError>{erro}</FieldError>
			</Field>
			<Button type="submit" size="lg" disabled={consultar.executando}>
				{consultar.executando ? <Spinner data-icon="inline-start" /> : null}
				{consultar.executando ? "Lendo o PDDE Info…" : "Ver o saldo da escola"}
				{!consultar.executando && <ArrowRightIcon data-icon="inline-end" />}
			</Button>
			{semPddeInfo && (
				<div role="status" className="flex flex-col gap-3 rounded-lg bg-pilula px-4 py-3.5">
					<p className="text-pretty">Sem o PDDE Info, dá para carregar o saldo da escola {semPddeInfo} por uma planilha CSV.</p>
					<Link
						href={enderecoDaArea(semPddeInfo, "")}
						className={buttonVariants({ variant: "secondary", className: "self-start" })}
					>
						Importar a planilha CSV
						<ArrowRightIcon data-icon="inline-end" />
					</Link>
				</div>
			)}
		</form>
	);
}

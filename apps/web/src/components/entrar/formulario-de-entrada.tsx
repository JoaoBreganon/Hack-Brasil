"use client";

import { ehCodigoInepValido } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { enderecoDaEtapa } from "@/config/etapas";
import { useOperacao } from "@/hooks/use-operacao";

const TAMANHO_DO_INEP = 8;

export function FormularioDeEntrada() {
	const roteador = useRouter();
	const consultar = useOperacao(useAction(api.pddeInfo.consultar));
	const [codigo, setCodigo] = useState("");
	const [erro, setErro] = useState<string | undefined>();

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		const codigoInep = codigo.replace(/\D/g, "");
		if (!ehCodigoInepValido(codigoInep)) {
			setErro("O código INEP tem 8 dígitos, só números.");
			return;
		}
		setErro(undefined);
		const resultado = await consultar.executar({ codigoInep });
		if (resultado) {
			if (resultado.aviso) {
				toast.warning(resultado.aviso);
			}
			roteador.push(enderecoDaEtapa(resultado.codigoInep, ""));
		}
	}

	return (
		<form onSubmit={enviar} noValidate className="flex flex-col gap-5">
			<Field data-invalid={Boolean(erro)}>
				<FieldLabel htmlFor="codigo-inep" className="text-base">
					Código INEP da escola
				</FieldLabel>
				<Input
					id="codigo-inep"
					value={codigo}
					onChange={(evento) => setCodigo(evento.target.value)}
					inputMode="numeric"
					autoComplete="off"
					maxLength={TAMANHO_DO_INEP + 2}
					placeholder="00000000"
					aria-invalid={Boolean(erro)}
					disabled={consultar.executando}
					className="h-14 rounded-xl px-4 font-heading text-2xl font-bold tracking-[0.12em] tabular-nums placeholder:text-muted-foreground/40 md:text-2xl"
				/>
				<FieldDescription>Está no Censo Escolar e no topo do PDDE Info. São 8 números.</FieldDescription>
				<FieldError>{erro}</FieldError>
			</Field>
			<Button type="submit" size="xl" disabled={consultar.executando}>
				{consultar.executando ? <Spinner data-icon="inline-start" /> : null}
				{consultar.executando ? "Lendo o PDDE Info…" : "Ver o saldo da escola"}
				{!consultar.executando && <ArrowRightIcon data-icon="inline-end" />}
			</Button>
		</form>
	);
}

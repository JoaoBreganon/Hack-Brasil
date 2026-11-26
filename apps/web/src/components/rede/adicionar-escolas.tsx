"use client";

import { LIMITES } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { PlusIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useOperacao } from "@/hooks/use-operacao";

function resumo({ adicionadas, repetidas, invalidos }: { adicionadas: number; repetidas: number; invalidos: string[] }): string {
	return [
		adicionadas === 1 ? "1 escola entrou." : `${adicionadas} escolas entraram.`,
		repetidas > 0 ? `${repetidas} já estavam na rede.` : "",
		invalidos.length > 0
			? `Ignoramos ${invalidos.slice(0, 3).join(", ")}${invalidos.length > 3 ? "…" : ""}: não são códigos INEP.`
			: "",
	]
		.filter(Boolean)
		.join(" ");
}

export function AdicionarEscolas() {
	const adicionar = useOperacao(useMutation(api.redes.adicionarEscolas));
	const [texto, setTexto] = useState("");

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		const resultado = await adicionar.executar({ texto });
		if (resultado) {
			toast[resultado.invalidos.length > 0 ? "warning" : "success"](resumo(resultado));
			setTexto("");
		}
	}

	return (
		<form
			onSubmit={enviar}
			aria-labelledby="titulo-adicionar"
			className="flex min-w-0 flex-[1_1_360px] flex-col gap-4 rounded-3xl border border-border/70 bg-card p-5"
		>
			<Field>
				<FieldLabel id="titulo-adicionar" htmlFor="codigos-inep" className="text-base font-semibold">
					Adicionar escolas
				</FieldLabel>
				<Textarea
					id="codigos-inep"
					value={texto}
					onChange={(evento) => setTexto(evento.target.value)}
					placeholder={"35079923\n35012345"}
					rows={4}
					className="font-mono tabular-nums"
				/>
				<FieldDescription>
					Cole os códigos INEP, um por linha ou separados por vírgula. A rede acompanha até {LIMITES.escolasPorRede} escolas.
				</FieldDescription>
			</Field>
			<Button type="submit" variant="secondary" disabled={adicionar.executando || !texto.trim()} className="self-start">
				{adicionar.executando ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
				Adicionar
			</Button>
		</form>
	);
}

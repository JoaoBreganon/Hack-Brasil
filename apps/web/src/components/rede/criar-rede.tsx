"use client";

import { LIMITES } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useOperacao } from "@/hooks/use-operacao";

export function CriarRede({ seuNome }: { seuNome: string }) {
	const criar = useOperacao(useMutation(api.redes.criar));
	const [nome, setNome] = useState("");

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		await criar.executar({ nome, seuNome });
	}

	return (
		<form onSubmit={enviar} className="flex max-w-md flex-col gap-4 rounded-3xl border border-border/70 bg-card p-5">
			<Field>
				<FieldLabel htmlFor="nome-da-rede">Nome da rede</FieldLabel>
				<Input
					id="nome-da-rede"
					value={nome}
					onChange={(evento) => setNome(evento.target.value)}
					placeholder="Rede Municipal de Adamantina"
					minLength={LIMITES.nomeDaRede.minimo}
					maxLength={LIMITES.nomeDaRede.maximo}
					required
				/>
				<FieldDescription>Depois você cola os códigos INEP das escolas que a secretaria acompanha.</FieldDescription>
			</Field>
			<Button type="submit" disabled={criar.executando} className="self-start">
				{criar.executando && <Spinner data-icon="inline-start" />}
				Criar o painel da rede
			</Button>
		</form>
	);
}

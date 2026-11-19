"use client";

import { LIMITES, validarJustificativa } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { type FormEvent, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useOperacao } from "@/hooks/use-operacao";

type Propriedades = {
	itemId: Id<"item">;
	atual: string | null;
	bloqueado: boolean;
};

export function Justificativa({ itemId, atual, bloqueado }: Propriedades) {
	const justificar = useMutation(api.itens.justificar);
	const { executar, executando } = useOperacao(justificar);
	const [texto, setTexto] = useState(atual ?? "");
	const [erro, setErro] = useState<string | undefined>();
	const campo = useId();

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		const validacao = texto.trim() ? validarJustificativa(texto) : null;
		if (validacao && !validacao.ok) {
			setErro(validacao.erros.justificativa);
			return;
		}
		setErro(undefined);
		if ((await executar({ itemId, justificativa: validacao?.valor.justificativa ?? "" })) !== null) {
			toast.success(validacao ? "Justificativa salva." : "Justificativa removida.");
		}
	}

	return (
		<form onSubmit={enviar} noValidate className="flex flex-col gap-3">
			<Field data-invalid={Boolean(erro)}>
				<FieldLabel htmlFor={campo}>Por que este item tem menos de três orçamentos?</FieldLabel>
				<Textarea
					id={campo}
					value={texto}
					onChange={(evento) => setTexto(evento.target.value)}
					maxLength={LIMITES.justificativa.maximo}
					disabled={bloqueado || executando}
					placeholder="Ex.: só existe uma vidraçaria que atende a cidade."
					aria-invalid={Boolean(erro)}
				/>
				<FieldDescription>A APM precisa aprovar esta justificativa na ata.</FieldDescription>
				<FieldError>{erro}</FieldError>
			</Field>
			<Button type="submit" variant="secondary" size="lg" disabled={bloqueado || executando} className="self-start">
				{executando && <Spinner data-icon="inline-start" />}
				Salvar justificativa
			</Button>
		</form>
	);
}

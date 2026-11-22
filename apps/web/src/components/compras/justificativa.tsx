"use client";

import { LIMITES, validarJustificativa } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { type FormEvent, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useOperacao } from "@/hooks/use-operacao";

export function Justificativa({ itemId, atual, bloqueado }: { itemId: Id<"item">; atual: string | null; bloqueado: boolean }) {
	const justificar = useOperacao(useMutation(api.itens.justificar));
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
		if ((await justificar.executar({ itemId, justificativa: validacao?.valor.justificativa ?? "" })) !== undefined) {
			toast.success(validacao ? "Justificativa salva." : "Justificativa removida.");
		}
	}

	return (
		<form onSubmit={enviar} noValidate className="flex flex-col gap-2.5 border-t border-regra pt-4">
			<Field data-invalid={Boolean(erro)}>
				<FieldLabel htmlFor={campo}>Não há três orçamentos? Explique para a APM</FieldLabel>
				<Textarea
					id={campo}
					value={texto}
					onChange={(evento) => setTexto(evento.target.value)}
					maxLength={LIMITES.justificativa.maximo}
					disabled={bloqueado || justificar.executando}
					placeholder="Ex.: só uma vidraçaria atende a cidade."
					aria-invalid={Boolean(erro)}
				/>
				<FieldError>{erro}</FieldError>
			</Field>
			<Button type="submit" variant="secondary" size="sm" disabled={bloqueado || justificar.executando} className="self-start">
				{justificar.executando && <Spinner data-icon="inline-start" />}
				Salvar justificativa
			</Button>
		</form>
	);
}

"use client";

import { type Cotacao, LIMITES, lerValorEmCentavos, validarCotacao } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useOperacao } from "@/hooks/use-operacao";

type Erros = Partial<Record<keyof Cotacao, string>>;

export function FormularioDeOrcamento({ itemId, aoTerminar }: { itemId: Id<"item">; aoTerminar: () => void }) {
	const adicionar = useOperacao(useMutation(api.orcamentos.adicionar));
	const [fornecedor, setFornecedor] = useState("");
	const [valor, setValor] = useState("");
	const [endereco, setEndereco] = useState("");
	const [erros, setErros] = useState<Erros>({});
	const prefixo = useId();

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		const validacao = validarCotacao({ fornecedor, valorEmCentavos: lerValorEmCentavos(valor), endereco });
		if (!validacao.ok) {
			setErros(validacao.erros);
			return;
		}
		setErros({});
		if (await adicionar.executar({ itemId, ...validacao.valor })) {
			aoTerminar();
		}
	}

	return (
		<form onSubmit={enviar} noValidate aria-label="Anotar orçamento" className="flex flex-col gap-4 rounded-lg bg-background p-4">
			<fieldset disabled={adicionar.executando} className="contents">
				<FieldGroup className="gap-3.5">
					<Field data-invalid={Boolean(erros.fornecedor)}>
						<FieldLabel htmlFor={`${prefixo}-fornecedor`}>Fornecedor</FieldLabel>
						<Input
							id={`${prefixo}-fornecedor`}
							value={fornecedor}
							onChange={(evento) => setFornecedor(evento.target.value)}
							maxLength={LIMITES.fornecedor.maximo}
							aria-invalid={Boolean(erros.fornecedor)}
							autoComplete="organization"
						/>
						<FieldError>{erros.fornecedor}</FieldError>
					</Field>
					<Field data-invalid={Boolean(erros.valorEmCentavos)}>
						<FieldLabel htmlFor={`${prefixo}-valor`}>Preço de uma unidade (R$)</FieldLabel>
						<Input
							id={`${prefixo}-valor`}
							value={valor}
							onChange={(evento) => setValor(evento.target.value)}
							inputMode="decimal"
							placeholder="0,00"
							aria-invalid={Boolean(erros.valorEmCentavos)}
							autoComplete="off"
						/>
						<FieldError>{erros.valorEmCentavos}</FieldError>
					</Field>
					<Field data-invalid={Boolean(erros.endereco)}>
						<FieldLabel htmlFor={`${prefixo}-endereco`}>Link do anúncio, se tiver</FieldLabel>
						<Input
							id={`${prefixo}-endereco`}
							type="url"
							value={endereco}
							onChange={(evento) => setEndereco(evento.target.value)}
							maxLength={LIMITES.endereco.maximo}
							placeholder="https://"
							aria-invalid={Boolean(erros.endereco)}
						/>
						<FieldError>{erros.endereco}</FieldError>
					</Field>
				</FieldGroup>
				<div className="flex flex-wrap gap-2">
					<Button type="submit">
						{adicionar.executando && <Spinner data-icon="inline-start" />}
						Salvar
					</Button>
					<Button type="button" variant="ghost" onClick={aoTerminar}>
						Cancelar
					</Button>
				</div>
			</fieldset>
		</form>
	);
}

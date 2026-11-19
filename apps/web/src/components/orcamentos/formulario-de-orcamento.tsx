"use client";

import { type Cotacao, LIMITES, lerValorEmCentavos, validarCotacao } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { PencilLineIcon } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useOperacao } from "@/hooks/use-operacao";

type Erros = Partial<Record<keyof Cotacao, string>>;

export function FormularioDeOrcamento({ itemId, bloqueado }: { itemId: Id<"item">; bloqueado: boolean }) {
	const adicionar = useMutation(api.orcamentos.adicionar);
	const { executar, executando } = useOperacao(adicionar);
	const [aberto, setAberto] = useState(false);
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
		if (await executar({ itemId, ...validacao.valor })) {
			setFornecedor("");
			setValor("");
			setEndereco("");
			setAberto(false);
		}
	}

	if (!aberto) {
		return (
			<Button variant="ghost" size="lg" onClick={() => setAberto(true)} disabled={bloqueado}>
				<PencilLineIcon data-icon="inline-start" />
				Anotar um orçamento
			</Button>
		);
	}

	return (
		<form onSubmit={enviar} noValidate className="flex w-full flex-col gap-4 rounded-2xl bg-papel p-5">
			<fieldset disabled={executando} className="contents">
				<FieldGroup className="grid gap-4 sm:grid-cols-[1.4fr_1fr_1.6fr]">
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
						<FieldLabel htmlFor={`${prefixo}-valor`}>Preço unitário (R$)</FieldLabel>
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
						<FieldLabel htmlFor={`${prefixo}-endereco`}>Link do anúncio (opcional)</FieldLabel>
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
				<div className="flex flex-wrap gap-3">
					<Button type="submit" size="lg">
						{executando && <Spinner data-icon="inline-start" />}
						Salvar orçamento
					</Button>
					<Button type="button" variant="ghost" size="lg" onClick={() => setAberto(false)}>
						Cancelar
					</Button>
				</div>
			</fieldset>
		</form>
	);
}

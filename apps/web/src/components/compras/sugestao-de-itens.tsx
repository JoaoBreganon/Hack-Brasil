"use client";

import { formatarReais, LIMITES, type ResultadoDaSugestao, type Saldo, validarPedido } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { SparklesIcon } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useOperacao } from "@/hooks/use-operacao";
import { FecharPainel } from "./fechar-painel";

type Propriedades = {
	codigoInep: string;
	saldoLivre: Saldo;
	aoSugerir: (resultado: ResultadoDaSugestao) => void;
};

export function FormularioDeSugestao({ codigoInep, saldoLivre, aoSugerir, className }: Propriedades & { className?: string }) {
	const gerar = useOperacao(useAction(api.sugestoes.gerar));
	const [pedido, setPedido] = useState("");
	const [erro, setErro] = useState<string | undefined>();
	const campo = useId();

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		const validacao = validarPedido(pedido);
		if (!validacao.ok) {
			setErro(validacao.erros.pedido);
			return;
		}
		setErro(undefined);
		const resultado = await gerar.executar({ codigoInep, pedido: validacao.valor.pedido });
		if (resultado) {
			setPedido("");
			aoSugerir(resultado);
		}
	}

	return (
		<form onSubmit={enviar} noValidate aria-label="Sugerir itens" className={cn("flex flex-col gap-4 text-left", className)}>
			<fieldset disabled={gerar.executando} className="contents">
				<Field data-invalid={Boolean(erro)}>
					<FieldLabel htmlFor={campo}>O que a escola precisa?</FieldLabel>
					<Textarea
						id={campo}
						value={pedido}
						onChange={(evento) => setPedido(evento.target.value)}
						maxLength={LIMITES.pedido.maximo}
						placeholder="Ex.: a biblioteca tem poucos livros e as salas ficam quentes à tarde."
						aria-invalid={Boolean(erro)}
					/>
					<FieldDescription>
						Pode deixar em branco. As sugestões cabem no saldo livre de {formatarReais(saldoLivre.custeio)} em custeio e{" "}
						{formatarReais(saldoLivre.capital)} em capital, e o que o PDDE não paga fica de fora.
					</FieldDescription>
					<FieldError>{erro}</FieldError>
				</Field>
				<Button type="submit" className="self-start">
					{gerar.executando ? <Spinner data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
					{gerar.executando ? "Sugerindo…" : "Sugerir itens"}
				</Button>
			</fieldset>
		</form>
	);
}

export function PainelDeSugestao(propriedades: Propriedades) {
	return (
		<section aria-labelledby="titulo-sugerir-itens" className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 sm:p-6">
			<div className="flex items-start justify-between gap-3">
				<h2 id="titulo-sugerir-itens" className="text-lg font-semibold">
					Sugerir itens
				</h2>
				<FecharPainel codigoInep={propriedades.codigoInep} rotulo="Fechar a sugestão de itens" />
			</div>
			<FormularioDeSugestao {...propriedades} />
		</section>
	);
}

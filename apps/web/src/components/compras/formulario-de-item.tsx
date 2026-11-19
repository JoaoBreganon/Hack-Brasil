"use client";

import { LIMITES, type NovaNecessidade, REGRAS_POR_TIPO, TIPOS_DE_DESPESA, type TipoDeDespesa, validarNecessidade } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { enderecoDaArea } from "@/config/navegacao";
import { useOperacao } from "@/hooks/use-operacao";
import { FecharPainel } from "./fechar-painel";

const PERMITIDOS = TIPOS_DE_DESPESA.filter((tipo) => REGRAS_POR_TIPO[tipo].permitido);
const VEDADOS = TIPOS_DE_DESPESA.filter((tipo) => !REGRAS_POR_TIPO[tipo].permitido);
const TIPO_INICIAL: TipoDeDespesa = "material de consumo";

type Erros = Partial<Record<keyof NovaNecessidade, string>>;

function explicarTipo(tipo: TipoDeDespesa): string {
	const regra = REGRAS_POR_TIPO[tipo];
	return regra.permitido ? `Sai do saldo de ${regra.categoria}.` : "O PDDE não paga este tipo de despesa.";
}

export function FormularioDeItem({ codigoInep, proximaPrioridade }: { codigoInep: string; proximaPrioridade: number }) {
	const roteador = useRouter();
	const adicionar = useOperacao(useMutation(api.itens.adicionar));
	const [descricao, setDescricao] = useState("");
	const [tipo, setTipo] = useState<TipoDeDespesa>(TIPO_INICIAL);
	const [quantidade, setQuantidade] = useState("1");
	const [prioridade, setPrioridade] = useState(String(proximaPrioridade));
	const [erros, setErros] = useState<Erros>({});

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		const validacao = validarNecessidade({ descricao, tipo, quantidade: Number(quantidade), prioridade: Number(prioridade) });
		if (!validacao.ok) {
			setErros(validacao.erros);
			return;
		}
		setErros({});
		const itemId = await adicionar.executar({ codigoInep, ...validacao.valor });
		if (itemId) {
			roteador.replace(enderecoDaArea(codigoInep, "compras", { item: itemId }), { scroll: false });
		}
	}

	return (
		<form
			onSubmit={enviar}
			noValidate
			aria-labelledby="titulo-novo-item"
			className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 sm:p-6"
		>
			<div className="flex items-start justify-between gap-3">
				<h2 id="titulo-novo-item" className="text-lg font-semibold">
					Novo item
				</h2>
				<FecharPainel codigoInep={codigoInep} rotulo="Cancelar o novo item" />
			</div>
			<fieldset disabled={adicionar.executando} className="contents">
				<FieldGroup className="gap-4">
					<Field data-invalid={Boolean(erros.descricao)}>
						<FieldLabel htmlFor="descricao">O que comprar</FieldLabel>
						<Input
							id="descricao"
							value={descricao}
							onChange={(evento) => setDescricao(evento.target.value)}
							maxLength={LIMITES.descricao.maximo}
							placeholder="Ex.: cadeiras para o refeitório"
							aria-invalid={Boolean(erros.descricao)}
							autoComplete="off"
							autoFocus
						/>
						<FieldError>{erros.descricao}</FieldError>
					</Field>
					<Field>
						<FieldLabel htmlFor="tipo">Tipo de despesa</FieldLabel>
						<NativeSelect id="tipo" value={tipo} onChange={(evento) => setTipo(evento.target.value as TipoDeDespesa)}>
							<NativeSelectOptGroup label="O PDDE paga">
								{PERMITIDOS.map((opcao) => (
									<NativeSelectOption key={opcao} value={opcao}>
										{opcao}
									</NativeSelectOption>
								))}
							</NativeSelectOptGroup>
							<NativeSelectOptGroup label="O PDDE não paga">
								{VEDADOS.map((opcao) => (
									<NativeSelectOption key={opcao} value={opcao}>
										{opcao}
									</NativeSelectOption>
								))}
							</NativeSelectOptGroup>
						</NativeSelect>
						<FieldDescription>{explicarTipo(tipo)}</FieldDescription>
					</Field>
					<div className="grid grid-cols-2 gap-4">
						<Field data-invalid={Boolean(erros.quantidade)}>
							<FieldLabel htmlFor="quantidade">Quantidade</FieldLabel>
							<Input
								id="quantidade"
								type="number"
								inputMode="numeric"
								min={LIMITES.quantidade.minimo}
								max={LIMITES.quantidade.maximo}
								value={quantidade}
								onChange={(evento) => setQuantidade(evento.target.value)}
								aria-invalid={Boolean(erros.quantidade)}
							/>
							<FieldError>{erros.quantidade}</FieldError>
						</Field>
						<Field data-invalid={Boolean(erros.prioridade)}>
							<FieldLabel htmlFor="prioridade">Prioridade</FieldLabel>
							<Input
								id="prioridade"
								type="number"
								inputMode="numeric"
								min={LIMITES.prioridade.minimo}
								max={LIMITES.prioridade.maximo}
								value={prioridade}
								onChange={(evento) => setPrioridade(evento.target.value)}
								aria-invalid={Boolean(erros.prioridade)}
							/>
							<FieldError>{erros.prioridade}</FieldError>
						</Field>
					</div>
				</FieldGroup>
				<Button type="submit" className="self-start">
					{adicionar.executando && <Spinner data-icon="inline-start" />}
					Adicionar item
				</Button>
			</fieldset>
		</form>
	);
}

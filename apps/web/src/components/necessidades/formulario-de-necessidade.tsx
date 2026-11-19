"use client";

import { LIMITES, type NovaNecessidade, REGRAS_POR_TIPO, TIPOS_DE_DESPESA, type TipoDeDespesa, validarNecessidade } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { PlusIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { useOperacao } from "@/hooks/use-operacao";

const PERMITIDOS = TIPOS_DE_DESPESA.filter((tipo) => REGRAS_POR_TIPO[tipo].permitido);
const VEDADOS = TIPOS_DE_DESPESA.filter((tipo) => !REGRAS_POR_TIPO[tipo].permitido);
const TIPO_INICIAL: TipoDeDespesa = "material de consumo";

type Erros = Partial<Record<keyof NovaNecessidade, string>>;

type Propriedades = {
	codigoInep: string;
	proximaPrioridade: number;
	bloqueado: boolean;
};

function explicarTipo(tipo: TipoDeDespesa): string {
	const regra = REGRAS_POR_TIPO[tipo];
	return regra.permitido ? `Entra no saldo de ${regra.categoria}.` : "O PDDE não paga este tipo de despesa. O item fica fora do plano.";
}

export function FormularioDeNecessidade({ codigoInep, proximaPrioridade, bloqueado }: Propriedades) {
	const adicionar = useMutation(api.itens.adicionar);
	const { executar, executando } = useOperacao(adicionar);
	const [descricao, setDescricao] = useState("");
	const [tipo, setTipo] = useState<TipoDeDespesa>(TIPO_INICIAL);
	const [quantidade, setQuantidade] = useState("1");
	const [prioridade, setPrioridade] = useState("");
	const [erros, setErros] = useState<Erros>({});
	const prioridadeUsada = prioridade === "" ? proximaPrioridade : Number(prioridade);

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		const validacao = validarNecessidade({ descricao, tipo, quantidade: Number(quantidade), prioridade: prioridadeUsada });
		if (!validacao.ok) {
			setErros(validacao.erros);
			return;
		}
		setErros({});
		if (await executar({ codigoInep, ...validacao.valor })) {
			toast.success(`"${validacao.valor.descricao}" entrou na lista.`);
			setDescricao("");
			setQuantidade("1");
			setPrioridade("");
		}
	}

	return (
		<form
			onSubmit={enviar}
			noValidate
			aria-labelledby="titulo-novo-item"
			className="flex min-w-0 flex-[1_1_340px] flex-col gap-6 rounded-[20px] bg-papel p-6 sm:p-7"
		>
			<h2 id="titulo-novo-item" className="font-heading text-xl font-bold tracking-tight">
				Novo item
			</h2>
			<fieldset disabled={bloqueado || executando} className="contents">
				<FieldGroup>
					<Field data-invalid={Boolean(erros.descricao)}>
						<FieldLabel htmlFor="descricao">O que comprar</FieldLabel>
						<Input
							id="descricao"
							value={descricao}
							onChange={(evento) => setDescricao(evento.target.value)}
							maxLength={LIMITES.descricao.maximo}
							placeholder="Ex.: livros de literatura para a biblioteca"
							aria-invalid={Boolean(erros.descricao)}
							autoComplete="off"
						/>
						<FieldError>{erros.descricao}</FieldError>
					</Field>
					<Field data-invalid={Boolean(erros.tipo)}>
						<FieldLabel htmlFor="tipo">Tipo de despesa</FieldLabel>
						<NativeSelect
							id="tipo"
							value={tipo}
							onChange={(evento) => setTipo(evento.target.value as TipoDeDespesa)}
							aria-invalid={Boolean(erros.tipo)}
						>
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
								placeholder={String(proximaPrioridade)}
								onChange={(evento) => setPrioridade(evento.target.value)}
								aria-invalid={Boolean(erros.prioridade)}
							/>
							<FieldError>{erros.prioridade}</FieldError>
						</Field>
					</div>
				</FieldGroup>
				<Button type="submit" size="lg">
					{executando ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
					Adicionar à lista
				</Button>
			</fieldset>
		</form>
	);
}

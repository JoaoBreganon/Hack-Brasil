"use client";

import { type PapelDoContato, ROTULO_DO_PAPEL, normalizarCelular, validarNomeDoContato } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { PencilIcon, SmartphoneIcon, Trash2Icon } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useOperacao } from "@/hooks/use-operacao";

type Contato = { _id: Id<"contato">; nome: string; celular: string };

type Propriedades = {
	codigoInep: string;
	papel: PapelDoContato;
	contato: Contato | null;
	carregando: boolean;
};

type Erros = { nome?: string; celular?: string };

function FormularioDoContato({ codigoInep, papel, aoSalvar }: { codigoInep: string; papel: PapelDoContato; aoSalvar: () => void }) {
	const salvar = useOperacao(useMutation(api.contatos.salvar));
	const [nome, setNome] = useState("");
	const [celular, setCelular] = useState("");
	const [erros, setErros] = useState<Erros>({});
	const prefixo = useId();

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		const novosErros: Erros = {
			...(validarNomeDoContato(nome) ? {} : { nome: "Informe o nome com 2 a 80 caracteres." }),
			...(normalizarCelular(celular) ? {} : { celular: "Informe um celular com DDD, por exemplo (18) 99123-4567." }),
		};
		setErros(novosErros);
		if (Object.keys(novosErros).length > 0) {
			return;
		}
		if (await salvar.executar({ codigoInep, papel, nome, celular })) {
			toast.success("Celular salvo para os alertas.");
			aoSalvar();
		}
	}

	return (
		<form onSubmit={enviar} noValidate className="flex flex-col gap-4">
			<fieldset disabled={salvar.executando} className="contents">
				<FieldGroup className="grid gap-4 sm:grid-cols-2">
					<Field data-invalid={Boolean(erros.nome)}>
						<FieldLabel htmlFor={`${prefixo}-nome`}>Nome</FieldLabel>
						<Input
							id={`${prefixo}-nome`}
							value={nome}
							onChange={(evento) => setNome(evento.target.value)}
							autoComplete="name"
							aria-invalid={Boolean(erros.nome)}
						/>
						<FieldError>{erros.nome}</FieldError>
					</Field>
					<Field data-invalid={Boolean(erros.celular)}>
						<FieldLabel htmlFor={`${prefixo}-celular`}>Celular com DDD</FieldLabel>
						<Input
							id={`${prefixo}-celular`}
							type="tel"
							inputMode="tel"
							value={celular}
							onChange={(evento) => setCelular(evento.target.value)}
							placeholder="(18) 99123-4567"
							autoComplete="tel-national"
							aria-invalid={Boolean(erros.celular)}
						/>
						<FieldError>{erros.celular}</FieldError>
					</Field>
				</FieldGroup>
				<Button type="submit" size="lg" className="self-start">
					{salvar.executando ? <Spinner data-icon="inline-start" /> : <SmartphoneIcon data-icon="inline-start" />}
					Salvar celular
				</Button>
			</fieldset>
		</form>
	);
}

export function CartaoDoContato({ codigoInep, papel, contato, carregando }: Propriedades) {
	const remover = useOperacao(useMutation(api.contatos.remover));
	const [editando, setEditando] = useState(false);
	const tituloId = useId();

	return (
		<article
			aria-labelledby={tituloId}
			className="flex flex-col gap-4 rounded-[20px] bg-card p-5 shadow-[0_0_0_1px_var(--pauta)] sm:p-6"
		>
			<h3 id={tituloId} className="text-[13px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
				{ROTULO_DO_PAPEL[papel]}
			</h3>
			{carregando ? (
				<Skeleton className="h-10 w-full" />
			) : contato && !editando ? (
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-col">
						<span className="font-semibold">{contato.nome}</span>
						<span className="text-sm text-muted-foreground tabular-nums">{contato.celular}</span>
					</div>
					<div className="flex gap-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setEditando(true)}
							aria-label={`Trocar o celular de ${contato.nome}`}
						>
							<PencilIcon />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => remover.executar({ contatoId: contato._id })}
							disabled={remover.executando}
							aria-label={`Remover ${contato.nome} dos alertas`}
						>
							{remover.executando ? <Spinner /> : <Trash2Icon />}
						</Button>
					</div>
				</div>
			) : (
				<FormularioDoContato codigoInep={codigoInep} papel={papel} aoSalvar={() => setEditando(false)} />
			)}
		</article>
	);
}

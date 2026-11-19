"use client";

import { normalizarCelular, type PapelDoContato, ROTULO_DO_PAPEL, validarNomeDoContato } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useOperacao } from "@/hooks/use-operacao";

type Contato = { _id: Id<"contato">; nome: string; celular: string };

type Erros = { nome?: string; celular?: string };

function FormularioDoContato({ codigoInep, papel, aoTerminar }: { codigoInep: string; papel: PapelDoContato; aoTerminar?: () => void }) {
	const salvar = useOperacao(useMutation(api.contatos.salvar));
	const [nome, setNome] = useState("");
	const [celular, setCelular] = useState("");
	const [erros, setErros] = useState<Erros>({});
	const prefixo = useId();

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		const novosErros: Erros = {
			...(validarNomeDoContato(nome) ? {} : { nome: "Informe o nome." }),
			...(normalizarCelular(celular) ? {} : { celular: "Use um celular com DDD, como (18) 99123-4567." }),
		};
		setErros(novosErros);
		if (Object.keys(novosErros).length > 0) {
			return;
		}
		if (await salvar.executar({ codigoInep, papel, nome, celular })) {
			toast.success("Celular salvo.");
			aoTerminar?.();
		}
	}

	return (
		<form onSubmit={enviar} noValidate className="flex flex-col gap-3">
			<fieldset disabled={salvar.executando} className="contents">
				<div className="grid gap-3 sm:grid-cols-2">
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
				</div>
				<div className="flex gap-2">
					<Button type="submit" variant="secondary">
						{salvar.executando && <Spinner data-icon="inline-start" />}
						Salvar
					</Button>
					{aoTerminar && (
						<Button type="button" variant="ghost" onClick={aoTerminar}>
							Cancelar
						</Button>
					)}
				</div>
			</fieldset>
		</form>
	);
}

export function ContatoDaEscola({ codigoInep, papel, contato }: { codigoInep: string; papel: PapelDoContato; contato: Contato | null }) {
	const remover = useOperacao(useMutation(api.contatos.remover));
	const [editando, setEditando] = useState(false);

	return (
		<li className="flex flex-col gap-3 border-t border-regra px-5 py-4">
			<span className="text-sm text-muted-foreground">{ROTULO_DO_PAPEL[papel]}</span>
			{contato && !editando ? (
				<div className="flex items-center justify-between gap-3">
					<div className="flex flex-col">
						<span className="font-semibold">{contato.nome}</span>
						<span className="text-sm text-muted-foreground tabular-nums">{contato.celular}</span>
					</div>
					<div className="flex">
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
							aria-label={`Tirar ${contato.nome} dos alertas`}
						>
							{remover.executando ? <Spinner /> : <Trash2Icon />}
						</Button>
					</div>
				</div>
			) : (
				<FormularioDoContato codigoInep={codigoInep} papel={papel} aoTerminar={contato ? () => setEditando(false) : undefined} />
			)}
		</li>
	);
}

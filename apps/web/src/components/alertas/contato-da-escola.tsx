"use client";

import { normalizarCelular, normalizarEmail, type PapelDoContato, ROTULO_DO_PAPEL, validarNomeDoContato } from "@aloca/dominio";
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

type Contato = { _id: Id<"contato">; nome: string; celular: string | null; email: string | null };

type Erros = { nome?: string; celular?: string; email?: string };

function validar(nome: string, celular: string, email: string): Erros {
	const semCanal = !celular.trim() && !email.trim();
	return {
		...(validarNomeDoContato(nome) ? {} : { nome: "Informe o nome." }),
		...(semCanal ? { celular: "Informe um celular ou um e-mail." } : {}),
		...(celular.trim() && !normalizarCelular(celular) ? { celular: "Use um celular com DDD, como (18) 99123-4567." } : {}),
		...(email.trim() && !normalizarEmail(email) ? { email: "Use um e-mail como diretora@escola.com.br." } : {}),
	};
}

function FormularioDoContato({ codigoInep, papel, aoTerminar }: { codigoInep: string; papel: PapelDoContato; aoTerminar?: () => void }) {
	const salvar = useOperacao(useMutation(api.contatos.salvar));
	const [nome, setNome] = useState("");
	const [celular, setCelular] = useState("");
	const [email, setEmail] = useState("");
	const [erros, setErros] = useState<Erros>({});
	const prefixo = useId();

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		const novosErros = validar(nome, celular, email);
		setErros(novosErros);
		if (Object.keys(novosErros).length > 0) {
			return;
		}
		if (await salvar.executar({ codigoInep, papel, nome, celular, email })) {
			toast.success("Contato salvo.");
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
					<Field data-invalid={Boolean(erros.email)} className="sm:col-span-2">
						<FieldLabel htmlFor={`${prefixo}-email`}>E-mail</FieldLabel>
						<Input
							id={`${prefixo}-email`}
							type="email"
							inputMode="email"
							value={email}
							onChange={(evento) => setEmail(evento.target.value)}
							placeholder="diretora@escola.com.br"
							autoComplete="email"
							aria-invalid={Boolean(erros.email)}
						/>
						<FieldError>{erros.email}</FieldError>
					</Field>
				</div>
				<p className="text-[13px] text-muted-foreground">Preencha o celular, o e-mail ou os dois.</p>
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
						{[contato.celular, contato.email].filter(Boolean).map((canal) => (
							<span key={canal} className="text-sm text-muted-foreground tabular-nums">
								{canal}
							</span>
						))}
					</div>
					<div className="flex">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setEditando(true)}
							aria-label={`Trocar o contato de ${contato.nome}`}
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

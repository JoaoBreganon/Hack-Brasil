"use client";

import { CopyIcon, LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useOperacao } from "@/hooks/use-operacao";

type Propriedades = {
	descricao: string;
	criar: () => Promise<string>;
	caminho: (codigo: string) => string;
};

export function LinkDeConvite({ descricao, criar, caminho }: Propriedades) {
	const criacao = useOperacao(criar);
	const [endereco, setEndereco] = useState<string | null>(null);

	async function criarConvite() {
		const codigo = await criacao.executar();
		if (codigo) {
			setEndereco(`${window.location.origin}${caminho(codigo)}`);
		}
	}

	async function copiar() {
		if (!endereco) {
			return;
		}
		try {
			await navigator.clipboard.writeText(endereco);
			toast.success("Link copiado.");
		} catch {
			toast.error("Não deu para copiar. Selecione o link e copie à mão.");
		}
	}

	return (
		<section
			aria-labelledby="titulo-convite"
			className="flex min-w-0 flex-[1_1_360px] flex-col gap-4 rounded-lg border border-border bg-card p-5"
		>
			<div className="flex flex-col gap-0.5">
				<h2 id="titulo-convite" className="font-semibold">
					Convidar alguém
				</h2>
				<p className="text-sm text-pretty text-muted-foreground">{descricao} O link vale por 7 dias e para uma pessoa só.</p>
			</div>
			{endereco && (
				<div className="flex gap-2">
					<Input readOnly value={endereco} aria-label="Link do convite" onFocus={(evento) => evento.target.select()} />
					<Button variant="secondary" size="icon" onClick={copiar} aria-label="Copiar o link" title="Copiar o link">
						<CopyIcon />
					</Button>
				</div>
			)}
			<Button onClick={criarConvite} disabled={criacao.executando} className="self-start">
				{criacao.executando ? <Spinner data-icon="inline-start" /> : <LinkIcon data-icon="inline-start" />}
				{endereco ? "Criar outro link" : "Criar link de convite"}
			</Button>
		</section>
	);
}

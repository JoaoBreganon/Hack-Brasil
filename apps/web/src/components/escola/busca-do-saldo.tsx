"use client";

import { ehEscolaDeDemonstracao, formatarReais, LIMITES } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { FileUpIcon, LogInIcon, SearchIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { type ChangeEvent, useRef } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useConta } from "@/hooks/use-conta";
import { useOperacao } from "@/hooks/use-operacao";
import { enderecoDeEntrada } from "@/lib/conta";

const TIPOS_DA_PLANILHA = ".csv,text/csv,text/plain";

export function BuscaDoSaldo({ codigoInep }: { codigoInep: string }) {
	const consultar = useOperacao(useAction(api.pddeInfo.consultar));
	const importar = useOperacao(useMutation(api.saldos.importarPlanilha));
	const seletor = useRef<HTMLInputElement>(null);
	const conta = useConta();
	const caminhoAtual = usePathname();
	const ocupado = consultar.executando || importar.executando;

	async function buscar() {
		const resultado = await consultar.executar({ codigoInep });
		if (resultado?.aviso) {
			toast.warning(resultado.aviso);
		}
	}

	async function importarPlanilha(evento: ChangeEvent<HTMLInputElement>) {
		const [planilha] = evento.target.files ?? [];
		evento.target.value = "";
		if (!planilha) {
			return;
		}
		if (planilha.size > LIMITES.planilha) {
			toast.error("A planilha é grande demais. Deixe só a linha da escola e tente de novo.");
			return;
		}
		const resultado = await importar.executar({
			codigoInep,
			texto: await planilha.text(),
			nomeDoArquivo: planilha.name,
			nome: conta.usuario?.nome,
		});
		if (resultado) {
			toast.success(`Saldo de ${formatarReais(resultado.saldo.custeio + resultado.saldo.capital)} importado da planilha.`);
		}
	}

	return (
		<Empty className="rounded-lg border border-border bg-card py-16">
			<EmptyHeader>
				<EmptyTitle className="font-heading text-2xl font-bold">
					<h1>Ainda não temos o saldo desta escola</h1>
				</EmptyTitle>
				<EmptyDescription>O Aloca lê o saldo e as pendências da escola {codigoInep} no PDDE Info, do FNDE.</EmptyDescription>
			</EmptyHeader>
			<EmptyContent className="gap-6">
				<Button size="lg" onClick={buscar} disabled={ocupado}>
					{consultar.executando ? <Spinner data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
					{consultar.executando ? "Lendo o PDDE Info…" : "Buscar o saldo"}
				</Button>
				{!ehEscolaDeDemonstracao(codigoInep) && (
					<div className="flex w-full flex-col items-center gap-3 border-t border-regra pt-6">
						<p id="ajuda-da-planilha" className="text-[15px] text-pretty text-muted-foreground">
							O PDDE Info está fora do ar? Importe uma planilha CSV com as colunas código INEP, exercício, custeio e capital.
							{conta.usuario
								? " Quem importa passa a cuidar da escola no Aloca."
								: conta.configurada
									? " Para importar, entre com sua conta."
									: " A importação precisa de login, que não está ligado neste ambiente."}
						</p>
						<input
							ref={seletor}
							type="file"
							accept={TIPOS_DA_PLANILHA}
							onChange={importarPlanilha}
							className="hidden"
							tabIndex={-1}
							aria-hidden="true"
						/>
						{conta.configurada && !conta.usuario ? (
							<a href={enderecoDeEntrada(caminhoAtual)} className={buttonVariants({ variant: "secondary" })}>
								<LogInIcon data-icon="inline-start" />
								Entrar para importar
							</a>
						) : (
							<Button
								variant="secondary"
								onClick={() => seletor.current?.click()}
								disabled={ocupado || !conta.usuario}
								aria-describedby="ajuda-da-planilha"
							>
								{importar.executando ? <Spinner data-icon="inline-start" /> : <FileUpIcon data-icon="inline-start" />}
								{importar.executando ? "Importando…" : "Importar planilha CSV"}
							</Button>
						)}
					</div>
				)}
			</EmptyContent>
		</Empty>
	);
}

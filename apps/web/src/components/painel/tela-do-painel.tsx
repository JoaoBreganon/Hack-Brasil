"use client";

import { formatarData } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { PainelCarregado } from "@/components/escola/painel-carregado";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useOperacao } from "@/hooks/use-operacao";
import { CartaoDoPrazo } from "./cartao-do-prazo";
import { CartaoDoSaldo } from "./cartao-do-saldo";
import { Pendencias } from "./pendencias";
import { ProximosPassos } from "./proximos-passos";

function AtualizarSaldo({ codigoInep, coletadoEm }: { codigoInep: string; coletadoEm: number }) {
	const consultar = useAction(api.pddeInfo.consultar);
	const { executar, executando } = useOperacao(consultar);

	async function atualizar() {
		const resultado = await executar({ codigoInep, atualizar: true });
		if (resultado) {
			toast[resultado.aviso ? "warning" : "success"](resultado.aviso ?? "Saldo conferido no PDDE Info.");
		}
	}

	return (
		<>
			<span className="text-xs text-muted-foreground">Lido em {formatarData(new Date(coletadoEm))}</span>
			<Button variant="outline" size="sm" onClick={atualizar} disabled={executando}>
				{executando ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
				Atualizar
			</Button>
		</>
	);
}

export function TelaDoPainel() {
	return (
		<PainelCarregado>
			{({ codigoInep, dados, derivados }) => (
				<>
					<div className="flex flex-wrap items-stretch gap-6">
						<CartaoDoPrazo hoje={derivados.prazo.hoje} situacao={derivados.prazo.situacao} risco={derivados.prazo.risco} />
						<CartaoDoSaldo
							saldoTotal={derivados.saldoTotal}
							saldo={dados.saldo.saldo}
							noPlano={derivados.plano.totalPorCategoria}
							fonte={dados.saldo.fonte.nome}
							enderecoDaFonte={dados.saldo.fonte.endereco}
							rodape={<AtualizarSaldo codigoInep={codigoInep} coletadoEm={dados.saldo.coletadoEm} />}
						/>
					</div>
					<Pendencias pendencias={dados.saldo.pendencias} />
					<ProximosPassos codigoInep={codigoInep} dados={dados} plano={derivados.plano} />
					<p className="text-xs text-muted-foreground">
						Escola e saldo reais do PDDE Info. O prazo é uma simulação do exercício de {derivados.prazo.situacao.exercicio}, o
						primeiro com data de estorno.
					</p>
				</>
			)}
		</PainelCarregado>
	);
}

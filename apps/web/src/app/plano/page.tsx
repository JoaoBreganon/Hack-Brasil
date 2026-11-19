import type { Metadata } from "next";
import { CabecalhoDaEscola } from "@/components/plano/cabecalho-da-escola";
import { CartaoDoPrazo } from "@/components/plano/cartao-do-prazo";
import { CartaoDoSaldo } from "@/components/plano/cartao-do-saldo";
import { ForaDoPlano } from "@/components/plano/fora-do-plano";
import { TabelaDoPlano } from "@/components/plano/tabela-do-plano";
import { montarPainelDaEscolaExemplo } from "@/dados/painel-da-escola";

const PAINEL = montarPainelDaEscolaExemplo();

export const metadata: Metadata = {
	title: "Plano de compra",
	description: `Prazo, saldo e plano de compra do PDDE da ${PAINEL.escola.nome}, com três orçamentos por item e a regra de cada compra.`,
	alternates: { canonical: "/plano" },
};

export default function PaginaDoPlano() {
	const { escola, hoje, situacao, risco, plano } = PAINEL;

	return (
		<>
			<CabecalhoDaEscola nome={escola.nome} codigoInep={escola.codigoInep} municipio={escola.municipio} />
			<main className="mx-auto flex w-full max-w-[1240px] flex-col gap-12 px-4 pt-8 sm:px-8 sm:pt-10 pb-[72px]">
				<div className="flex flex-wrap items-stretch gap-6">
					<CartaoDoPrazo hoje={hoje} situacao={situacao} risco={risco} />
					<CartaoDoSaldo
						saldoTotal={escola.saldoTotalEmCentavos}
						saldo={escola.saldo}
						noPlano={plano.totalPorCategoria}
						fonte={escola.fonteDoSaldo}
						enderecoDaFonte={escola.enderecoDaFonte}
					/>
				</div>
				<TabelaDoPlano plano={plano} />
				<ForaDoPlano itens={plano.foraDoPlano} saldoRestante={plano.saldoRestante} />
				<footer className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-pauta pt-6">
					<p className="font-heading text-xl font-bold tracking-tight">
						Quem decide é sempre a escola. <span className="text-muted-foreground">O Aloca sugere, a APM aprova em ata.</span>
					</p>
					<p className="text-xs text-muted-foreground">
						Escola e saldo reais do PDDE Info · prazo simulado, plano e orçamentos de exemplo · Hack Brasil 2026
					</p>
				</footer>
			</main>
		</>
	);
}

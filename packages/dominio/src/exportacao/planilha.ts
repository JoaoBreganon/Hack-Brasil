import { formatarValor } from "../formato/formatar";
import { ORCAMENTOS_EXIGIDOS } from "../orcamento/orcamento";
import { type ItemDoPlano, motivoForaDoPlano, type PlanoDeCompra } from "../plano/plano";

const SEPARADOR = ";";
const QUEBRA = "\r\n";
const MARCA_DE_UTF8 = "﻿";
const INICIO_DE_FORMULA = /^[=+\-@\t\r]/;
const PRECISA_DE_ASPAS = /[";\r\n]/;

const CABECALHO = [
	"Prioridade",
	"Item",
	"Tipo de despesa",
	"Categoria",
	"Quantidade",
	"Situação",
	"Fornecedor escolhido",
	"Valor unitário (R$)",
	"Total (R$)",
	...Array.from({ length: ORCAMENTOS_EXIGIDOS }, (_, indice) => [`Orçamento ${indice + 1}`, `Valor ${indice + 1} (R$)`]).flat(),
	"Justificativa para menos orçamentos",
];

type Celula = string | number;

export function celulaDoCsv(valor: Celula): string {
	const texto = String(valor);
	const seguro = INICIO_DE_FORMULA.test(texto) ? `'${texto}` : texto;
	return PRECISA_DE_ASPAS.test(seguro) ? `"${seguro.replaceAll('"', '""')}"` : seguro;
}

function linhaDoItem({ necessidade, validacao }: ItemDoPlano, situacao: string): Celula[] {
	const cotacoes = validacao.escolha?.cotacoesOrdenadas ?? [];
	const vencedora = validacao.escolha?.vencedora;
	return [
		necessidade.prioridade,
		necessidade.descricao,
		necessidade.tipo,
		validacao.categoria ?? "",
		necessidade.quantidade,
		situacao,
		vencedora?.fornecedor ?? "",
		vencedora ? formatarValor(vencedora.valorEmCentavos) : "",
		validacao.aprovado ? formatarValor(validacao.totalEmCentavos) : "",
		...Array.from({ length: ORCAMENTOS_EXIGIDOS }, (_, indice) => {
			const cotacao = cotacoes[indice];
			return cotacao ? [cotacao.fornecedor, formatarValor(cotacao.valorEmCentavos)] : ["", ""];
		}).flat(),
		necessidade.justificativaParaMenosOrcamentos ?? "",
	];
}

export function montarPlanilhaDoPlano(plano: PlanoDeCompra): string {
	const { custeio, capital } = plano.totalPorCategoria;
	const linhas: Celula[][] = [
		CABECALHO,
		...plano.itens.map((item) => linhaDoItem(item, "Entra no plano")),
		...plano.foraDoPlano.map((item) => linhaDoItem(item, `Fica de fora: ${motivoForaDoPlano(item, plano.saldoRestante)}`)),
		[],
		["", "Total em custeio", "", "", "", "", "", "", formatarValor(custeio)],
		["", "Total em capital", "", "", "", "", "", "", formatarValor(capital)],
		["", "Total do plano", "", "", "", "", "", "", formatarValor(custeio + capital)],
	];
	return MARCA_DE_UTF8 + linhas.map((linha) => linha.map(celulaDoCsv).join(SEPARADOR)).join(QUEBRA) + QUEBRA;
}

export function nomeDaPlanilhaDoPlano(codigoInep: string, exercicio: number): string {
	return `plano-pdde-${codigoInep}-${exercicio}.csv`;
}

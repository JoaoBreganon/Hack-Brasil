import { describe, expect, it } from "vitest";
import { criarData } from "../calendario/calendario";
import { ESCOLA_EXEMPLO } from "../exemplos/escola-exemplo";
import {
	dividirPelosRepasses,
	enderecoDaConsultaPorEscola,
	lerConsultaPorEscola,
	registroDeSaldoDoPddeInfo,
	type RepasseDoPdde,
	saldoEmContaDoPddeBasico,
} from "./pdde-info";

type Cartao = {
	inep?: string;
	alertaDaUex?: string;
	impedimentoDaEex?: boolean;
	ocorrencia?: string;
	repassesDoPdde?: string;
};

const LINHAS_DE_REPASSE = `
	<tr><td>PDDE B&aacute;sico - 2ª Parcela</td><td align="right">3.396,00</td><td align="right">849,00</td><td align="right">4.245,00</td><td align="right">0,00</td><td align="right">0,00</td><td align="right">0,00</td><td align="right">4.245,00</td><td align="right">3.396,00</td><td align="right">849,00</td><td align="right">4.245,00</td><td>18/09/2026</td></tr>
	<tr><td>PDDE Básico - 1ª Parcela</td><td align="right">3.396,00</td><td align="right">849,00</td><td align="right">4.245,00</td><td align="right">0,00</td><td align="right">0,00</td><td align="right">0,00</td><td align="right">4.245,00</td><td align="right">0,00</td><td align="right">0,00</td><td align="right">0,00</td><td></td></tr>
	<tr><td>Subtotal</td><td align="right">6.792,00</td><td align="right">1.698,00</td><td align="right">8.490,00</td><td align="right">0,00</td><td align="right">0,00</td><td align="right">0,00</td><td align="right">8.490,00</td><td align="right">3.396,00</td><td align="right">849,00</td><td align="right">4.245,00</td><td>-</td></tr>`;

function paginaDaConsulta({
	inep = "35079923",
	alertaDaUex,
	impedimentoDaEex = false,
	ocorrencia = "",
	repassesDoPdde = LINHAS_DE_REPASSE,
}: Cartao = {}) {
	const statusDaUex = alertaDaUex
		? `<div class="govbr-text-alert"><strong>Prestação de Contas:</strong> ${alertaDaUex} </div>`
		: `<div class="govbr-text-success"><strong>Prestação de Contas:</strong> Não foi identificada pendência de prestação de contas no exercício consultado. </div>`;
	return `<html><body><form id="form-excel" method="post" action="/pddeinfo/pddeinfo/escola/excel">
<div class="escola-item escola-hide">
	<div class="govbr-school-card-header"><div class="govbr-school-card-header-left">
		<input type="checkbox" name="chk_excel[]" value="${inep}" class="chk-excel-item" id="chk-escola-${inep}">
		<input type="hidden" name="an_exercicio" value="2026">
		<button type="button" class="govbr-school-link-title">Escola TERUYO KIKUTA PROFA EMEF - COD ${inep} </button>
	</div></div>
	<div class="govbr-school-card-body" id="escola-details-${inep}">
		<div class="govbr-subcard">
			<div class="govbr-subcard-title">Dados da escola</div>
			<div class="govbr-subcard-content"><div class="grid-dados-escola">
				<div class="grid-dados-escola-item grid-dados-escola-full"><span class="label">Identificação:</span>
					<span class="value">TERUYO KIKUTA PROFA EMEF - ${inep}</span></div>
				<div class="grid-dados-escola-item"><span class="label">UF:</span> <span class="value">SP</span></div>
				<div class="grid-dados-escola-item"><span class="label">Município:</span> <span class="value">ADAMANTINA</span></div>
			</div></div>
		</div>
		<div class="govbr-subcard">
			<div class="govbr-subcard-title">Unidade Executora Própria (UEx)</div>
			<div class="govbr-subcard-content">
				<div class="grid-dados-escola-item"><span class="label">Executora:</span> <span class="value">APM DA EMEF PROFESSORA TERUYO KIKUTA</span></div>
				<span class="value receita-status"
					data-receita-cnpj="48.801.773/0001-01"
					data-receita-initial-impedimento="0"
					data-receita-initial="Indisponível para consulta">Indisponível para consulta</span>
				<span class="value govbr-text-alert receita-impedimento" style="display: none;">Esta situação pode suspender o repasse do PDDE.</span>
				<div class="govbr-text-success"><strong>Dados Cadastrais:</strong> Não há pendência quanto ao cadastro da UEx. </div>
				${statusDaUex}
			</div>
		</div>
		<div class="govbr-subcard">
			<div class="govbr-subcard-title">Situação da Entidade Executora - EEx</div>
			<div class="govbr-subcard-content">
				<span class="value receita-status"
					data-receita-cnpj="43.008.291/0001-77"
					data-receita-initial-impedimento="${impedimentoDaEex ? 1 : 0}"
					data-receita-initial="Inapta">Inapta</span>
				<div class="govbr-text-success" style="margin-bottom: 12px;"><strong>Adesão ao PDDE:</strong> A EEx aderiu ao PDDE neste exercício. </div>
			</div>
		</div>
		<div class="govbr-subcard">
			<div class="govbr-subcard-title">Dados Bancários da UEx (todos os programas)</div>
			<div class="govbr-subcard-content"><table class="govbr-table">
				<thead><tr><th>Programa/Ação</th><th>Banco</th><th>Agência</th><th>Conta</th><th>Saldo (R$)</th><th>Ocorrência</th></tr></thead>
				<tbody>
					<tr><td>PDDE</td><td>001</td><td>0470</td><td>0000223913</td><td>11,00</td><td>${ocorrencia}</td></tr>
					<tr><td>PDDE</td><td>001</td><td>0470</td><td>0000311987</td><td>19.788,15</td><td></td></tr>
					<tr><td>PDDE QUALIDADE</td><td>001</td><td>0470</td><td>0000311111</td><td>16.979,96</td><td></td></tr>
				</tbody>
			</table></div>
		</div>
		<div class="govbr-subcard govbr-program-card govbr-program-collapsed">
			<div class="govbr-subcard-title govbr-program-title"><button type="button" class="govbr-program-toggle">
				<span class="govbr-program-name">PDDE</span><span> - Múltiplas contas bancárias</span>
			</button></div>
			<div class="govbr-subcard-content govbr-program-content"><table class="govbr-table">
				<thead><tr><th>Destinação</th><th>Vl Devido Custeio</th><th>Vl Devido Capital</th><th>Vl Devido Total</th><th>Vl Ajuste Custeio</th><th>Vl Ajuste Capital</th><th>Vl Ajuste Total</th><th>Vl Final Devido Total</th><th>Vl Pago Custeio</th><th>Vl Pago Capital</th><th>Valor Pago Total</th><th>Data do Pagamento</th></tr></thead>
				<tbody>${repassesDoPdde}</tbody>
			</table></div>
		</div>
		<div class="govbr-subcard govbr-program-card govbr-program-collapsed">
			<div class="govbr-subcard-title govbr-program-title"><button type="button" class="govbr-program-toggle">
				<span class="govbr-program-name">PDDE QUALIDADE</span><span> - UEx</span>
				<span class="govbr-program-balance">Saldo em Conta: R$ 16.979,96</span>
			</button></div>
			<div class="govbr-subcard-content govbr-program-content">
				<div class="govbr-text-info" role="status">Nenhuma ordem de pagamento foi localizada para a escola consultada no ano informado.</div>
			</div>
		</div>
		<div class="govbr-subcard" style="margin-top: 10px;">
			<div class="govbr-subcard-title">Total Geral das Destinações</div>
		</div>
	</div>
</div>
</form></body></html>`;
}

describe("enderecoDaConsultaPorEscola", () => {
	it("monta a consulta pública por código INEP e ano", () => {
		expect(enderecoDaConsultaPorEscola("35079923", 2026)).toBe(
			"https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar?ano=2026&co_escola=35079923&consultar=Consultar",
		);
		expect(() => enderecoDaConsultaPorEscola("3507992", 2026)).toThrow(RangeError);
	});

	it("é o mesmo endereço guardado como fonte do saldo da escola de demonstração", () => {
		expect(ESCOLA_EXEMPLO.enderecoDaFonte).toBe(
			enderecoDaConsultaPorEscola(ESCOLA_EXEMPLO.codigoInep, ESCOLA_EXEMPLO.exercicioDoSaldo),
		);
	});
});

describe("lerConsultaPorEscola", () => {
	it("lê a escola, as contas e os repasses do cartão da escola", () => {
		expect(lerConsultaPorEscola(paginaDaConsulta(), "35079923")).toEqual({
			escola: { codigoInep: "35079923", nome: "TERUYO KIKUTA PROFA EMEF", municipio: "ADAMANTINA/SP" },
			exercicio: 2026,
			contas: [
				{ programa: "PDDE", saldoEmCentavos: 1_100 },
				{ programa: "PDDE", saldoEmCentavos: 1_978_815 },
				{ programa: "PDDE QUALIDADE", saldoEmCentavos: 1_697_996 },
			],
			repasses: [
				{
					programa: "PDDE",
					destinacao: "PDDE Básico - 2ª Parcela",
					devido: { custeio: 339_600, capital: 84_900 },
					pago: { custeio: 339_600, capital: 84_900 },
					pagoEm: criarData(2026, 9, 18),
				},
				{
					programa: "PDDE",
					destinacao: "PDDE Básico - 1ª Parcela",
					devido: { custeio: 339_600, capital: 84_900 },
					pago: { custeio: 0, capital: 0 },
					pagoEm: null,
				},
			],
			pendencias: [],
		});
	});

	it("aponta pendências da UEx, impedimento na Receita e ocorrência na conta", () => {
		const pagina = paginaDaConsulta({
			alertaDaUex: "Há pendência de prestação de contas no exercício de 2025.",
			impedimentoDaEex: true,
			ocorrencia: "CONTA BLOQUEADA",
		});
		expect(lerConsultaPorEscola(pagina, "35079923")?.pendencias).toEqual([
			{ entidade: "UEx", assunto: "Prestação de Contas", mensagem: "Há pendência de prestação de contas no exercício de 2025." },
			{
				entidade: "EEx",
				assunto: "Situação na Receita Federal",
				mensagem: "Inapta. Esta situação pode suspender o repasse do PDDE.",
			},
			{ entidade: "UEx", assunto: "Conta bancária", mensagem: "PDDE: CONTA BLOQUEADA" },
		]);
	});

	it("devolve null quando a escola não aparece na página", () => {
		expect(lerConsultaPorEscola(paginaDaConsulta(), "12345678")).toBeNull();
		expect(lerConsultaPorEscola("<html></html>", "35079923")).toBeNull();
	});

	it("mantém como texto uma entidade HTML fora do Unicode em vez de quebrar a leitura", () => {
		const pagina = paginaDaConsulta({ ocorrencia: "CONTA &#99999999; BLOQUEADA &#x41;" });
		expect(lerConsultaPorEscola(pagina, "35079923")?.pendencias).toContainEqual({
			entidade: "UEx",
			assunto: "Conta bancária",
			mensagem: "PDDE: CONTA &#99999999; BLOQUEADA A",
		});
	});

	it("avisa quando o PDDE Info muda de formato em vez de gravar valor errado", () => {
		const pagina = paginaDaConsulta({ repassesDoPdde: LINHAS_DE_REPASSE.replace("3.396,00", "n/d") });
		expect(() => lerConsultaPorEscola(pagina, "35079923")).toThrow('"n/d" não é um valor em reais');
	});
});

describe("saldo a partir do PDDE Info", () => {
	const repasse = (programa: string, custeio: number, capital: number): RepasseDoPdde => ({
		programa,
		destinacao: "Parcela",
		devido: { custeio, capital },
		pago: { custeio, capital },
		pagoEm: null,
	});

	it("soma só as contas do PDDE Básico", () => {
		const situacao = lerConsultaPorEscola(paginaDaConsulta(), "35079923");
		expect(situacao && saldoEmContaDoPddeBasico(situacao.contas)).toBe(1_979_915);
	});

	it("divide custeio e capital na proporção do que o PDDE Básico pagou no ano", () => {
		expect(dividirPelosRepasses(100_000, [repasse("PDDE", 326_100, 217_400), repasse("PDDE QUALIDADE", 245_100, 0)])).toEqual({
			custeio: 60_000,
			capital: 40_000,
		});
		expect(dividirPelosRepasses(100_000, [repasse("PDDE QUALIDADE", 245_100, 0)])).toBeNull();
	});

	it("grava o saldo com a fonte, o endereço da consulta e o horário da coleta", () => {
		const coletadoEm = new Date("2026-11-18T23:30:00Z");
		const situacao = lerConsultaPorEscola(paginaDaConsulta(), "35079923");
		expect(situacao && registroDeSaldoDoPddeInfo(situacao, coletadoEm)).toEqual({
			codigoInep: "35079923",
			exercicio: 2026,
			saldo: { custeio: 1_583_932, capital: 395_983 },
			fonte: {
				nome: "PDDE Info (FNDE), saldo das contas do PDDE. Custeio e capital divididos na proporção dos repasses de 2026.",
				endereco: "https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar?ano=2026&co_escola=35079923&consultar=Consultar",
			},
			coletadoEm,
		});
	});

	it("usa o percentual padrão quando o ano ainda não teve repasse pago", () => {
		const pagina = paginaDaConsulta({ repassesDoPdde: "" });
		const situacao = lerConsultaPorEscola(pagina, "35079923");
		const registro = situacao && registroDeSaldoDoPddeInfo(situacao, new Date());
		expect(registro?.saldo).toEqual({ custeio: 1_583_932, capital: 395_983 });
		expect(registro?.fonte.nome).toContain("pelo percentual padrão de 80% e 20%");
	});
});

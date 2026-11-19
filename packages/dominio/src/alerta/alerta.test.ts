import { describe, expect, it } from "vitest";
import { criarData } from "../calendario/calendario";
import { situacaoDoPrazo } from "../prazo/prazo";
import {
	LIMITE_DO_SMS,
	preencherTemplate,
	TEMPLATE_DO_SMS,
	TEMPLATE_DO_WHATSAPP,
	type DadosDoAlerta,
	variaveisDoSms,
	variaveisDoWhatsapp,
} from "./alerta";

function marcadores(template: string): number[] {
	return [...template.matchAll(/\{\{(\d+)\}\}/g)].map(([, posicao]) => Number(posicao));
}

function dadosDaDemo(): DadosDoAlerta {
	const situacao = situacaoDoPrazo(2027, criarData(2027, 12, 15));
	if (situacao.tipo !== "correndo") {
		throw new Error("O prazo da demo precisa estar correndo.");
	}
	return {
		nomeDaEscola: "EMEF Professora Teruyo Kikuta",
		diasUteisRestantes: situacao.diasUteisRestantes,
		saldoEmRiscoEmCentavos: 1_979_915,
		limiteParaUso: situacao.limiteParaUso,
	};
}

describe("template do WhatsApp", () => {
	it("segue as regras da Meta para templates de utilidade", () => {
		const { nome, cabecalho, corpo, rodape } = TEMPLATE_DO_WHATSAPP;
		expect(nome).toMatch(/^[a-z0-9_]{1,512}$/);
		expect(cabecalho.length).toBeLessThanOrEqual(60);
		expect(rodape.length).toBeLessThanOrEqual(60);
		expect(corpo.length).toBeLessThanOrEqual(1024);
		expect(marcadores(corpo)).toEqual([1, 2, 3, 4]);
		expect(corpo).not.toMatch(/^\s*\{\{|\}\}\s*$/);
		expect(corpo).not.toMatch(/\}\}\s*\{\{/);
		expect(corpo).not.toMatch(/\n{3,}/);
	});

	it("preenche o aviso da escola da demo", () => {
		expect(variaveisDoWhatsapp(dadosDaDemo())).toEqual(["EMEF Professora Teruyo Kikuta", "43", "19.799,15", "14 de fevereiro de 2028"]);
		expect(preencherTemplate(TEMPLATE_DO_WHATSAPP.corpo, variaveisDoWhatsapp(dadosDaDemo()))).toBe(
			[
				"Aviso do Aloca sobre o PDDE da escola EMEF Professora Teruyo Kikuta.",
				"",
				"Dias úteis restantes: 43",
				"Saldo em risco: R$ 19.799,15",
				"Prazo final para uso: 14 de fevereiro de 2028",
				"",
				"Pela regra do FNDE, o saldo que não for usado até essa data é estornado. Abra o plano de compra no Aloca para ver o que a escola pode comprar dentro das regras do programa.",
			].join("\n"),
		);
	});

	it("tira quebras de linha das variáveis, que a Meta recusa", () => {
		expect(variaveisDoWhatsapp({ ...dadosDaDemo(), nomeDaEscola: " EMEF\n  Professora\tTeruyo " })[0]).toBe("EMEF Professora Teruyo");
	});
});

describe("SMS de reserva", () => {
	it("cabe em um SMS sem acento mesmo com nome longo e saldo alto", () => {
		const sms = preencherTemplate(
			TEMPLATE_DO_SMS,
			variaveisDoSms({
				nomeDaEscola: "Escola Estadual de Ensino Fundamental e Médio Professora Maria da Conceição Ribeiro",
				diasUteisRestantes: 999,
				saldoEmRiscoEmCentavos: 9_999_999_999,
				limiteParaUso: criarData(2028, 2, 14),
			}),
		);
		expect(sms.length).toBeLessThanOrEqual(LIMITE_DO_SMS);
		expect(sms).toMatch(/^[\x20-\x7e]+$/);
		expect(marcadores(TEMPLATE_DO_SMS)).toEqual([1, 2, 3, 4]);
	});

	it("escreve o aviso da demo e trata o singular de dia útil", () => {
		expect(preencherTemplate(TEMPLATE_DO_SMS, variaveisDoSms(dadosDaDemo()))).toBe(
			"Aloca: PDDE da EMEF Professora Teruyo Kikuta. Prazo de 43 dias uteis para usar R$ 19.799,15, ate 14/02/2028. Depois o saldo e estornado.",
		);
		expect(variaveisDoSms({ ...dadosDaDemo(), nomeDaEscola: "Profª Conceição", diasUteisRestantes: 1 }).slice(0, 2)).toEqual([
			"Profa Conceicao",
			"1 dia util",
		]);
	});

	it("recusa template com variável faltando", () => {
		expect(() => preencherTemplate(TEMPLATE_DO_SMS, ["Escola"])).toThrow(RangeError);
	});
});

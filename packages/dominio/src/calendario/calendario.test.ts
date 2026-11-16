import { describe, expect, it } from "vitest";
import { criarData, diasUteisAte, domingoDePascoa, ehDiaUtil, enesimoDiaUtilDoMes, listarDiasUteis, paraTextoIso } from "./calendario";

describe("domingoDePascoa", () => {
	it.each([
		[2026, "2026-04-05"],
		[2027, "2027-03-28"],
		[2028, "2028-04-16"],
		[2029, "2029-04-01"],
	])("calcula a Páscoa de %i", (ano, esperado) => {
		expect(paraTextoIso(domingoDePascoa(ano))).toBe(esperado);
	});
});

describe("ehDiaUtil", () => {
	it("não conta fim de semana", () => {
		expect(ehDiaUtil(criarData(2028, 2, 5))).toBe(false);
		expect(ehDiaUtil(criarData(2028, 2, 6))).toBe(false);
	});

	it("não conta feriado nacional, incluindo o Dia da Consciência Negra", () => {
		expect(ehDiaUtil(criarData(2027, 11, 15))).toBe(false);
		expect(ehDiaUtil(criarData(2028, 11, 20))).toBe(false);
	});

	it("trata a segunda e a terça de Carnaval como dias sem expediente bancário, por padrão", () => {
		expect(ehDiaUtil(criarData(2029, 2, 12))).toBe(false);
		expect(ehDiaUtil(criarData(2029, 2, 13))).toBe(false);
		expect(ehDiaUtil(criarData(2029, 2, 13), { carnavalSemExpedienteBancario: false })).toBe(true);
	});
});

describe("enesimoDiaUtilDoMes", () => {
	it("acha o 10º dia útil de fevereiro de 2028", () => {
		expect(paraTextoIso(enesimoDiaUtilDoMes(2028, 2, 10))).toBe("2028-02-14");
	});

	it("pula o Carnaval quando ele cai antes do 10º dia útil", () => {
		expect(paraTextoIso(enesimoDiaUtilDoMes(2029, 2, 10))).toBe("2029-02-16");
		expect(paraTextoIso(enesimoDiaUtilDoMes(2029, 2, 10, { carnavalSemExpedienteBancario: false }))).toBe("2029-02-14");
	});

	it("recusa uma posição que o mês não tem", () => {
		expect(() => enesimoDiaUtilDoMes(2028, 2, 30)).toThrow(RangeError);
	});
});

describe("diasUteisAte", () => {
	it("conta os dias úteis de um intervalo, com as duas pontas", () => {
		expect(diasUteisAte(criarData(2028, 2, 1), criarData(2028, 2, 14))).toBe(10);
	});
});

describe("listarDiasUteis", () => {
	it("lista só os dias úteis, pulando fim de semana e feriado", () => {
		const dias = listarDiasUteis(criarData(2027, 12, 23), criarData(2027, 12, 28)).map(paraTextoIso);
		expect(dias).toEqual(["2027-12-23", "2027-12-24", "2027-12-27", "2027-12-28"]);
	});

	it("devolve lista vazia quando o início passa do fim", () => {
		expect(listarDiasUteis(criarData(2028, 2, 15), criarData(2028, 2, 14))).toEqual([]);
	});
});

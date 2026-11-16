import { describe, expect, it } from "vitest";
import { importarSaldosCsv, lerValorEmCentavos } from "./saldos";

const FONTE = { nome: "Planilha saldos-2027.csv" };
const COLETADO_EM = new Date("2027-12-01T13:00:00Z");

describe("lerValorEmCentavos", () => {
	it("entende valores em reais no formato brasileiro e no formato com ponto", () => {
		expect(lerValorEmCentavos("R$ 14.744,00")).toBe(1_474_400);
		expect(lerValorEmCentavos("1234,5")).toBe(123_450);
		expect(lerValorEmCentavos("1.234")).toBe(123_400);
		expect(lerValorEmCentavos("3686.25")).toBe(368_625);
		expect(lerValorEmCentavos("0")).toBe(0);
		expect(lerValorEmCentavos("-10,00")).toBe(-1_000);
	});

	it("recusa o que não é valor", () => {
		expect(lerValorEmCentavos("")).toBeNull();
		expect(lerValorEmCentavos("abc")).toBeNull();
		expect(lerValorEmCentavos("1,2,3")).toBeNull();
		expect(lerValorEmCentavos("10,123")).toBeNull();
	});
});

describe("importarSaldosCsv", () => {
	it("importa a planilha com cabeçalho acentuado e guarda a fonte e o horário da coleta", () => {
		const csv = "Código INEP;Exercício;Saldo Custeio;Saldo Capital\n00000000;2027;R$ 14.744,00;3.686,00\n12345678;2027;0;500\n";
		expect(importarSaldosCsv(csv, FONTE, COLETADO_EM)).toEqual({
			registros: [
				{
					codigoInep: "00000000",
					exercicio: 2027,
					saldo: { custeio: 1_474_400, capital: 368_600 },
					fonte: FONTE,
					coletadoEm: COLETADO_EM,
				},
				{ codigoInep: "12345678", exercicio: 2027, saldo: { custeio: 0, capital: 50_000 }, fonte: FONTE, coletadoEm: COLETADO_EM },
			],
			erros: [],
		});
	});

	it("aceita vírgula como separador com valores entre aspas e colunas em outra ordem", () => {
		const csv = 'capital,custeio,ano,inep\n"1.000,50","2.000,00",2027,00000000';
		const { registros, erros } = importarSaldosCsv(csv, FONTE, COLETADO_EM);
		expect(erros).toEqual([]);
		expect(registros[0].saldo).toEqual({ custeio: 200_000, capital: 100_050 });
	});

	it("aponta cada linha com problema e importa as demais", () => {
		const csv = [
			"inep;exercicio;custeio;capital",
			"00000000;2027;100,00;50,00",
			"1234;27;abc;-5,00",
			"00000000;2027;1,00;1,00",
			"87654321;2028;10;",
		].join("\n");
		const { registros, erros } = importarSaldosCsv(csv, FONTE, COLETADO_EM);
		expect(registros.map((registro) => registro.codigoInep)).toEqual(["00000000"]);
		expect(erros).toEqual([
			{
				linha: 3,
				mensagem:
					'Linha 3: código INEP "1234" precisa ter 8 dígitos; exercício "27" precisa ser um ano com 4 dígitos; custeio "abc" não é um valor em reais; capital não pode ser negativo.',
			},
			{ linha: 4, mensagem: "Linha 4: a escola 00000000 já aparece no exercício 2027 na linha 2." },
			{ linha: 5, mensagem: 'Linha 5: capital "" não é um valor em reais.' },
		]);
	});

	it("recusa arquivo vazio ou sem as colunas obrigatórias", () => {
		expect(importarSaldosCsv("", FONTE, COLETADO_EM)).toEqual({
			registros: [],
			erros: [{ linha: 1, mensagem: "O arquivo está vazio." }],
		});
		expect(importarSaldosCsv("inep;total\n00000000;10", FONTE, COLETADO_EM).erros).toEqual([
			{ linha: 1, mensagem: "Faltam as colunas: exercício, custeio, capital." },
		]);
	});
});

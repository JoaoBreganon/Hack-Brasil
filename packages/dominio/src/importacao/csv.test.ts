import { describe, expect, it } from "vitest";
import { detectarDelimitador, lerCsv } from "./csv";

describe("detectarDelimitador", () => {
	it("escolhe o separador mais frequente no cabeçalho, ignorando o que está entre aspas", () => {
		expect(detectarDelimitador("inep;exercicio;custeio;capital")).toBe(";");
		expect(detectarDelimitador("inep\texercicio\tcusteio")).toBe("\t");
		expect(detectarDelimitador('inep,"saldo; total",capital')).toBe(",");
	});
});

describe("lerCsv", () => {
	it("lê campos com aspas, aspas escapadas e o BOM do Excel", () => {
		expect(lerCsv('\uFEFFnome;valor\n"Escola ""Aurora""";"1.234,56"\n')).toEqual([
			{ numero: 1, campos: ["nome", "valor"] },
			{ numero: 2, campos: ['Escola "Aurora"', "1.234,56"] },
		]);
	});

	it("aceita CRLF, pula linhas vazias e numera pela linha onde cada registro começa", () => {
		expect(lerCsv('a,b\r\n\r\n"x\r\ny",1\r\nz,2')).toEqual([
			{ numero: 1, campos: ["a", "b"] },
			{ numero: 3, campos: ["x\ny", "1"] },
			{ numero: 5, campos: ["z", "2"] },
		]);
	});

	it("devolve lista vazia para texto vazio", () => {
		expect(lerCsv("")).toEqual([]);
		expect(lerCsv("\n\n")).toEqual([]);
	});
});

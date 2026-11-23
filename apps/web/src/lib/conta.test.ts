import { describe, expect, it } from "vitest";
import { caminhoDeVolta, enderecoDeEntrada } from "./conta";

describe("caminhoDeVolta", () => {
	it("aceita só caminhos do próprio site", () => {
		expect(caminhoDeVolta("/escola/35079923/compras?item=novo")).toBe("/escola/35079923/compras?item=novo");
		expect(caminhoDeVolta("/convite/abc")).toBe("/convite/abc");
	});

	it("troca por /entrar o que poderia levar para outro site", () => {
		for (const texto of [
			"//malicioso.com",
			"/\\malicioso.com",
			"/\t/malicioso.com",
			"/\r\n/malicioso.com",
			"/\u0000/malicioso.com",
			"/escola\\malicioso.com",
			"https://malicioso.com",
			"javascript:alert(1)",
			"",
			null,
			undefined,
		]) {
			expect(caminhoDeVolta(texto)).toBe("/entrar");
		}
	});
});

describe("enderecoDeEntrada", () => {
	it("leva o caminho de volta codificado", () => {
		expect(enderecoDeEntrada("/escola/35079923?item=novo")).toBe("/conta/entrar?voltar=%2Fescola%2F35079923%3Fitem%3Dnovo");
	});
});

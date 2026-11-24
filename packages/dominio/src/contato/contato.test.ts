import { describe, expect, it } from "vitest";
import { mascararCelular, mascararEmail, normalizarCelular, normalizarEmail, validarNomeDoContato } from "./contato";

describe("normalizarCelular", () => {
	it("aceita celular com DDD, com ou sem código do país e máscara", () => {
		expect(normalizarCelular("(18) 99123-4567")).toBe("5518991234567");
		expect(normalizarCelular("+55 18 99123 4567")).toBe("5518991234567");
	});

	it("recusa fixo, número curto e DDD inválido", () => {
		expect(normalizarCelular("(18) 3521-4567")).toBeNull();
		expect(normalizarCelular("99123-4567")).toBeNull();
		expect(normalizarCelular("(01) 99123-4567")).toBeNull();
	});
});

describe("mascararCelular", () => {
	it("mostra só o DDD e os quatro últimos dígitos", () => {
		expect(mascararCelular("5518991234567")).toBe("(18) •••••-4567");
	});
});

describe("validarNomeDoContato", () => {
	it("limpa espaços e recusa nome curto", () => {
		expect(validarNomeDoContato("  Maria   Souza ")).toBe("Maria Souza");
		expect(validarNomeDoContato("M")).toBeNull();
	});
});

describe("normalizarEmail", () => {
	it("limpa espaços e põe em minúsculas", () => {
		expect(normalizarEmail("  Maria.Souza@Escola.SP.gov.br ")).toBe("maria.souza@escola.sp.gov.br");
	});

	it("recusa endereço sem domínio, com espaço ou com caracteres de HTML", () => {
		expect(normalizarEmail("maria@escola")).toBeNull();
		expect(normalizarEmail("maria souza@escola.com")).toBeNull();
		expect(normalizarEmail("<maria>@escola.com")).toBeNull();
		expect(normalizarEmail(`${"a".repeat(250)}@escola.com`)).toBeNull();
	});
});

describe("mascararEmail", () => {
	it("mostra só a primeira letra e o domínio", () => {
		expect(mascararEmail("maria@escola.com")).toBe("m•••@escola.com");
	});
});

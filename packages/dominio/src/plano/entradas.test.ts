import { describe, expect, it } from "vitest";
import { ehEnderecoWeb, LIMITES, validarCotacao, validarJustificativa, validarNecessidade, validarPedido } from "./entradas";

describe("validarNecessidade", () => {
	it("aceita um item válido e limpa os espaços da descrição", () => {
		expect(validarNecessidade({ descricao: "  Livros   de literatura ", tipo: "livro", quantidade: 30, prioridade: 1 })).toEqual({
			ok: true,
			valor: { descricao: "Livros de literatura", tipo: "livro", quantidade: 30, prioridade: 1 },
		});
	});

	it("aponta cada campo inválido", () => {
		const resultado = validarNecessidade({ descricao: "a", tipo: "carro", quantidade: 1.5, prioridade: 0 });
		expect(resultado.ok).toBe(false);
		expect(resultado.ok ? [] : Object.keys(resultado.erros).sort()).toEqual(["descricao", "prioridade", "quantidade", "tipo"]);
	});

	it("recusa quantidade que não é número", () => {
		expect(validarNecessidade({ descricao: "Cadeiras", tipo: "material permanente", quantidade: Number.NaN, prioridade: 1 }).ok).toBe(
			false,
		);
	});
});

describe("validarCotacao", () => {
	it("aceita fornecedor, preço e link https", () => {
		expect(validarCotacao({ fornecedor: "Loja A", valorEmCentavos: 129_990, endereco: " https://loja.com.br/item " })).toEqual({
			ok: true,
			valor: { fornecedor: "Loja A", valorEmCentavos: 129_990, endereco: "https://loja.com.br/item" },
		});
	});

	it("deixa o link de fora quando vem vazio", () => {
		expect(validarCotacao({ fornecedor: "Loja A", valorEmCentavos: 100, endereco: "  " })).toEqual({
			ok: true,
			valor: { fornecedor: "Loja A", valorEmCentavos: 100 },
		});
	});

	it("recusa preço vazio, zero e link que não é da web", () => {
		const resultado = validarCotacao({ fornecedor: "L", valorEmCentavos: null, endereco: "javascript:alert(1)" });
		expect(resultado.ok ? [] : Object.keys(resultado.erros).sort()).toEqual(["endereco", "fornecedor", "valorEmCentavos"]);
		expect(validarCotacao({ fornecedor: "Loja", valorEmCentavos: 0 }).ok).toBe(false);
	});
});

describe("validarJustificativa", () => {
	it("pede um texto com tamanho mínimo", () => {
		expect(validarJustificativa("curta").ok).toBe(false);
		expect(validarJustificativa("Só existe uma vidraçaria na cidade.")).toEqual({
			ok: true,
			valor: { justificativa: "Só existe uma vidraçaria na cidade." },
		});
	});
});

describe("validarPedido", () => {
	it("aceita pedido vazio e junta as linhas do texto", () => {
		expect(validarPedido("")).toEqual({ ok: true, valor: { pedido: "" } });
		expect(validarPedido("  livros\n\nventiladores  ")).toEqual({ ok: true, valor: { pedido: "livros ventiladores" } });
	});

	it("recusa pedido longo demais", () => {
		expect(validarPedido("a".repeat(LIMITES.pedido.maximo + 1)).ok).toBe(false);
	});
});

describe("ehEnderecoWeb", () => {
	it("aceita só https", () => {
		expect(ehEnderecoWeb("https://a.com")).toBe(true);
		expect(ehEnderecoWeb("http://a.com")).toBe(false);
		expect(ehEnderecoWeb("HTTP://a.com")).toBe(false);
		expect(ehEnderecoWeb("ftp://a.com")).toBe(false);
		expect(ehEnderecoWeb("loja.com")).toBe(false);
	});
});

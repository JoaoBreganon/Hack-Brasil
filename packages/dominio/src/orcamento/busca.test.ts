import { describe, expect, it } from "vitest";
import { consultaDePreco, cotacoesDaBusca } from "./busca";

describe("cotacoesDaBusca", () => {
	it("fica com as três lojas mais baratas, uma oferta por loja", () => {
		const cotacoes = cotacoesDaBusca([
			{ url: "https://www.loja-a.com.br/roteador", json: { loja: "Loja A", preco: "R$ 1.299,90" } },
			{ url: "https://loja-a.com.br/roteador-2", json: { loja: "Loja A", preco: "1.199,00" } },
			{ url: "https://loja-b.com.br/p", json: { loja: "Loja B", preco: 1250.5 } },
			{ url: "https://loja-c.com.br/p", json: { preco: "R$ 1.399,00" } },
			{ url: "https://loja-d.com.br/p", json: { loja: "Loja D", preco: "1.500,00" } },
		]);
		expect(cotacoes).toEqual([
			{ fornecedor: "Loja A", valorEmCentavos: 119_900, endereco: "https://loja-a.com.br/roteador-2" },
			{ fornecedor: "Loja B", valorEmCentavos: 125_050, endereco: "https://loja-b.com.br/p" },
			{ fornecedor: "loja-c.com.br", valorEmCentavos: 139_900, endereco: "https://loja-c.com.br/p" },
		]);
	});

	it("ignora resultado sem preço, sem https ou com preço absurdo", () => {
		expect(
			cotacoesDaBusca([
				{ url: "https://a.com/p", json: { loja: "A", preco: "" } },
				{ url: "http://b.com/p", json: { loja: "B", preco: "10,00" } },
				{ url: "https://c.com/p", json: { loja: "C", preco: "99.999.999,00" } },
				{ url: "https://d.com/p" },
				{ url: "nada", json: { loja: "E", preco: "10,00" } },
			]),
		).toEqual([]);
	});
});

describe("consultaDePreco", () => {
	it("monta a busca a partir da descrição", () => {
		expect(consultaDePreco("  Roteador   Wi-Fi 6 ")).toBe("Roteador Wi-Fi 6 preço comprar");
	});
});

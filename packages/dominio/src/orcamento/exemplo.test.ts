import { describe, expect, it } from "vitest";
import { validarCotacao } from "../plano/entradas";
import { REGRAS_POR_TIPO, TIPOS_DE_DESPESA, type TipoDeDespesa } from "../regras/regras";
import { cotacoesDeExemplo, MODELOS_DO_EXEMPLO } from "./exemplo";

const PERMITIDOS = TIPOS_DE_DESPESA.filter((tipo) => REGRAS_POR_TIPO[tipo].permitido);
const VEDADOS = TIPOS_DE_DESPESA.filter((tipo) => !REGRAS_POR_TIPO[tipo].permitido);

describe("cotacoesDeExemplo", () => {
	it("tem um modelo de fornecedor e preço para cada tipo que o PDDE paga", () => {
		expect(Object.keys(MODELOS_DO_EXEMPLO).sort()).toEqual([...PERMITIDOS].sort());
	});

	it("gera três orçamentos válidos, do menor para o maior, com fornecedores do tipo do item", () => {
		const fornecedores: Partial<Record<TipoDeDespesa, string>> = {
			livro: "Livraria",
			"material de consumo": "Papelaria",
			"pequeno reparo": "Prestador de reparos",
			serviço: "Prestador de serviços",
			"material permanente": "Loja",
		};
		for (const tipo of PERMITIDOS) {
			const cotacoes = cotacoesDeExemplo({ descricao: "Item qualquer da escola", tipo });
			expect(cotacoes.map(({ fornecedor }) => fornecedor)).toEqual(["A", "B", "C"].map((letra) => `${fornecedores[tipo]} ${letra}`));
			expect(cotacoes.every((cotacao) => validarCotacao(cotacao).ok)).toBe(true);
			const valores = cotacoes.map(({ valorEmCentavos }) => valorEmCentavos);
			expect(valores).toEqual([...valores].sort((a, b) => a - b));
			expect(new Set(valores).size).toBe(3);
		}
	});

	it("dá sempre os mesmos preços para o mesmo item", () => {
		const item = { descricao: "Ventilador de parede para a sala 2", tipo: "material permanente" as const };
		expect(cotacoesDeExemplo(item)).toEqual(cotacoesDeExemplo({ ...item, descricao: "  ventilador de PAREDE para a sala 2 " }));
	});

	it("parte do preço de referência do catálogo quando a descrição combina", () => {
		const [livro] = cotacoesDeExemplo({ descricao: "Livros de literatura para a biblioteca", tipo: "livro" });
		const [notebook] = cotacoesDeExemplo({ descricao: "Notebook para uso pedagógico", tipo: "material permanente" });
		expect(livro.valorEmCentavos).toBeGreaterThan(4_000);
		expect(livro.valorEmCentavos).toBeLessThan(5_000);
		expect(notebook.valorEmCentavos).toBeGreaterThan(330_000);
		expect(notebook.valorEmCentavos).toBeLessThan(370_000);
	});

	it("não repete fornecedor que o item já tem e respeita o limite", () => {
		const cotacoes = cotacoesDeExemplo(
			{ descricao: "Resma de papel sulfite A4", tipo: "material de consumo" },
			["papelaria a", "Papelaria  C"],
			2,
		);
		expect(cotacoes.map(({ fornecedor }) => fornecedor)).toEqual(["Papelaria B", "Papelaria D"]);
	});

	it("gera no máximo três orçamentos", () => {
		expect(cotacoesDeExemplo({ descricao: "Pintura de sala de aula", tipo: "pequeno reparo" }, [], 10)).toHaveLength(3);
		expect(cotacoesDeExemplo({ descricao: "Pintura de sala de aula", tipo: "pequeno reparo" }, [], 0)).toEqual([]);
	});

	it("não inventa preço para despesa que o PDDE não paga", () => {
		for (const tipo of VEDADOS) {
			expect(cotacoesDeExemplo({ descricao: "Conta de luz de dezembro", tipo })).toEqual([]);
		}
	});
});

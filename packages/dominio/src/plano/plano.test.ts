import { describe, expect, it } from "vitest";
import { ESCOLA_EXEMPLO, NECESSIDADES_EXEMPLO } from "../exemplos/escola-exemplo";
import type { ItemDeCompra } from "../regras/regras";
import { montarPlanoDeCompra, motivoForaDoPlano } from "./plano";

function item(parcial: Partial<ItemDeCompra>): ItemDeCompra {
	return {
		id: "item",
		descricao: "Item",
		tipo: "material de consumo",
		quantidade: 1,
		cotacoes: [
			{ fornecedor: "A", valorEmCentavos: 10_000 },
			{ fornecedor: "B", valorEmCentavos: 12_000 },
			{ fornecedor: "C", valorEmCentavos: 15_000 },
		],
		...parcial,
	};
}

describe("montarPlanoDeCompra", () => {
	it("monta o plano da escola exemplo dentro do saldo de cada categoria", () => {
		const plano = montarPlanoDeCompra(ESCOLA_EXEMPLO.saldo, NECESSIDADES_EXEMPLO);
		expect(plano.itens.map((entrada) => entrada.necessidade.id)).toEqual(["livros", "roteador", "material-pedagogico", "janelas"]);
		expect(plano.foraDoPlano.map((entrada) => entrada.necessidade.id)).toEqual(["projetor", "conta-de-luz"]);
		expect(plano.totalPorCategoria).toEqual({ custeio: 1_085_000, capital: 258_000 });
		expect(plano.saldoRestante).toEqual({ custeio: 498_932, capital: 137_983 });
	});

	it("nunca deixa o saldo de uma categoria negativo", () => {
		const plano = montarPlanoDeCompra({ custeio: 15_000, capital: 0 }, [
			{ ...item({ id: "a" }), prioridade: 1 },
			{ ...item({ id: "b" }), prioridade: 2 },
		]);
		expect(plano.itens).toHaveLength(1);
		expect(plano.saldoRestante.custeio).toBe(5_000);
	});
});

describe("motivoForaDoPlano", () => {
	const plano = montarPlanoDeCompra({ custeio: 2_000_000, capital: 100_000 }, [
		...NECESSIDADES_EXEMPLO,
		{ id: "cadeiras", descricao: "Cadeiras", tipo: "material permanente", quantidade: 20, prioridade: 7, cotacoes: [] },
		{
			id: "mesa",
			descricao: "Mesa",
			tipo: "material permanente",
			quantidade: 1,
			prioridade: 8,
			cotacoes: [{ fornecedor: "Loja", valorEmCentavos: 10_000 }],
		},
	]);
	const motivos = Object.fromEntries(
		plano.foraDoPlano.map((item) => [item.necessidade.id, motivoForaDoPlano(item, plano.saldoRestante)]),
	);

	it("explica cada item fora do plano em linguagem de diretor", () => {
		expect(motivos["conta-de-luz"]).toBe("O PDDE não paga conta de consumo");
		expect(motivos.cadeiras).toBe("Sem orçamentos ainda");
		expect(motivos.mesa).toBe("Faltam 2 orçamentos ou a justificativa");
		expect(motivos.roteador).toMatch(/^Falta saldo de capital: sobram R\$/);
	});
});

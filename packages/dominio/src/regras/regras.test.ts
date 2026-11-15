import { describe, expect, it } from "vitest";
import { FONTES } from "./fontes";
import { dividirPeloPercentualPadrao, type ItemDeCompra, validarItem } from "./regras";

const SALDO_FOLGADO = { custeio: 10_000_000, capital: 10_000_000 };

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

describe("validarItem", () => {
	it("aprova material de consumo com três orçamentos como custeio", () => {
		const resultado = validarItem(item({}), SALDO_FOLGADO);
		expect(resultado.aprovado).toBe(true);
		expect(resultado.categoria).toBe("custeio");
		expect(resultado.totalEmCentavos).toBe(10_000);
	});

	it("classifica livro como custeio, pela Lei 10.753", () => {
		const resultado = validarItem(item({ tipo: "livro" }), SALDO_FOLGADO);
		expect(resultado.categoria).toBe("custeio");
	});

	it("classifica material permanente como capital e multiplica pela quantidade", () => {
		const resultado = validarItem(item({ tipo: "material permanente", quantidade: 3 }), SALDO_FOLGADO);
		expect(resultado.categoria).toBe("capital");
		expect(resultado.totalEmCentavos).toBe(30_000);
	});

	it.each([
		["pessoal", FONTES.vedacaoPessoal],
		["conta de consumo", FONTES.vedacaoServidorEContasDeConsumo],
		["tarifa bancária", FONTES.vedacaoTarifaBancaria],
		["tributo", FONTES.vedacaoTributo],
	] as const)("recusa despesa vedada: %s, citando a regra", (tipo, fonte) => {
		const resultado = validarItem(item({ tipo }), SALDO_FOLGADO);
		expect(resultado.aprovado).toBe(false);
		expect(resultado.problemas[0].fonte).toBe(fonte);
	});

	it("recusa menos de três orçamentos sem justificativa e aceita com justificativa", () => {
		const cotacoes = [{ fornecedor: "A", valorEmCentavos: 10_000 }];
		expect(validarItem(item({ cotacoes }), SALDO_FOLGADO).aprovado).toBe(false);
		const justificado = validarItem(item({ cotacoes, justificativaParaMenosOrcamentos: "Fornecedor único na cidade" }), SALDO_FOLGADO);
		expect(justificado.aprovado).toBe(true);
		expect(justificado.avisos[0].fonte).toBe(FONTES.menosDeTresOrcamentos);
	});

	it.each([0, -2, 1.5, Number.NaN])("recusa quantidade inválida: %s", (quantidade) => {
		expect(() => validarItem(item({ quantidade }), SALDO_FOLGADO)).toThrow(RangeError);
	});

	it("recusa quando o saldo da categoria não cobre o item", () => {
		const resultado = validarItem(item({ tipo: "material permanente" }), { custeio: 1_000_000, capital: 5_000 });
		expect(resultado.aprovado).toBe(false);
	});
});

describe("dividirPeloPercentualPadrao", () => {
	it("divide 80% custeio e 20% capital sem perder centavos", () => {
		const saldo = dividirPeloPercentualPadrao(1_843_001);
		expect(saldo.custeio + saldo.capital).toBe(1_843_001);
		expect(dividirPeloPercentualPadrao(1_843_000)).toEqual({ custeio: 1_474_400, capital: 368_600 });
	});
});

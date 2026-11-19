import { describe, expect, it } from "vitest";
import { criarData } from "../calendario/calendario";
import { formatarData, formatarDataCurta, formatarDataNumerica, formatarReais, formatarValor } from "./formatar";

describe("formatar", () => {
	it("escreve reais a partir de centavos", () => {
		expect(formatarReais(1_843_000)).toBe("R$\u00a018.430,00");
		expect(formatarValor(1_979_915)).toBe("19.799,15");
	});

	it("escreve a data por extenso e a data curta", () => {
		expect(formatarData(criarData(2028, 2, 14))).toBe("14 de fevereiro de 2028");
		expect(formatarDataCurta(criarData(2027, 12, 15))).toBe("15 dez");
		expect(formatarDataNumerica(criarData(2028, 2, 14))).toBe("14/02/2028");
	});
});

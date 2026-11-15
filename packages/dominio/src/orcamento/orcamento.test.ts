import { describe, expect, it } from "vitest";
import { escolherMenorPreco } from "./orcamento";

describe("escolherMenorPreco", () => {
	it("escolhe o menor valor e ignora cotações inválidas", () => {
		const escolha = escolherMenorPreco([
			{ fornecedor: "A", valorEmCentavos: 300 },
			{ fornecedor: "B", valorEmCentavos: 0 },
			{ fornecedor: "C", valorEmCentavos: 200 },
		]);
		expect(escolha?.vencedora.fornecedor).toBe("C");
		expect(escolha?.cotacoesOrdenadas).toHaveLength(2);
	});

	it("aponta empate no menor preço", () => {
		const escolha = escolherMenorPreco([
			{ fornecedor: "A", valorEmCentavos: 200 },
			{ fornecedor: "B", valorEmCentavos: 200 },
		]);
		expect(escolha?.empatadas).toHaveLength(2);
	});
});

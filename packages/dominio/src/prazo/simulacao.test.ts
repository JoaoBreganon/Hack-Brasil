import { describe, expect, it } from "vitest";
import { EXERCICIO_SIMULADO, HOJE_SIMULADO, simularPrazo } from "./simulacao";

describe("simularPrazo", () => {
	it("usa o exercício e a data da simulação", () => {
		const { hoje, situacao } = simularPrazo(100);
		expect(hoje).toEqual(HOJE_SIMULADO);
		expect(situacao.exercicio).toBe(EXERCICIO_SIMULADO);
		expect(situacao.tipo).toBe("correndo");
	});

	it("não aponta risco quando a conta está zerada", () => {
		expect(simularPrazo(0).risco.nivel).toBe("sem saldo");
	});
});

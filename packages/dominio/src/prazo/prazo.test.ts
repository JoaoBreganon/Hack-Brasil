import { describe, expect, it } from "vitest";
import { criarData, paraTextoIso } from "../calendario/calendario";
import { exercicioEmCurso, prazoDoExercicio, situacaoDoPrazo } from "./prazo";

describe("prazoDoExercicio", () => {
	it("não existe prazo de estorno antes do exercício de 2027", () => {
		expect(prazoDoExercicio(2026)).toBeNull();
	});

	it("o saldo de 2027 vale até o 10º dia útil de fevereiro de 2028 e é estornado no 15º", () => {
		const prazo = prazoDoExercicio(2027);
		expect(prazo && paraTextoIso(prazo.limiteParaUso)).toBe("2028-02-14");
		expect(prazo && paraTextoIso(prazo.estorno)).toBe("2028-02-21");
	});
});

describe("situacaoDoPrazo", () => {
	it("conta os dias que faltam a partir do dia seguinte", () => {
		const situacao = situacaoDoPrazo(2027, criarData(2028, 2, 1));
		expect(situacao.tipo).toBe("correndo");
		expect(situacao.tipo !== "sem prazo" && situacao.diasUteisRestantes).toBe(9);
		expect(situacao.tipo !== "sem prazo" && situacao.diasCorridosRestantes).toBe(13);
	});

	it("o próprio dia limite ainda está dentro do prazo", () => {
		expect(situacaoDoPrazo(2027, criarData(2028, 2, 14)).tipo).toBe("correndo");
		expect(situacaoDoPrazo(2027, criarData(2028, 2, 15)).tipo).toBe("encerrado");
	});
});

describe("exercicioEmCurso", () => {
	it("fica no exercício anterior até o fim do prazo de fevereiro", () => {
		expect(exercicioEmCurso(criarData(2028, 1, 20))).toBe(2027);
		expect(exercicioEmCurso(criarData(2028, 3, 1))).toBe(2028);
	});

	it("antes da regra nova usa o ano corrente", () => {
		expect(exercicioEmCurso(criarData(2026, 11, 18))).toBe(2026);
	});
});

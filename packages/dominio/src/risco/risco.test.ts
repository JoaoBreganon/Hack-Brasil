import { describe, expect, it } from "vitest";
import { criarData } from "../calendario/calendario";
import { situacaoDoPrazo } from "../prazo/prazo";
import { avaliarRisco } from "./risco";

describe("avaliarRisco", () => {
	it("conta zerada não tem risco", () => {
		expect(avaliarRisco(0, situacaoDoPrazo(2027, criarData(2028, 2, 1))).nivel).toBe("sem saldo");
	});

	it("muda de nível conforme os dias úteis que faltam", () => {
		const saldo = 1_843_000;
		expect(avaliarRisco(saldo, situacaoDoPrazo(2027, criarData(2027, 9, 1))).nivel).toBe("em dia");
		expect(avaliarRisco(saldo, situacaoDoPrazo(2027, criarData(2027, 12, 20))).nivel).toBe("atenção");
		expect(avaliarRisco(saldo, situacaoDoPrazo(2027, criarData(2028, 2, 1))).nivel).toBe("urgente");
		expect(avaliarRisco(saldo, situacaoDoPrazo(2027, criarData(2028, 2, 20))).nivel).toBe("perdido");
		expect(avaliarRisco(saldo, situacaoDoPrazo(2026, criarData(2026, 11, 12))).nivel).toBe("sem prazo");
	});
});

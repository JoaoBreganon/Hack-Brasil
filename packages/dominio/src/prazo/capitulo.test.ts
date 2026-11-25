import { describe, expect, it } from "vitest";
import { criarData } from "../calendario/calendario";
import { capituloDoPrazo } from "./capitulo";

const LIMITE = criarData(2028, 2, 14);

describe("capituloDoPrazo", () => {
	it("põe dezembro e os meses antes no capítulo 1", () => {
		expect(capituloDoPrazo(criarData(2027, 12, 15), LIMITE)?.mes).toBe("Dezembro");
		expect(capituloDoPrazo(criarData(2027, 6, 1), LIMITE)?.numero).toBe(1);
	});

	it("põe janeiro no capítulo 2 e fevereiro até o limite no capítulo 3", () => {
		expect(capituloDoPrazo(criarData(2028, 1, 10), LIMITE)?.numero).toBe(2);
		expect(capituloDoPrazo(criarData(2028, 2, 1), LIMITE)?.numero).toBe(3);
		expect(capituloDoPrazo(LIMITE, LIMITE)?.numero).toBe(3);
	});

	it("não tem capítulo depois do prazo", () => {
		expect(capituloDoPrazo(criarData(2028, 2, 15), LIMITE)).toBeNull();
	});
});

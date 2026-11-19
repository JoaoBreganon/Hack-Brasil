import { describe, expect, it } from "vitest";
import { prazoDoExercicio } from "../prazo/prazo";
import { criarData } from "./calendario";
import { montarMesesDoPrazo } from "./meses";

const PRAZO = prazoDoExercicio(2027);
if (!PRAZO) {
	throw new Error("o exercício de 2027 precisa ter prazo");
}
const MESES = montarMesesDoPrazo({ hoje: criarData(2027, 12, 15), limiteParaUso: PRAZO.limiteParaUso, estorno: PRAZO.estorno });
const DIAS = MESES.flatMap(({ semanas }) => semanas.flat()).flatMap((dia) => (dia ? [dia] : []));

describe("montarMesesDoPrazo", () => {
	it("vai do mês de hoje até o mês do estorno", () => {
		expect(MESES.map(({ nome }) => nome)).toEqual(["Dezembro de 2027", "Janeiro de 2028", "Fevereiro de 2028"]);
	});

	it("marca hoje, o último dia e o estorno uma vez cada", () => {
		expect(DIAS.filter(({ tipo }) => tipo === "hoje").map(({ iso }) => iso)).toEqual(["2027-12-15"]);
		expect(DIAS.filter(({ tipo }) => tipo === "ultimo").map(({ iso }) => iso)).toEqual(["2028-02-14"]);
		expect(DIAS.filter(({ tipo }) => tipo === "estorno").map(({ iso }) => iso)).toEqual(["2028-02-21"]);
	});

	it("pinta os mesmos dias úteis que o prazo conta, contando o último", () => {
		expect(DIAS.filter(({ tipo }) => tipo === "util" || tipo === "ultimo")).toHaveLength(43);
	});

	it("começa cada semana no domingo e fecha as semanas", () => {
		const [dezembro] = MESES;
		expect(dezembro.semanas[0].slice(0, 3)).toEqual([null, null, null]);
		expect(dezembro.semanas[0][3]?.dia).toBe(1);
		expect(MESES.every(({ semanas }) => semanas.every((semana) => semana.length === 7))).toBe(true);
	});
});

import { describe, expect, it } from "vitest";
import { simularPrazo } from "../prazo/simulacao";
import { avaliarEscolaDaRede, type EscolaNaRede, lerCodigosInep, ordenarPorRisco, resumirRede } from "./rede";

const { situacao } = simularPrazo(1);

function escola(codigoInep: string, dados: Partial<EscolaNaRede> = {}): EscolaNaRede {
	return {
		codigoInep,
		nome: `Escola ${codigoInep}`,
		municipio: "Adamantina/SP",
		saldoTotal: 1_000_000,
		totalAprovado: null,
		pendencias: 0,
		temResponsavel: true,
		...dados,
	};
}

describe("avaliarEscolaDaRede", () => {
	it("conta como risco só o que o plano aprovado não cobre", () => {
		const linha = avaliarEscolaDaRede(escola("35000001", { totalAprovado: 700_000 }), situacao);
		expect(linha.saldoEmRisco).toBe(300_000);
		expect(linha.nivel).toBe("atenção");
	});

	it("marca sem saldo quando o plano cobre tudo e sem dados quando a escola não foi buscada", () => {
		expect(avaliarEscolaDaRede(escola("35000001", { totalAprovado: 1_000_000 }), situacao).nivel).toBe("sem saldo");
		expect(avaliarEscolaDaRede(escola("35000002", { nome: null, saldoTotal: null }), situacao)).toMatchObject({
			nivel: "sem dados",
			saldoEmRisco: 0,
		});
	});
});

describe("ordenarPorRisco e resumirRede", () => {
	const linhas = [
		escola("35000003", { saldoTotal: null }),
		escola("35000001", { totalAprovado: 1_000_000 }),
		escola("35000002", { saldoTotal: 500_000 }),
		escola("35000004"),
	].map((linha) => avaliarEscolaDaRede(linha, situacao));

	it("põe primeiro as que precisam agir, com mais dinheiro em risco", () => {
		expect(ordenarPorRisco(linhas).map(({ codigoInep }) => codigoInep)).toEqual(["35000004", "35000002", "35000003", "35000001"]);
	});

	it("soma o saldo, o risco e os planos aprovados da rede", () => {
		expect(resumirRede(linhas)).toEqual({
			escolas: 4,
			saldoTotal: 2_500_000,
			saldoEmRisco: 1_500_000,
			comPlanoAprovado: 1,
			precisamAgir: 2,
		});
	});
});

describe("lerCodigosInep", () => {
	it("aceita códigos separados por linha, vírgula ou espaço, sem repetir", () => {
		expect(lerCodigosInep("35079923\n35000001, 35079923; abc 123")).toEqual({
			validos: ["35079923", "35000001"],
			invalidos: ["abc", "123"],
		});
	});
});

import { describe, expect, it } from "vitest";
import { NECESSIDADES_EXEMPLO } from "../exemplos/escola-exemplo";
import { lerCsv } from "../importacao/csv";
import { montarPlanoDeCompra } from "../plano/plano";
import { celulaDoCsv, montarPlanilhaDoPlano, nomeDaPlanilhaDoPlano } from "./planilha";

describe("montarPlanilhaDoPlano", () => {
	const plano = montarPlanoDeCompra({ custeio: 1_500_000, capital: 400_000 }, NECESSIDADES_EXEMPLO);
	const texto = montarPlanilhaDoPlano(plano);
	const linhas = texto.replace(/^﻿/, "").trimEnd().split("\r\n");

	it("abre com a marca de UTF-8 para o Excel ler os acentos", () => {
		expect(texto.startsWith("﻿")).toBe(true);
		expect(linhas[0]).toContain("Situação");
	});

	it("tem uma linha por item, dentro e fora do plano, e os totais no fim", () => {
		expect(linhas).toHaveLength(1 + plano.itens.length + plano.foraDoPlano.length + 4);
		expect(linhas[1]).toContain("Entra no plano");
		expect(linhas.at(-1)).toContain("Total do plano");
	});

	it("separa por ponto e vírgula e escreve os valores no formato brasileiro", () => {
		const [primeiro] = plano.itens;
		const colunas = linhas[1].split(";");
		expect(colunas[1]).toBe(primeiro.necessidade.descricao);
		expect(colunas[7]).toMatch(/^\d{1,3}(\.\d{3})*,\d{2}$/);
	});

	it("volta a ser lida pelo leitor de CSV do próprio Aloca", () => {
		expect(lerCsv(texto.replace(/^﻿/, "")).length).toBeGreaterThan(plano.itens.length);
	});

	it("nomeia o arquivo com a escola e o exercício", () => {
		expect(nomeDaPlanilhaDoPlano("35079923", 2027)).toBe("plano-pdde-35079923-2027.csv");
	});
});

describe("celulaDoCsv", () => {
	it("neutraliza fórmulas que viriam do nome de uma loja", () => {
		expect(celulaDoCsv('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
		expect(celulaDoCsv("+55 11")).toBe("'+55 11");
		expect(celulaDoCsv("@SOMA(A1)")).toBe("'@SOMA(A1)");
	});

	it("põe aspas só quando precisa", () => {
		expect(celulaDoCsv("Papelaria; Centro")).toBe('"Papelaria; Centro"');
		expect(celulaDoCsv("Papelaria")).toBe("Papelaria");
		expect(celulaDoCsv(12)).toBe("12");
	});
});

import { describe, expect, it } from "vitest";
import { TIPOS_DE_DESPESA } from "../regras/regras";
import { ESQUEMA_DA_SUGESTAO, mensagemDaSugestao } from "./ia";

const CONTEXTO = { saldo: { custeio: 1_583_932, capital: 395_983 }, jaNoPlano: [], primeiraPrioridade: 1 };

describe("ESQUEMA_DA_SUGESTAO", () => {
	it("exige os quatro campos do item e aceita só os tipos de despesa conhecidos", () => {
		const { items } = ESQUEMA_DA_SUGESTAO.properties.itens;
		expect(items.required).toEqual(["descricao", "tipo", "quantidade", "prioridade"]);
		expect(items.additionalProperties).toBe(false);
		expect(items.properties.tipo.enum).toEqual([...TIPOS_DE_DESPESA]);
	});
});

describe("mensagemDaSugestao", () => {
	it("leva o saldo de cada categoria, as regras e o pedido da direção", () => {
		const mensagem = mensagemDaSugestao({ ...CONTEXTO, pedido: "ventiladores para as salas", jaNoPlano: ["Roteador Wi-Fi 6"] });
		expect(mensagem).toMatch(/Saldo livre de custeio: R\$\s15\.839,32\./);
		expect(mensagem).toMatch(/Saldo livre de capital: R\$\s3\.959,83\./);
		expect(mensagem).toContain("livro (custeio)");
		expect(mensagem).toContain("material permanente (capital)");
		expect(mensagem).toMatch(/Tipos que o PDDE não paga: .*conta de consumo/);
		expect(mensagem).toContain("Já estão na lista: Roteador Wi-Fi 6.");
		expect(mensagem).toContain('"""ventiladores para as salas"""');
	});

	it("pede o que costuma faltar quando a direção não descreve nada", () => {
		const mensagem = mensagemDaSugestao(CONTEXTO);
		expect(mensagem).toContain("Já estão na lista: nenhum item.");
		expect(mensagem).toContain("Sugira até 10 itens novos, com prioridade a partir de 1.");
		expect(mensagem).toContain("A direção não descreveu o que falta.");
	});
});

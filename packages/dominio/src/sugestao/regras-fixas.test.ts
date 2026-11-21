import { describe, expect, it } from "vitest";
import { ESCOLA_EXEMPLO } from "../exemplos/escola-exemplo";
import { LIMITES, type NovaNecessidade } from "../plano/entradas";
import { REGRAS_POR_TIPO, type Saldo } from "../regras/regras";
import { CATALOGO_DE_SUGESTOES, gerarSugestoesPorRegras } from "./regras-fixas";
import { type ContextoDaSugestao, validarSugestoes } from "./sugestao";

function contexto(parcial: Partial<ContextoDaSugestao> = {}): ContextoDaSugestao {
	return { saldo: ESCOLA_EXEMPLO.saldo, jaNoPlano: [], primeiraPrioridade: 1, ...parcial };
}

function totalEstimado(sugestoes: NovaNecessidade[]): Saldo {
	const total: Saldo = { custeio: 0, capital: 0 };
	for (const { descricao, tipo, quantidade } of sugestoes) {
		const regra = REGRAS_POR_TIPO[tipo];
		const modelo = CATALOGO_DE_SUGESTOES.find((item) => item.descricao === descricao);
		if (regra.permitido && modelo) {
			total[regra.categoria] += modelo.precoDeReferenciaEmCentavos * quantidade;
		}
	}
	return total;
}

describe("CATALOGO_DE_SUGESTOES", () => {
	it("só traz despesas que o PDDE paga", () => {
		expect(CATALOGO_DE_SUGESTOES.filter(({ tipo }) => !REGRAS_POR_TIPO[tipo].permitido)).toEqual([]);
	});
});

describe("gerarSugestoesPorRegras", () => {
	it("sugere itens de custeio e de capital que passam no validador", () => {
		const sugestoes = gerarSugestoesPorRegras(contexto());
		const categorias = new Set(sugestoes.map(({ tipo }) => REGRAS_POR_TIPO[tipo].permitido && REGRAS_POR_TIPO[tipo].categoria));
		expect(categorias).toEqual(new Set(["custeio", "capital"]));
		expect(validarSugestoes(sugestoes)).toEqual({ aceitas: sugestoes, bloqueadas: [], descartadas: 0 });
	});

	it("dá sempre a mesma resposta para o mesmo pedido", () => {
		expect(gerarSugestoesPorRegras(contexto({ pedido: "livros" }))).toEqual(gerarSugestoesPorRegras(contexto({ pedido: "livros" })));
	});

	it("ajusta as quantidades ao saldo de cada categoria", () => {
		const total = totalEstimado(gerarSugestoesPorRegras(contexto()));
		expect(total.custeio).toBeLessThanOrEqual(ESCOLA_EXEMPLO.saldo.custeio);
		expect(total.capital).toBeLessThanOrEqual(ESCOLA_EXEMPLO.saldo.capital);
		expect(total.custeio).toBeGreaterThan(ESCOLA_EXEMPLO.saldo.custeio * 0.9);
	});

	it("põe na frente o que o diretor pediu", () => {
		const sugestoes = gerarSugestoesPorRegras(contexto({ pedido: "A biblioteca precisa de LIVROS e as salas estão quentes" }));
		expect(sugestoes.slice(0, 3).map(({ descricao }) => descricao)).toEqual([
			"Livro de literatura infantojuvenil",
			"Ventilador de parede",
			"Estante de aço para biblioteca",
		]);
		expect(sugestoes.map(({ prioridade }) => prioridade)).toEqual(sugestoes.map((_, indice) => indice + 1));
	});

	it("não sugere capital sem saldo de capital e nada sem saldo nenhum", () => {
		const soCusteio = gerarSugestoesPorRegras(contexto({ saldo: { custeio: 500_000, capital: 0 } }));
		expect(soCusteio.length).toBeGreaterThan(0);
		expect(soCusteio.every(({ tipo }) => tipo !== "material permanente")).toBe(true);
		expect(gerarSugestoesPorRegras(contexto({ saldo: { custeio: 0, capital: 0 } }))).toEqual([]);
	});

	it("pula o que já está no plano e continua a prioridade sem passar do limite", () => {
		const sugestoes = gerarSugestoesPorRegras(
			contexto({ jaNoPlano: ["livro de literatura INFANTOJUVENIL"], primeiraPrioridade: LIMITES.prioridade.maximo - 1 }),
		);
		expect(sugestoes.map(({ descricao }) => descricao)).not.toContain("Livro de literatura infantojuvenil");
		expect(sugestoes.slice(0, 3).map(({ prioridade }) => prioridade)).toEqual([98, 99, 99]);
	});

	it("respeita as vagas do plano", () => {
		const jaNoPlano = Array.from({ length: LIMITES.itensPorPlano - 2 }, (_, indice) => `Item ${indice}`);
		expect(gerarSugestoesPorRegras(contexto({ jaNoPlano }))).toHaveLength(2);
		expect(gerarSugestoesPorRegras(contexto({ jaNoPlano: [...jaNoPlano, "A", "B"] }))).toEqual([]);
	});
});

import { describe, expect, it } from "vitest";
import { type EntradaDaNecessidade, LIMITES } from "../plano/entradas";
import { REGRAS_POR_TIPO, TIPOS_DE_DESPESA } from "../regras/regras";
import { chaveDaDescricao, lerSugestoes, validarSugestoes } from "./sugestao";

const VEDADOS = TIPOS_DE_DESPESA.filter((tipo) => !REGRAS_POR_TIPO[tipo].permitido);

function sugestao(parcial: Partial<EntradaDaNecessidade>): EntradaDaNecessidade {
	return { descricao: "Cadeiras escolares", tipo: "material permanente", quantidade: 10, prioridade: 1, ...parcial };
}

describe("lerSugestoes", () => {
	it("lê os itens da saída estruturada da IA", () => {
		expect(lerSugestoes({ itens: [{ descricao: "Livros", tipo: "livro", quantidade: 5, prioridade: 2 }] })).toEqual([
			{ descricao: "Livros", tipo: "livro", quantidade: 5, prioridade: 2 },
		]);
	});

	it("acerta o tipo escrito com outra caixa ou sem acento", () => {
		const [maiusculo, semAcento] = lerSugestoes({
			itens: [
				{ descricao: "Papel", tipo: " Material de Consumo ", quantidade: 1, prioridade: 1 },
				{ descricao: "Dedetização", tipo: "servico", quantidade: 1, prioridade: 2 },
			],
		});
		expect(maiusculo.tipo).toBe("material de consumo");
		expect(semAcento.tipo).toBe("serviço");
	});

	it("troca campo fora do formato por valor que o validador recusa", () => {
		expect(lerSugestoes({ itens: [null, { descricao: 3, tipo: "carro", quantidade: "2" }] })).toEqual([
			{ descricao: "", tipo: "", quantidade: 0, prioridade: 0 },
			{ descricao: "", tipo: "carro", quantidade: 0, prioridade: 0 },
		]);
	});

	it("devolve lista vazia quando a resposta não tem itens", () => {
		expect(lerSugestoes(null)).toEqual([]);
		expect(lerSugestoes({ itens: "livros" })).toEqual([]);
	});

	it("lê no máximo o limite de itens do plano", () => {
		expect(lerSugestoes({ itens: Array.from({ length: LIMITES.itensPorPlano + 5 }, () => sugestao({})) })).toHaveLength(
			LIMITES.itensPorPlano,
		);
	});
});

describe("validarSugestoes", () => {
	it("aceita item permitido e limpa a descrição", () => {
		expect(validarSugestoes([sugestao({ descricao: "  Cadeiras   escolares " })])).toEqual({
			aceitas: [{ descricao: "Cadeiras escolares", tipo: "material permanente", quantidade: 10, prioridade: 1 }],
			bloqueadas: [],
			descartadas: 0,
		});
	});

	it.each(VEDADOS)("bloqueia despesa vedada pelo FNDE: %s, citando a regra", (tipo) => {
		const regra = REGRAS_POR_TIPO[tipo];
		const resultado = validarSugestoes([sugestao({ descricao: "Item vedado", tipo })]);
		expect(resultado.aceitas).toEqual([]);
		expect(resultado.bloqueadas).toEqual([{ descricao: "Item vedado", tipo, motivo: `O PDDE não paga ${tipo}`, fonte: regra.fonte }]);
	});

	it("separa as permitidas das vedadas numa mesma resposta", () => {
		const resultado = validarSugestoes([
			sugestao({ descricao: "Conta de luz", tipo: "conta de consumo" }),
			sugestao({ descricao: "Livros de literatura", tipo: "livro", prioridade: 2 }),
			sugestao({ descricao: "Salário do porteiro", tipo: "pessoal", prioridade: 3 }),
			sugestao({ descricao: "Aluguel do galpão", tipo: "aluguel", prioridade: 4 }),
		]);
		expect(resultado.aceitas.map(({ descricao }) => descricao)).toEqual(["Livros de literatura"]);
		expect(resultado.bloqueadas.map(({ tipo }) => tipo)).toEqual(["conta de consumo", "pessoal", "aluguel"]);
	});

	it("descarta item fora do formato", () => {
		const resultado = validarSugestoes([
			sugestao({ descricao: "a" }),
			sugestao({ tipo: "carro" }),
			sugestao({ quantidade: 0 }),
			sugestao({ prioridade: 1.5 }),
		]);
		expect(resultado).toEqual({ aceitas: [], bloqueadas: [], descartadas: 4 });
	});

	it("descarta o que já está no plano ou se repete, sem olhar acento nem caixa", () => {
		const resultado = validarSugestoes(
			[sugestao({ descricao: "LIVROS de literatura", tipo: "livro" }), sugestao({}), sugestao({ descricao: "cadeiras ESCOLARES" })],
			["Livros de literatura"],
		);
		expect(resultado.aceitas.map(({ descricao }) => descricao)).toEqual(["Cadeiras escolares"]);
		expect(resultado.descartadas).toBe(2);
	});

	it("respeita o limite de itens do plano", () => {
		const jaNoPlano = Array.from({ length: LIMITES.itensPorPlano - 1 }, (_, indice) => `Item ${indice}`);
		const resultado = validarSugestoes([sugestao({ descricao: "Mesas" }), sugestao({ descricao: "Armários" })], jaNoPlano);
		expect(resultado.aceitas.map(({ descricao }) => descricao)).toEqual(["Mesas"]);
		expect(resultado.descartadas).toBe(1);
	});

	it("bloqueia a vedada mesmo com o plano cheio", () => {
		const jaNoPlano = Array.from({ length: LIMITES.itensPorPlano }, (_, indice) => `Item ${indice}`);
		const resultado = validarSugestoes([sugestao({ descricao: "Tarifa do banco", tipo: "tarifa bancária" })], jaNoPlano);
		expect(resultado.bloqueadas).toHaveLength(1);
	});
});

describe("chaveDaDescricao", () => {
	it("ignora acento, caixa e espaços", () => {
		expect(chaveDaDescricao("  Pintura   da SALA ")).toBe(chaveDaDescricao("pintura da sala"));
		expect(chaveDaDescricao("Ação")).toBe("acao");
	});
});

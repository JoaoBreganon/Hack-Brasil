import { type AcaoLimitada, REGRAS_POR_TIPO, type TipoDeDespesa, USOS_POR_HORA } from "@aloca/dominio";
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const MODULOS = import.meta.glob("./**/*.ts");
const INEP = "35079923";
const ESCOLA = { codigoInep: INEP, nome: "EMEF Professora Teruyo Kikuta", municipio: "Adamantina/SP" };
const COLETA = {
	escola: ESCOLA,
	exercicio: 2026,
	saldo: { custeio: 1_583_932, capital: 395_983 },
	fonte: { nome: "PDDE Info" },
	coletadoEm: 1_000,
	pendencias: [{ entidade: "UEx" as const, assunto: "Prestação de Contas", mensagem: "Pendente." }],
};

async function escolaComSaldo() {
	const t = convexTest(schema, MODULOS);
	await t.mutation(internal.saldos.registrarColeta, COLETA);
	return t;
}

type Teste = Awaited<ReturnType<typeof escolaComSaldo>>;

const RESPOSTA_DA_IA = {
	itens: [
		{ descricao: "Conta de luz de dezembro", tipo: "conta de consumo", quantidade: 1, prioridade: 1 },
		{ descricao: "Cadeiras para o refeitório", tipo: "material permanente", quantidade: 20, prioridade: 2 },
		{ descricao: "Salário do vigia", tipo: "pessoal", quantidade: 1, prioridade: 3 },
		{ descricao: "Livros de literatura", tipo: "livro", quantidade: 30, prioridade: 4 },
		{ descricao: "Tarifa do banco", tipo: "tarifa bancária", quantidade: 12, prioridade: 5 },
	],
};

function respostaJson(corpo: unknown, status = 200) {
	return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

function iaRespondendo(conteudo: unknown) {
	const chamada = vi.fn(async (_endereco: string | URL | Request, _opcoes?: RequestInit) =>
		respostaJson({ choices: [{ message: { content: JSON.stringify(conteudo) } }] }),
	);
	vi.stubEnv("LLM_API_KEY", "chave-de-teste");
	vi.stubGlobal("fetch", chamada);
	return chamada;
}

function semChaveDaIa() {
	const chamada = vi.fn();
	vi.stubEnv("LLM_API_KEY", "");
	vi.stubGlobal("fetch", chamada);
	return chamada;
}

const RESPOSTA_DO_FIRECRAWL = {
	data: {
		web: [
			{ url: "https://loja-b.com.br/roteador", json: { loja: "Loja B", preco: "529,00" } },
			{ url: "https://loja-a.com.br/roteador", json: { loja: "Loja A", preco: "R$ 499,90" } },
			{ url: "https://loja-c.com.br/roteador", json: { loja: "Loja C", preco: 545.5 } },
			{ url: "https://loja-d.com.br/roteador", json: { loja: "Loja D", preco: "" } },
		],
	},
};

function firecrawlRespondendo(corpo: unknown, status = 200) {
	const chamada = vi.fn(async (_endereco: string | URL | Request, _opcoes?: RequestInit) => respostaJson(corpo, status));
	vi.stubEnv("FIRECRAWL_API_KEY", "fc-teste");
	vi.stubGlobal("fetch", chamada);
	return chamada;
}

function itemParaBusca(t: Teste, tipo: TipoDeDespesa = "material permanente", descricao = "Roteador Wi-Fi 6") {
	return t.mutation(api.itens.adicionar, { codigoInep: INEP, descricao, tipo, quantidade: 1, prioridade: 1 });
}

async function orcamentosSalvos(t: Teste) {
	const orcamentos = await t.run((ctx) => ctx.db.query("orcamento").collect());
	return orcamentos
		.map(({ fornecedor, valorEmCentavos, endereco, origem }) => ({ fornecedor, valorEmCentavos, endereco, origem }))
		.sort((a, b) => a.valorEmCentavos - b.valorEmCentavos);
}

async function descricoesSalvas(t: Teste) {
	const itens = await t.run((ctx) => ctx.db.query("item").collect());
	return itens.map(({ descricao }) => descricao);
}

describe("coleta do saldo", () => {
	it("não duplica o saldo quando a coleta traz o mesmo valor", async () => {
		const t = await escolaComSaldo();
		await t.mutation(internal.saldos.registrarColeta, { ...COLETA, coletadoEm: 2_000 });
		const saldos = await t.run((ctx) => ctx.db.query("saldo").collect());
		expect(saldos).toHaveLength(1);
		expect(saldos[0].coletadoEm).toBe(2_000);
	});

	it("grava outra linha quando o saldo muda", async () => {
		const t = await escolaComSaldo();
		await t.mutation(internal.saldos.registrarColeta, { ...COLETA, saldo: { custeio: 1, capital: 1 }, coletadoEm: 2_000 });
		expect(await t.run((ctx) => ctx.db.query("saldo").collect())).toHaveLength(2);
	});
});

describe("painel da escola", () => {
	it("devolve null para escola que ainda não foi buscada", async () => {
		const t = convexTest(schema, MODULOS);
		expect(await t.query(api.painel.daEscola, { codigoInep: INEP })).toBeNull();
	});

	it("mostra escola, saldo e pendências sem plano", async () => {
		const t = await escolaComSaldo();
		const painel = await t.query(api.painel.daEscola, { codigoInep: INEP });
		expect(painel?.escola).toEqual(ESCOLA);
		expect(painel?.saldo?.saldo).toEqual(COLETA.saldo);
		expect(painel?.saldo?.pendencias).toHaveLength(1);
		expect(painel?.plano).toBeNull();
	});
});

describe("plano de compra", () => {
	it("exige o saldo antes do primeiro item", async () => {
		const t = convexTest(schema, MODULOS);
		await expect(
			t.mutation(api.itens.adicionar, { codigoInep: INEP, descricao: "Livros", tipo: "livro", quantidade: 1, prioridade: 1 }),
		).rejects.toThrow("Busque o saldo");
	});

	it("recusa item inválido", async () => {
		const t = await escolaComSaldo();
		await expect(
			t.mutation(api.itens.adicionar, { codigoInep: INEP, descricao: "a", tipo: "livro", quantidade: 0, prioridade: 1 }),
		).rejects.toThrow("Descreva o item");
	});

	it("monta o exemplo, aprova e trava a edição até reabrir", async () => {
		const t = await escolaComSaldo();
		await t.mutation(api.itens.preencherComExemplo, { codigoInep: INEP });
		await t.mutation(api.planos.aprovar, { codigoInep: INEP });
		const painel = await t.query(api.painel.daEscola, { codigoInep: INEP });
		expect(painel?.plano?.status).toBe("aprovado");
		const itemId = painel?.itens[0]._id;
		if (!itemId) {
			throw new Error("o exemplo não criou itens");
		}
		await expect(t.mutation(api.itens.remover, { itemId })).rejects.toThrow("Reabra o plano");
		await t.mutation(api.planos.reabrir, { codigoInep: INEP });
		await t.mutation(api.itens.remover, { itemId });
		const depois = await t.query(api.painel.daEscola, { codigoInep: INEP });
		expect(depois?.itens).toHaveLength(painel.itens.length - 1);
		expect(await t.run((ctx) => ctx.db.query("orcamento").collect())).toHaveLength(
			painel.itens.reduce((total, item) => total + item.orcamentos.length, 0) - painel.itens[0].orcamentos.length,
		);
	});

	it("não aprova plano sem item pronto para compra", async () => {
		const t = await escolaComSaldo();
		await t.mutation(api.itens.adicionar, { codigoInep: INEP, descricao: "Livros", tipo: "livro", quantidade: 1, prioridade: 1 });
		await expect(t.mutation(api.planos.aprovar, { codigoInep: INEP })).rejects.toThrow("Nenhum item");
	});

	it("aceita orçamento válido e recusa link perigoso", async () => {
		const t = await escolaComSaldo();
		const itemId = await t.mutation(api.itens.adicionar, {
			codigoInep: INEP,
			descricao: "Livros",
			tipo: "livro",
			quantidade: 1,
			prioridade: 1,
		});
		await t.mutation(api.orcamentos.adicionar, {
			itemId,
			fornecedor: "Livraria A",
			valorEmCentavos: 10_000,
			endereco: "https://livraria.com.br",
		});
		await expect(
			t.mutation(api.orcamentos.adicionar, {
				itemId,
				fornecedor: "Livraria B",
				valorEmCentavos: 10_000,
				endereco: "javascript:alert(1)",
			}),
		).rejects.toThrow("https://");
		const painel = await t.query(api.painel.daEscola, { codigoInep: INEP });
		expect(painel?.itens[0].orcamentos).toEqual([expect.objectContaining({ fornecedor: "Livraria A", origem: "manual" })]);
	});

	it("guarda só cotações novas da busca de preços", async () => {
		const t = await escolaComSaldo();
		const itemId = await t.mutation(api.itens.adicionar, {
			codigoInep: INEP,
			descricao: "Roteador",
			tipo: "material permanente",
			quantidade: 1,
			prioridade: 1,
		});
		const cotacoes = [
			{ fornecedor: "Loja A", valorEmCentavos: 10_000, endereco: "https://a.com/p" },
			{ fornecedor: "Loja B", valorEmCentavos: 0, endereco: "https://b.com/p" },
		];
		expect(await t.mutation(internal.orcamentos.registrarDaBusca, { itemId, cotacoes })).toBe(1);
		expect(await t.mutation(internal.orcamentos.registrarDaBusca, { itemId, cotacoes })).toBe(0);
	});
});

describe("importação do saldo por planilha", () => {
	const PLANILHA = ["Código INEP;Exercício;Custeio;Capital", `${INEP};2026;15.839,32;3.959,83`, "99000002;2026;1,00;1,00"].join("\n");

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("carrega o saldo pela planilha quando o PDDE Info está fora do ar", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("", { status: 503 })),
		);
		const t = convexTest(schema, MODULOS);
		await expect(t.action(api.pddeInfo.consultar, { codigoInep: INEP })).rejects.toThrow("importe o saldo por planilha CSV");
		const resultado = await t.mutation(api.saldos.importarPlanilha, { codigoInep: INEP, texto: PLANILHA, nomeDoArquivo: "saldos.csv" });
		expect(resultado).toEqual({ exercicio: 2026, saldo: COLETA.saldo });
		const painel = await t.query(api.painel.daEscola, { codigoInep: INEP });
		expect(painel?.escola).toEqual(ESCOLA);
		expect(painel?.saldo).toMatchObject({
			exercicio: 2026,
			saldo: COLETA.saldo,
			fonte: { nome: "Planilha saldos.csv" },
			pendencias: [],
		});
		expect(await t.run((ctx) => ctx.db.query("escola").collect())).toHaveLength(1);
	});

	it("cria a escola com o nome e o município da planilha", async () => {
		const t = convexTest(schema, MODULOS);
		const texto = [
			"INEP;Escola;Município;Exercício;Custeio;Capital",
			"99000001;EMEF Jardim das Flores;Bauru/SP;2026;100,00;50,00",
		].join("\n");
		await t.mutation(api.saldos.importarPlanilha, { codigoInep: "99000001", texto, nomeDoArquivo: "  minha   planilha.csv " });
		const painel = await t.query(api.painel.daEscola, { codigoInep: "99000001" });
		expect(painel?.escola).toEqual({ codigoInep: "99000001", nome: "EMEF Jardim das Flores", municipio: "Bauru/SP" });
		expect(painel?.saldo?.fonte).toEqual({ nome: "Planilha minha planilha.csv" });
	});

	it("mantém o nome da escola já cadastrada sem saldo", async () => {
		const t = convexTest(schema, MODULOS);
		await t.mutation(internal.escolas.cadastrar, { codigoInep: "99000002", nome: "EMEF Vila Nova", municipio: "Marília/SP" });
		await t.mutation(api.saldos.importarPlanilha, { codigoInep: "99000002", texto: PLANILHA, nomeDoArquivo: "saldos.csv" });
		const painel = await t.query(api.painel.daEscola, { codigoInep: "99000002" });
		expect(painel?.escola.nome).toBe("EMEF Vila Nova");
		expect(painel?.saldo?.saldo).toEqual({ custeio: 100, capital: 100 });
	});

	it("recusa planilha sem a escola, código inválido, arquivo grande e escola que já tem saldo", async () => {
		const t = convexTest(schema, MODULOS);
		const importar = (codigoInep: string, texto = PLANILHA) =>
			t.mutation(api.saldos.importarPlanilha, { codigoInep, texto, nomeDoArquivo: "saldos.csv" });
		await expect(importar("99000003")).rejects.toThrow("não tem uma linha válida da escola 99000003");
		await expect(importar("1234")).rejects.toThrow("8 dígitos");
		await expect(importar(INEP, "a".repeat(500_001))).rejects.toThrow("grande demais");
		await expect(importar(INEP, "inep;total")).rejects.toThrow("Faltam as colunas");
		expect(await t.run((ctx) => ctx.db.query("escola").collect())).toEqual([]);
		const comSaldo = await escolaComSaldo();
		await expect(
			comSaldo.mutation(api.saldos.importarPlanilha, { codigoInep: INEP, texto: PLANILHA, nomeDoArquivo: "saldos.csv" }),
		).rejects.toThrow("já tem saldo");
	});
});

describe("limites das ações abertas", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	async function encherUsos(t: Teste, acao: AcaoLimitada, em = Date.now()) {
		await t.run(async (ctx) => {
			for (let indice = 0; indice < USOS_POR_HORA[acao]; indice += 1) {
				await ctx.db.insert("uso", { acao, em });
			}
		});
	}

	it("barra novos celulares depois do limite da hora, mas deixa trocar só o nome", async () => {
		const t = await escolaComSaldo();
		await t.mutation(api.contatos.salvar, { codigoInep: INEP, papel: "diretor", nome: "Maria", celular: "(18) 99123-4567" });
		await encherUsos(t, "contato");
		await t.mutation(api.contatos.salvar, { codigoInep: INEP, papel: "diretor", nome: "Maria Souza", celular: "(18) 99123-4567" });
		await expect(
			t.mutation(api.contatos.salvar, { codigoInep: INEP, papel: "tesoureiro", nome: "João", celular: "(18) 99123-0000" }),
		).rejects.toThrow("Muitos celulares");
		expect(await t.query(api.contatos.daEscola, { codigoInep: INEP })).toEqual([expect.objectContaining({ nome: "Maria Souza" })]);
	});

	it("não consulta o PDDE Info depois do limite da hora", async () => {
		const chamada = vi.fn();
		vi.stubGlobal("fetch", chamada);
		const t = convexTest(schema, MODULOS);
		await encherUsos(t, "consulta ao PDDE Info");
		await expect(t.action(api.pddeInfo.consultar, { codigoInep: INEP })).rejects.toThrow("Muitas consultas ao PDDE Info");
		expect(chamada).not.toHaveBeenCalled();
	});

	it("barra planilhas depois do limite da hora e esquece os usos antigos", async () => {
		const t = convexTest(schema, MODULOS);
		const texto = ["inep;exercicio;custeio;capital", "99000001;2026;1,00;1,00", "99000002;2026;1,00;1,00"].join("\n");
		await encherUsos(t, "planilha");
		await expect(t.mutation(api.saldos.importarPlanilha, { codigoInep: "99000001", texto, nomeDoArquivo: "s.csv" })).rejects.toThrow(
			"Muitas planilhas",
		);
		await t.run(async (ctx) => {
			for (const { _id } of await ctx.db.query("uso").collect()) {
				await ctx.db.patch(_id, { em: Date.now() - 2 * 60 * 60_000 });
			}
		});
		await t.mutation(api.saldos.importarPlanilha, { codigoInep: "99000001", texto, nomeDoArquivo: "s.csv" });
		expect((await t.run((ctx) => ctx.db.query("uso").collect())).length).toBeLessThan(USOS_POR_HORA.planilha);
	});
});

describe("contatos", () => {
	it("avisa quando o celular já foi removido", async () => {
		const t = await escolaComSaldo();
		const contatoId = await t.mutation(api.contatos.salvar, {
			codigoInep: INEP,
			papel: "diretor",
			nome: "Maria",
			celular: "(18) 99123-4567",
		});
		await t.mutation(api.contatos.remover, { contatoId });
		await expect(t.mutation(api.contatos.remover, { contatoId })).rejects.toThrow("já foi removido");
	});

	it("guarda um contato por papel e só devolve o celular mascarado", async () => {
		const t = await escolaComSaldo();
		await t.mutation(api.contatos.salvar, { codigoInep: INEP, papel: "diretor", nome: "Maria", celular: "(18) 99123-4567" });
		await t.mutation(api.contatos.salvar, { codigoInep: INEP, papel: "diretor", nome: "Maria Souza", celular: "(18) 99123-0000" });
		const contatos = await t.query(api.contatos.daEscola, { codigoInep: INEP });
		expect(contatos).toEqual([expect.objectContaining({ papel: "diretor", nome: "Maria Souza", celular: "(18) •••••-0000" })]);
	});

	it("recusa telefone fixo", async () => {
		const t = await escolaComSaldo();
		await expect(
			t.mutation(api.contatos.salvar, { codigoInep: INEP, papel: "tesoureiro", nome: "João", celular: "(18) 3521-4567" }),
		).rejects.toThrow("celular com DDD");
	});
});

describe("alertas", () => {
	it("avisa quando a Nvoip não está configurada", async () => {
		const t = await escolaComSaldo();
		await expect(t.action(api.alertas.enviarAgora, { codigoInep: INEP })).rejects.toThrow("Nvoip");
	});
});

describe("limites de uso", () => {
	it("conta as buscas de preço da última hora", async () => {
		const t = await escolaComSaldo();
		const itemId = await t.mutation(api.itens.adicionar, {
			codigoInep: INEP,
			descricao: "Roteador",
			tipo: "material permanente",
			quantidade: 1,
			prioridade: 1,
		});
		await t.mutation(internal.itens.marcarBusca, { itemId, em: 5_000 });
		expect(await t.query(internal.itens.buscasDesde, { desde: 4_000 })).toBe(1);
		expect(await t.query(internal.itens.buscasDesde, { desde: 6_000 })).toBe(0);
	});
});

describe("busca de preços", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("guarda os preços das lojas achados pelo Firecrawl", async () => {
		const chamada = firecrawlRespondendo(RESPOSTA_DO_FIRECRAWL);
		const t = await escolaComSaldo();
		const itemId = await itemParaBusca(t);
		expect(await t.action(api.precos.buscar, { itemId })).toEqual({ origem: "busca", encontrados: 3 });
		const [endereco, opcoes] = chamada.mock.calls[0];
		expect(endereco).toBe("https://api.firecrawl.dev/v2/search");
		expect(opcoes?.headers).toMatchObject({ Authorization: "Bearer fc-teste" });
		expect(await orcamentosSalvos(t)).toEqual([
			{ fornecedor: "Loja A", valorEmCentavos: 49_990, endereco: "https://loja-a.com.br/roteador", origem: "busca" },
			{ fornecedor: "Loja B", valorEmCentavos: 52_900, endereco: "https://loja-b.com.br/roteador", origem: "busca" },
			{ fornecedor: "Loja C", valorEmCentavos: 54_550, endereco: "https://loja-c.com.br/roteador", origem: "busca" },
		]);
	});

	it("usa preços de exemplo quando a FIRECRAWL_API_KEY não está configurada", async () => {
		const chamada = vi.fn();
		vi.stubEnv("FIRECRAWL_API_KEY", "");
		vi.stubGlobal("fetch", chamada);
		const t = await escolaComSaldo();
		const itemId = await itemParaBusca(t);
		expect(await t.action(api.precos.buscar, { itemId })).toEqual({ origem: "exemplo", encontrados: 3, motivo: "sem configuração" });
		expect(chamada).not.toHaveBeenCalled();
		const salvos = await orcamentosSalvos(t);
		expect(salvos.map(({ fornecedor, origem, endereco }) => [fornecedor, origem, endereco])).toEqual([
			["Loja A", "exemplo", undefined],
			["Loja B", "exemplo", undefined],
			["Loja C", "exemplo", undefined],
		]);
		expect(salvos.every(({ valorEmCentavos }) => valorEmCentavos > 0)).toBe(true);
	});

	it("cai nos preços de exemplo quando o Firecrawl falha", async () => {
		const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
		firecrawlRespondendo({ error: "fora do ar" }, 500);
		const t = await escolaComSaldo();
		const itemId = await itemParaBusca(t);
		expect(await t.action(api.precos.buscar, { itemId })).toEqual({ origem: "exemplo", encontrados: 3, motivo: "falha" });
		expect(aviso).toHaveBeenCalledWith(expect.stringContaining("o Firecrawl respondeu 500"));
		expect((await orcamentosSalvos(t)).every(({ origem }) => origem === "exemplo")).toBe(true);
	});

	it("cai nos preços de exemplo quando o Firecrawl não acha preço válido", async () => {
		firecrawlRespondendo({ data: { web: [{ url: "https://loja-d.com.br/roteador", json: { loja: "Loja D", preco: "" } }] } });
		const t = await escolaComSaldo();
		const itemId = await itemParaBusca(t);
		expect(await t.action(api.precos.buscar, { itemId })).toEqual({ origem: "exemplo", encontrados: 3, motivo: "sem preço" });
		expect(await t.run((ctx) => ctx.db.get(itemId))).toMatchObject({ buscaDePrecoEm: expect.any(Number) });
	});

	it("completa só até três orçamentos, sem repetir o fornecedor", async () => {
		vi.stubEnv("FIRECRAWL_API_KEY", "");
		const t = await escolaComSaldo();
		const itemId = await itemParaBusca(t);
		await t.mutation(api.orcamentos.adicionar, { itemId, fornecedor: "Loja A", valorEmCentavos: 51_000 });
		expect(await t.action(api.precos.buscar, { itemId })).toMatchObject({ origem: "exemplo", encontrados: 2 });
		expect(await t.action(api.precos.buscar, { itemId })).toMatchObject({ origem: "exemplo", encontrados: 0 });
		expect((await orcamentosSalvos(t)).map(({ fornecedor, origem }) => [fornecedor, origem])).toEqual([
			["Loja A", "manual"],
			["Loja B", "exemplo"],
			["Loja C", "exemplo"],
		]);
	});

	it("não busca preço de despesa que o PDDE não paga", async () => {
		vi.stubEnv("FIRECRAWL_API_KEY", "");
		const t = await escolaComSaldo();
		const itemId = await itemParaBusca(t, "conta de consumo", "Conta de luz de dezembro");
		await expect(t.action(api.precos.buscar, { itemId })).rejects.toThrow("O PDDE não paga conta de consumo");
		expect(await orcamentosSalvos(t)).toEqual([]);
	});
});

describe("sugestão de itens", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("usa as regras fixas quando a LLM_API_KEY não está configurada", async () => {
		const chamada = semChaveDaIa();
		const t = await escolaComSaldo();
		const resultado = await t.action(api.sugestoes.gerar, { codigoInep: INEP, pedido: "Faltam livros na biblioteca" });
		expect(chamada).not.toHaveBeenCalled();
		expect(resultado).toMatchObject({ origem: "regras", bloqueadas: [], descartadas: 0 });
		expect(resultado.adicionados).toBeGreaterThan(0);
		const painel = await t.query(api.painel.daEscola, { codigoInep: INEP });
		expect(painel?.itens).toHaveLength(resultado.adicionados);
		expect(painel?.itens[0]).toMatchObject({ descricao: "Livro de literatura infantojuvenil", prioridade: 1, orcamentos: [] });
		expect(painel?.itens.every(({ tipo }) => REGRAS_POR_TIPO[tipo].permitido)).toBe(true);
	});

	it("não repete as sugestões das regras fixas num segundo pedido", async () => {
		semChaveDaIa();
		const t = await escolaComSaldo();
		const primeiro = await t.action(api.sugestoes.gerar, { codigoInep: INEP });
		const segundo = await t.action(api.sugestoes.gerar, { codigoInep: INEP });
		const descricoes = await descricoesSalvas(t);
		expect(descricoes).toHaveLength(primeiro.adicionados + segundo.adicionados);
		expect(new Set(descricoes).size).toBe(descricoes.length);
	});

	it("barra as despesas vedadas que a IA devolve antes de salvar", async () => {
		const chamada = iaRespondendo(RESPOSTA_DA_IA);
		const t = await escolaComSaldo();
		const resultado = await t.action(api.sugestoes.gerar, { codigoInep: INEP, pedido: "Pagar a luz, o vigia e comprar cadeiras" });
		expect(resultado).toMatchObject({ origem: "ia", adicionados: 2, descartadas: 0 });
		expect(resultado.bloqueadas.map(({ tipo, motivo }) => [tipo, motivo])).toEqual([
			["conta de consumo", "O PDDE não paga conta de consumo"],
			["pessoal", "O PDDE não paga pessoal"],
			["tarifa bancária", "O PDDE não paga tarifa bancária"],
		]);
		expect(await descricoesSalvas(t)).toEqual(["Cadeiras para o refeitório", "Livros de literatura"]);
		const [endereco, opcoes] = chamada.mock.calls[0];
		expect(endereco).toBe("https://api.openai.com/v1/chat/completions");
		const corpo = JSON.parse(String(opcoes?.body));
		expect(corpo.response_format).toMatchObject({ type: "json_schema", json_schema: { strict: true } });
		expect(corpo.messages[1].content).toContain("Pagar a luz, o vigia e comprar cadeiras");
	});

	it("cai nas regras fixas quando a IA falha", async () => {
		vi.stubEnv("LLM_API_KEY", "chave-de-teste");
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => respostaJson({ error: "fora do ar" }, 503)),
		);
		const t = await escolaComSaldo();
		const resultado = await t.action(api.sugestoes.gerar, { codigoInep: INEP });
		expect(resultado.origem).toBe("regras");
		expect(resultado.aviso).toContain("a IA respondeu 503");
		expect(resultado.adicionados).toBeGreaterThan(0);
	});

	it("espera um minuto entre dois pedidos à IA da mesma escola", async () => {
		iaRespondendo({ itens: [] });
		const t = await escolaComSaldo();
		await t.action(api.sugestoes.gerar, { codigoInep: INEP });
		await expect(t.action(api.sugestoes.gerar, { codigoInep: INEP })).rejects.toThrow("Espere um minuto");
	});

	it("barra item vedado na gravação mesmo sem passar pela geração", async () => {
		const t = await escolaComSaldo();
		const resultado = await t.mutation(internal.sugestoes.registrar, {
			codigoInep: INEP,
			sugestoes: [
				{ descricao: "Aluguel do salão de festas", tipo: "aluguel", quantidade: 1, prioridade: 1 },
				{ descricao: "IPTU do prédio", tipo: "tributo", quantidade: 1, prioridade: 2 },
				{ descricao: "Ventiladores", tipo: "material permanente", quantidade: 4, prioridade: 3 },
				{ descricao: "ventiladores", tipo: "material permanente", quantidade: 4, prioridade: 4 },
				{ descricao: "Carro da escola", tipo: "veículo", quantidade: 1, prioridade: 5 },
			],
		});
		expect(resultado).toMatchObject({ adicionados: 1, descartadas: 2 });
		expect(resultado.bloqueadas.map(({ tipo }) => tipo)).toEqual(["aluguel", "tributo"]);
		expect(await descricoesSalvas(t)).toEqual(["Ventiladores"]);
	});

	it("recusa pedido longo e plano aprovado", async () => {
		semChaveDaIa();
		const t = await escolaComSaldo();
		await expect(t.action(api.sugestoes.gerar, { codigoInep: INEP, pedido: "a".repeat(601) })).rejects.toThrow(
			"Conte o que a escola precisa",
		);
		await t.mutation(api.itens.preencherComExemplo, { codigoInep: INEP });
		await t.mutation(api.planos.aprovar, { codigoInep: INEP });
		await expect(t.action(api.sugestoes.gerar, { codigoInep: INEP })).rejects.toThrow("Reabra o plano");
	});
});

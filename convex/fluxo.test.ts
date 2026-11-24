import { type AcaoLimitada, ESCOLA_EXEMPLO, LIMITES, REGRAS_POR_TIPO, type TipoDeDespesa, USOS_POR_HORA } from "@aloca/dominio";
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

const INEP_COMUM = "99000010";

async function escolaComSaldo(codigoInep = INEP) {
	const t = convexTest(schema, MODULOS);
	await t.mutation(internal.saldos.registrarColeta, { ...COLETA, escola: { ...ESCOLA, codigoInep } });
	return t;
}

type Teste = ReturnType<Awaited<ReturnType<typeof escolaComSaldo>>["withIdentity"]>;

const DIRETORA = { subject: "usuario_diretora", name: "Maria" };
const OUTRA_PESSOA = { subject: "usuario_outra", name: "João" };

async function escolaComResponsavel(codigoInep = INEP_COMUM) {
	const diretora = (await escolaComSaldo(codigoInep)).withIdentity(DIRETORA);
	await diretora.mutation(api.acessos.assumir, { codigoInep, nome: "Maria" });
	return diretora;
}

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

function nvoipRespondendo() {
	for (const [nome, valor] of Object.entries({
		NVOIP_NUMBERSIP: "sip-de-teste",
		NVOIP_USER_TOKEN: "token-de-teste",
		NVOIP_CLIENT_ID: "cliente-de-teste",
		NVOIP_CLIENT_SECRET: "segredo-de-teste",
		NVOIP_WHATSAPP_INSTANCE: "",
		NVOIP_WHATSAPP_TEMPLATE: "",
	})) {
		vi.stubEnv(nome, valor);
	}
	const chamada = vi.fn(async (endereco: string | URL | Request, _opcoes?: RequestInit) =>
		respostaJson(String(endereco).endsWith("/oauth/token") ? { access_token: "acesso-de-teste" } : {}),
	);
	vi.stubGlobal("fetch", chamada);
	return chamada;
}

function enviosDeSms(chamada: ReturnType<typeof nvoipRespondendo>) {
	return chamada.mock.calls.filter(([endereco]) => String(endereco).endsWith("/sms")).length;
}

async function escolaComCelular() {
	const t = await escolaComResponsavel();
	await t.mutation(api.contatos.salvar, { codigoInep: INEP_COMUM, papel: "diretor", nome: "Maria", celular: "(18) 99123-4567" });
	return t;
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
		expect(painel?.publicada).toBe(false);
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
		await expect(
			t.mutation(api.orcamentos.adicionar, {
				itemId,
				fornecedor: "Livraria C",
				valorEmCentavos: 10_000,
				endereco: "http://livraria.com.br",
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
		const t = convexTest(schema, MODULOS).withIdentity(DIRETORA);
		const codigoInep = "99000002";
		await expect(t.action(api.pddeInfo.consultar, { codigoInep })).rejects.toThrow("importe o saldo por planilha CSV");
		const resultado = await t.mutation(api.saldos.importarPlanilha, { codigoInep, texto: PLANILHA, nomeDoArquivo: "saldos.csv" });
		expect(resultado).toEqual({ exercicio: 2026, saldo: { custeio: 100, capital: 100 } });
		const painel = await t.query(api.painel.daEscola, { codigoInep });
		expect(painel?.escola).toEqual({ codigoInep, nome: "Escola 99000002", municipio: "Município não informado" });
		expect(painel?.saldo).toMatchObject({
			exercicio: 2026,
			saldo: { custeio: 100, capital: 100 },
			fonte: { nome: "Planilha saldos.csv" },
			pendencias: [],
		});
		expect(await t.run((ctx) => ctx.db.query("escola").collect())).toHaveLength(1);
	});

	it("cria a escola com o nome e o município da planilha", async () => {
		const t = convexTest(schema, MODULOS).withIdentity(DIRETORA);
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
		const t = convexTest(schema, MODULOS).withIdentity(DIRETORA);
		await t.mutation(internal.escolas.cadastrar, { codigoInep: "99000002", nome: "EMEF Vila Nova", municipio: "Marília/SP" });
		await t.mutation(api.saldos.importarPlanilha, { codigoInep: "99000002", texto: PLANILHA, nomeDoArquivo: "saldos.csv" });
		const painel = await t.query(api.painel.daEscola, { codigoInep: "99000002" });
		expect(painel?.escola.nome).toBe("EMEF Vila Nova");
		expect(painel?.saldo?.saldo).toEqual({ custeio: 100, capital: 100 });
	});

	it("recusa planilha sem a escola, código inválido, arquivo grande e escola que já tem saldo", async () => {
		const t = convexTest(schema, MODULOS).withIdentity(DIRETORA);
		const importar = (codigoInep: string, texto = PLANILHA) =>
			t.mutation(api.saldos.importarPlanilha, { codigoInep, texto, nomeDoArquivo: "saldos.csv" });
		await expect(importar("99000003")).rejects.toThrow("não tem uma linha válida da escola 99000003");
		await expect(importar("1234")).rejects.toThrow("8 dígitos");
		await expect(importar("99000002", "a".repeat(500_001))).rejects.toThrow("grande demais");
		await expect(importar("99000002", "inep;total")).rejects.toThrow("Faltam as colunas");
		expect(await t.run((ctx) => ctx.db.query("escola").collect())).toEqual([]);
		const comSaldo = await escolaComSaldo("99000002");
		await expect(
			comSaldo
				.withIdentity(DIRETORA)
				.mutation(api.saldos.importarPlanilha, { codigoInep: "99000002", texto: PLANILHA, nomeDoArquivo: "saldos.csv" }),
		).rejects.toThrow("já tem saldo");
	});

	it("não deixa a planilha trocar o saldo da escola de demonstração", async () => {
		const t = convexTest(schema, MODULOS);
		await expect(
			t.mutation(api.saldos.importarPlanilha, { codigoInep: INEP, texto: PLANILHA, nomeDoArquivo: "saldos.csv" }),
		).rejects.toThrow("escola de demonstração");
		expect(await t.run((ctx) => ctx.db.query("saldo").collect())).toEqual([]);
	});

	it("não deixa um exercício futuro passar na frente do saldo do PDDE Info", async () => {
		const t = convexTest(schema, MODULOS).withIdentity(DIRETORA);
		const texto = ["inep;exercicio;custeio;capital", "99000002;9999;1,00;1,00"].join("\n");
		await expect(
			t.mutation(api.saldos.importarPlanilha, { codigoInep: "99000002", texto, nomeDoArquivo: "saldos.csv" }),
		).rejects.toThrow('exercício "9999" precisa ser um ano entre 1995');
		expect(await t.run((ctx) => ctx.db.query("saldo").collect())).toEqual([]);
	});
});

describe("limites das ações abertas", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
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
		const t = await escolaComResponsavel();
		await t.mutation(api.contatos.salvar, { codigoInep: INEP_COMUM, papel: "diretor", nome: "Maria", celular: "(18) 99123-4567" });
		await encherUsos(t, "contato");
		await t.mutation(api.contatos.salvar, {
			codigoInep: INEP_COMUM,
			papel: "diretor",
			nome: "Maria Souza",
			celular: "(18) 99123-4567",
		});
		await expect(
			t.mutation(api.contatos.salvar, { codigoInep: INEP_COMUM, papel: "tesoureiro", nome: "João", celular: "(18) 99123-0000" }),
		).rejects.toThrow("Muitos contatos");
		expect(await t.query(api.contatos.daEscola, { codigoInep: INEP_COMUM })).toEqual([
			expect.objectContaining({ nome: "Maria Souza" }),
		]);
	});

	it("não consulta o PDDE Info depois do limite da hora", async () => {
		const chamada = vi.fn();
		vi.stubGlobal("fetch", chamada);
		const t = convexTest(schema, MODULOS);
		await encherUsos(t, "consulta ao PDDE Info");
		await expect(t.action(api.pddeInfo.consultar, { codigoInep: INEP_COMUM })).rejects.toThrow("Muitas consultas ao PDDE Info");
		expect(chamada).not.toHaveBeenCalled();
	});

	it("mostra o saldo salvo, e o da demonstração, quando as consultas ao PDDE Info acabam na hora", async () => {
		const chamada = vi.fn();
		vi.stubGlobal("fetch", chamada);
		const t = await escolaComSaldo(INEP_COMUM);
		await encherUsos(t, "consulta ao PDDE Info");
		expect(await t.action(api.pddeInfo.consultar, { codigoInep: INEP_COMUM })).toEqual({
			codigoInep: INEP_COMUM,
			aviso: expect.stringContaining("Mostrando o último saldo salvo. Muitas consultas ao PDDE Info"),
		});
		expect(await t.action(api.pddeInfo.consultar, { codigoInep: INEP })).toEqual({
			codigoInep: INEP,
			aviso: expect.stringContaining("Mostrando o saldo guardado da escola de demonstração."),
		});
		expect((await t.query(api.painel.daEscola, { codigoInep: INEP }))?.saldo?.saldo).toEqual(ESCOLA_EXEMPLO.saldo);
		expect(chamada).not.toHaveBeenCalled();
	});

	it("conta cada busca de preço no limite da hora, mesmo repetindo o item", async () => {
		const chamada = firecrawlRespondendo(RESPOSTA_DO_FIRECRAWL);
		const t = await escolaComSaldo();
		const itemId = await itemParaBusca(t);
		await encherUsos(t, "busca de preço");
		expect(await t.action(api.precos.buscar, { itemId })).toMatchObject({ origem: "exemplo", motivo: "limite" });
		expect(chamada).not.toHaveBeenCalled();
		expect(await t.run((ctx) => ctx.db.get(itemId))).not.toHaveProperty("buscaDePrecoEm");
	});

	it("espera um minuto entre duas buscas de preço do mesmo item", async () => {
		const chamada = firecrawlRespondendo(RESPOSTA_DO_FIRECRAWL);
		const t = await escolaComSaldo();
		const itemId = await itemParaBusca(t);
		await t.action(api.precos.buscar, { itemId });
		await expect(t.action(api.precos.buscar, { itemId })).rejects.toThrow("Espere um minuto");
		expect(chamada).toHaveBeenCalledTimes(1);
		expect(await t.run((ctx) => ctx.db.query("uso").collect())).toEqual([expect.objectContaining({ acao: "busca de preço" })]);
	});

	it("cai nas regras fixas quando os pedidos à IA acabam na hora", async () => {
		const chamada = iaRespondendo(RESPOSTA_DA_IA);
		const t = await escolaComSaldo();
		await encherUsos(t, "sugestão com IA");
		const resultado = await t.action(api.sugestoes.gerar, { codigoInep: INEP });
		expect(resultado).toMatchObject({ origem: "regras", aviso: expect.stringContaining("limite de pedidos") });
		expect(chamada).not.toHaveBeenCalled();
	});

	it("barra planilhas depois do limite da hora e esquece os usos antigos", async () => {
		const t = convexTest(schema, MODULOS).withIdentity(DIRETORA);
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
		const t = await escolaComResponsavel();
		const contatoId = await t.mutation(api.contatos.salvar, {
			codigoInep: INEP_COMUM,
			papel: "diretor",
			nome: "Maria",
			celular: "(18) 99123-4567",
		});
		await t.mutation(api.contatos.remover, { contatoId });
		await expect(t.mutation(api.contatos.remover, { contatoId })).rejects.toThrow("já foi removido");
	});

	it("guarda um contato por papel e só devolve o celular mascarado", async () => {
		const t = await escolaComResponsavel();
		await t.mutation(api.contatos.salvar, { codigoInep: INEP_COMUM, papel: "diretor", nome: "Maria", celular: "(18) 99123-4567" });
		await t.mutation(api.contatos.salvar, {
			codigoInep: INEP_COMUM,
			papel: "diretor",
			nome: "Maria Souza",
			celular: "(18) 99123-0000",
		});
		const contatos = await t.query(api.contatos.daEscola, { codigoInep: INEP_COMUM });
		expect(contatos).toEqual([expect.objectContaining({ papel: "diretor", nome: "Maria Souza", celular: "(18) •••••-0000" })]);
	});

	it("aceita só e-mail, guarda o endereço limpo e pede ao menos um canal", async () => {
		const t = await escolaComResponsavel();
		const contato = { codigoInep: INEP_COMUM, papel: "tesoureiro" as const, nome: "João" };
		await expect(t.mutation(api.contatos.salvar, contato)).rejects.toThrow("celular ou um e-mail");
		await expect(t.mutation(api.contatos.salvar, { ...contato, email: "joao@escola" })).rejects.toThrow("e-mail válido");
		await t.mutation(api.contatos.salvar, { ...contato, celular: " ", email: " Joao@Escola.com.br " });
		expect(await t.query(api.contatos.daEscola, { codigoInep: INEP_COMUM })).toEqual([
			expect.objectContaining({ papel: "tesoureiro", celular: null, email: "j•••@escola.com.br" }),
		]);
		expect((await t.run((ctx) => ctx.db.query("contato").first()))?.email).toBe("joao@escola.com.br");
	});

	it("recusa telefone fixo", async () => {
		const t = await escolaComResponsavel();
		await expect(
			t.mutation(api.contatos.salvar, { codigoInep: INEP_COMUM, papel: "tesoureiro", nome: "João", celular: "(18) 3521-4567" }),
		).rejects.toThrow("celular com DDD");
	});
});

describe("alertas", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("avisa quando a Nvoip não está configurada", async () => {
		const t = await escolaComResponsavel();
		await expect(t.action(api.alertas.enviarAgora, { codigoInep: INEP_COMUM })).rejects.toThrow("Nvoip");
	});

	it("manda um alerta só, mesmo com vários pedidos ao mesmo tempo", async () => {
		const chamada = nvoipRespondendo();
		const t = await escolaComCelular();
		const envios = await Promise.allSettled([1, 2, 3].map(() => t.action(api.alertas.enviarAgora, { codigoInep: INEP_COMUM })));
		expect(envios.filter(({ status }) => status === "fulfilled")).toEqual([{ status: "fulfilled", value: { enviados: 1, falhas: 0 } }]);
		for (const envio of envios.filter((envio) => envio.status === "rejected")) {
			expect(String(envio.reason)).toContain("Espere 10 minutos");
		}
		expect(enviosDeSms(chamada)).toBe(1);
		await expect(t.action(api.alertas.enviarAgora, { codigoInep: INEP_COMUM })).rejects.toThrow("Espere 10 minutos");
		expect(enviosDeSms(chamada)).toBe(1);
	});

	function resendRespondendo(status = 200) {
		vi.stubEnv("RESEND_API_KEY", "re_teste");
		vi.stubEnv("RESEND_FROM", "Aloca <alertas@aloca.app>");
		vi.stubEnv("SITE_URL", "https://aloca.app/");
		const chamada = vi.fn(async (_endereco: string | URL | Request, _opcoes?: RequestInit) => respostaJson({ id: "email" }, status));
		vi.stubGlobal("fetch", chamada);
		return chamada;
	}

	async function escolaComEmail() {
		const t = await escolaComResponsavel();
		await t.mutation(api.contatos.salvar, { codigoInep: INEP_COMUM, papel: "diretor", nome: "Maria", email: "maria@escola.com.br" });
		return t;
	}

	it("manda o alerta por e-mail pelo Resend e guarda no histórico", async () => {
		const chamada = resendRespondendo();
		const t = await escolaComEmail();
		expect(await t.action(api.alertas.enviarAgora, { codigoInep: INEP_COMUM })).toEqual({ enviados: 1, falhas: 0 });
		const [endereco, opcoes] = chamada.mock.calls[0];
		expect(endereco).toBe("https://api.resend.com/emails");
		expect(new Headers(opcoes?.headers).get("Authorization")).toBe("Bearer re_teste");
		const corpo = JSON.parse(String(opcoes?.body));
		expect(corpo).toMatchObject({ from: "Aloca <alertas@aloca.app>", to: ["maria@escola.com.br"] });
		expect(corpo.html).toContain(`https://aloca.app/escola/${INEP_COMUM}/plano`);
		expect(await t.query(api.alertas.historico, { codigoInep: INEP_COMUM })).toEqual([
			expect.objectContaining({ canal: "email", erro: null, mensagem: corpo.subject }),
		]);
	});

	it("guarda a falha do Resend no histórico", async () => {
		resendRespondendo(422);
		const t = await escolaComEmail();
		expect(await t.action(api.alertas.enviarAgora, { codigoInep: INEP_COMUM })).toEqual({ enviados: 0, falhas: 1 });
		expect(await t.query(api.alertas.historico, { codigoInep: INEP_COMUM })).toEqual([
			expect.objectContaining({ canal: null, erro: "o Resend respondeu 422" }),
		]);
	});

	it("pede um e-mail quando só o Resend está configurado", async () => {
		const chamada = resendRespondendo();
		const t = await escolaComCelular();
		await expect(t.action(api.alertas.enviarAgora, { codigoInep: INEP_COMUM })).rejects.toThrow("Cadastre um e-mail");
		expect(chamada).not.toHaveBeenCalled();
	});

	it("conta cada pedido no limite de alertas da hora", async () => {
		const chamada = nvoipRespondendo();
		const t = await escolaComCelular();
		await t.run(async (ctx) => {
			for (let indice = 0; indice < USOS_POR_HORA["alerta manual"]; indice += 1) {
				await ctx.db.insert("uso", { acao: "alerta manual", em: Date.now() });
			}
		});
		await expect(t.action(api.alertas.enviarAgora, { codigoInep: INEP_COMUM })).rejects.toThrow("limite de alertas");
		expect(chamada).not.toHaveBeenCalled();
	});
});

describe("acesso às escolas", () => {
	const ITEM = { codigoInep: INEP_COMUM, descricao: "Livros", tipo: "livro" as const, quantidade: 1, prioridade: 1 };
	const CELULAR = { codigoInep: INEP_COMUM, papel: "diretor" as const, nome: "Maria", celular: "(18) 99123-4567" };

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("deixa o visitante sem conta só olhando, mas a demonstração continua aberta", async () => {
		const t = await escolaComSaldo(INEP_COMUM);
		await t.mutation(internal.saldos.registrarColeta, COLETA);
		await expect(t.mutation(api.itens.adicionar, ITEM)).rejects.toThrow("Entre com sua conta");
		await expect(t.mutation(api.planos.reabrir, { codigoInep: INEP_COMUM })).rejects.toThrow("Entre com sua conta");
		expect((await t.query(api.painel.daEscola, { codigoInep: INEP_COMUM }))?.acesso).toEqual({
			demonstracao: false,
			entrou: false,
			membro: false,
			temResponsavel: false,
			podeEditar: false,
		});
		await t.mutation(api.itens.preencherComExemplo, { codigoInep: INEP });
		expect((await t.query(api.painel.daEscola, { codigoInep: INEP }))?.acesso).toMatchObject({ demonstracao: true, podeEditar: true });
		await expect(t.withIdentity(DIRETORA).mutation(api.acessos.assumir, { codigoInep: INEP, nome: "Maria" })).rejects.toThrow(
			"demonstração",
		);
	});

	it("dá a escola à primeira conta e deixa as outras só olhando", async () => {
		const diretora = await escolaComResponsavel();
		await diretora.mutation(api.contatos.salvar, CELULAR);
		const itemId = await diretora.mutation(api.itens.adicionar, ITEM);
		const outra = diretora.withIdentity(OUTRA_PESSOA);
		await expect(outra.mutation(api.acessos.assumir, { codigoInep: INEP_COMUM, nome: "João" })).rejects.toThrow("Peça um convite");
		await expect(outra.mutation(api.itens.adicionar, ITEM)).rejects.toThrow("Peça um convite");
		await expect(outra.mutation(api.itens.remover, { itemId })).rejects.toThrow("Peça um convite");
		await expect(outra.mutation(api.orcamentos.adicionar, { itemId, fornecedor: "Loja A", valorEmCentavos: 100 })).rejects.toThrow(
			"Peça um convite",
		);
		await expect(outra.mutation(api.contatos.salvar, { ...CELULAR, nome: "João" })).rejects.toThrow("Peça um convite");
		expect((await outra.query(api.painel.daEscola, { codigoInep: INEP_COMUM }))?.acesso).toMatchObject({
			entrou: true,
			membro: false,
			temResponsavel: true,
			podeEditar: false,
		});
		expect(await outra.query(api.contatos.daEscola, { codigoInep: INEP_COMUM })).toEqual([]);
		expect(await outra.query(api.acessos.membros, { codigoInep: INEP_COMUM })).toEqual([]);
		expect(await diretora.query(api.contatos.daEscola, { codigoInep: INEP_COMUM })).toHaveLength(1);
		expect(await diretora.query(api.acessos.minhasEscolas, {})).toEqual([{ ...ESCOLA, codigoInep: INEP_COMUM }]);
		expect(await outra.query(api.acessos.minhasEscolas, {})).toEqual([]);
	});

	it("barra as ações de quem não cuida da escola antes de chamar a IA, o Firecrawl ou a Nvoip", async () => {
		const chamada = vi.fn();
		vi.stubGlobal("fetch", chamada);
		vi.stubEnv("LLM_API_KEY", "chave-de-teste");
		vi.stubEnv("FIRECRAWL_API_KEY", "fc-teste");
		const diretora = await escolaComResponsavel();
		const itemId = await diretora.mutation(api.itens.adicionar, { ...ITEM, tipo: "material permanente", descricao: "Roteador" });
		const itemVedadoId = await diretora.mutation(api.itens.adicionar, {
			...ITEM,
			tipo: "conta de consumo",
			descricao: "Conta de luz",
			prioridade: 2,
		});
		const outra = diretora.withIdentity(OUTRA_PESSOA);
		await expect(outra.action(api.precos.buscar, { itemId })).rejects.toThrow("Peça um convite");
		await expect(outra.action(api.precos.buscar, { itemId: itemVedadoId })).rejects.toThrow("Peça um convite");
		await expect(outra.action(api.sugestoes.gerar, { codigoInep: INEP_COMUM })).rejects.toThrow("Peça um convite");
		await expect(outra.action(api.alertas.enviarAgora, { codigoInep: INEP_COMUM })).rejects.toThrow("Peça um convite");
		expect(chamada).not.toHaveBeenCalled();
		expect(await diretora.run((ctx) => ctx.db.query("uso").collect())).toEqual([]);
	});

	it("entra na escola por um convite que só vale uma vez", async () => {
		const diretora = await escolaComResponsavel();
		const outra = diretora.withIdentity(OUTRA_PESSOA);
		await expect(outra.mutation(api.acessos.criarConvite, { codigoInep: INEP_COMUM })).rejects.toThrow("Só quem cuida");
		const codigo = await diretora.mutation(api.acessos.criarConvite, { codigoInep: INEP_COMUM });
		expect(codigo).toMatch(/^[0-9a-f]{32}$/);
		expect(await outra.query(api.acessos.convite, { codigo })).toEqual({
			codigoInep: INEP_COMUM,
			nomeDaEscola: ESCOLA.nome,
			valido: true,
		});
		expect(await outra.mutation(api.acessos.aceitarConvite, { codigo, nome: "João" })).toBe(INEP_COMUM);
		await outra.mutation(api.itens.adicionar, ITEM);
		expect(await outra.query(api.acessos.membros, { codigoInep: INEP_COMUM })).toEqual([
			expect.objectContaining({ nome: "Maria", souEu: false }),
			expect.objectContaining({ nome: "João", souEu: true }),
		]);
		const terceira = diretora.withIdentity({ subject: "usuario_terceira" });
		await expect(terceira.mutation(api.acessos.aceitarConvite, { codigo, nome: "Ana" })).rejects.toThrow("não vale mais");
		expect(await terceira.query(api.acessos.convite, { codigo })).toBeNull();
		expect(await terceira.query(api.acessos.convite, { codigo: "nao-e-um-codigo" })).toBeNull();
	});

	it("recusa convite vencido e limita os convites abertos", async () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date("2026-11-22T12:00:00Z"));
		const diretora = await escolaComResponsavel();
		const codigo = await diretora.mutation(api.acessos.criarConvite, { codigoInep: INEP_COMUM });
		for (let indice = 1; indice < LIMITES.convitesPorEscola; indice += 1) {
			await diretora.mutation(api.acessos.criarConvite, { codigoInep: INEP_COMUM });
		}
		await expect(diretora.mutation(api.acessos.criarConvite, { codigoInep: INEP_COMUM })).rejects.toThrow("convites abertos");
		vi.setSystemTime(new Date("2026-11-30T12:00:00Z"));
		expect(await diretora.query(api.acessos.convite, { codigo })).toMatchObject({ valido: false });
		await expect(diretora.withIdentity(OUTRA_PESSOA).mutation(api.acessos.aceitarConvite, { codigo, nome: "João" })).rejects.toThrow(
			"não vale mais",
		);
		await diretora.mutation(api.acessos.criarConvite, { codigoInep: INEP_COMUM });
		expect(await diretora.run((ctx) => ctx.db.query("convite").collect())).toHaveLength(1);
	});

	it("tira alguém da escola, impede deixar sem responsável e limpa contatos ao liberar a escola", async () => {
		const diretora = await escolaComResponsavel();
		await diretora.mutation(api.contatos.salvar, CELULAR);
		const outra = diretora.withIdentity(OUTRA_PESSOA);
		const codigo = await diretora.mutation(api.acessos.criarConvite, { codigoInep: INEP_COMUM });
		await outra.mutation(api.acessos.aceitarConvite, { codigo, nome: "João" });
		const [maria, joao] = await diretora.query(api.acessos.membros, { codigoInep: INEP_COMUM });
		const terceira = diretora.withIdentity({ subject: "usuario_terceira" });
		expect([maria.responsavel, joao.responsavel]).toEqual([true, false]);
		await expect(terceira.mutation(api.acessos.removerMembro, { membroId: joao._id })).rejects.toThrow("Só quem cuida");
		await expect(outra.mutation(api.acessos.removerMembro, { membroId: maria._id })).rejects.toThrow("assumiu a escola primeiro");
		await diretora.mutation(api.acessos.removerMembro, { membroId: joao._id });
		await expect(diretora.mutation(api.acessos.removerMembro, { membroId: maria._id })).rejects.toThrow(
			"não pode ficar sem responsável",
		);
		await expect(outra.mutation(api.itens.adicionar, ITEM)).rejects.toThrow("Peça um convite");
		expect(await diretora.mutation(internal.acessos.liberarEscola, { codigoInep: INEP_COMUM })).toBe(1);
		expect(await diretora.run((ctx) => ctx.db.query("contato").collect())).toEqual([]);
		await outra.mutation(api.acessos.assumir, { codigoInep: INEP_COMUM, nome: "João" });
		expect(await outra.query(api.contatos.daEscola, { codigoInep: INEP_COMUM })).toEqual([]);
		await outra.mutation(api.itens.adicionar, ITEM);
		await expect(diretora.mutation(api.itens.adicionar, ITEM)).rejects.toThrow("Peça um convite");
	});

	it("deixa quem importou a planilha cuidando da escola", async () => {
		const t = convexTest(schema, MODULOS);
		const texto = ["inep;exercicio;custeio;capital", "99000001;2026;1,00;1,00", "99000002;2026;1,00;1,00"].join("\n");
		const importar = (quem: Teste, codigoInep: string) =>
			quem.mutation(api.saldos.importarPlanilha, { codigoInep, texto, nomeDoArquivo: "s.csv", nome: "Maria Souza" });
		await expect(importar(t, "99000001")).rejects.toThrow("Entre com sua conta");
		await importar(t.withIdentity(DIRETORA), "99000001");
		expect(await t.withIdentity(DIRETORA).query(api.acessos.membros, { codigoInep: "99000001" })).toEqual([
			expect.objectContaining({ nome: "Maria Souza", souEu: true }),
		]);
		await t.mutation(internal.escolas.cadastrar, { codigoInep: "99000002", nome: "EMEF Vila Nova", municipio: "Marília/SP" });
		await t.withIdentity(OUTRA_PESSOA).mutation(api.acessos.assumir, { codigoInep: "99000002", nome: "João" });
		await expect(importar(t.withIdentity(DIRETORA), "99000002")).rejects.toThrow("Só quem cuida");
	});

	it("limita quantas escolas uma conta assume", async () => {
		const diretora = await escolaComResponsavel();
		await diretora.run(async (ctx) => {
			const escola = await ctx.db.query("escola").first();
			for (let indice = 1; indice < LIMITES.escolasPorConta && escola; indice += 1) {
				await ctx.db.insert("membro", { escolaId: escola._id, usuario: "usuario_lotado", nome: "Lotada", entrouEm: 1 });
			}
		});
		await diretora.mutation(internal.escolas.cadastrar, { codigoInep: "99000020", nome: "EMEF A", municipio: "Bauru/SP" });
		await diretora.mutation(internal.escolas.cadastrar, { codigoInep: "99000021", nome: "EMEF B", municipio: "Bauru/SP" });
		const lotada = diretora.withIdentity({ subject: "usuario_lotado" });
		await lotada.mutation(api.acessos.assumir, { codigoInep: "99000020", nome: "Lotada" });
		await expect(lotada.mutation(api.acessos.assumir, { codigoInep: "99000021", nome: "Lotada" })).rejects.toThrow(
			`até ${LIMITES.escolasPorConta} escolas`,
		);
	});

	it("limita quantas pessoas cuidam da mesma escola", async () => {
		const diretora = await escolaComResponsavel();
		await diretora.run(async (ctx) => {
			const escola = await ctx.db
				.query("escola")
				.withIndex("por_codigo_inep", (q) => q.eq("codigoInep", INEP_COMUM))
				.unique();
			for (let indice = 1; indice < LIMITES.membrosPorEscola && escola; indice += 1) {
				await ctx.db.insert("membro", { escolaId: escola._id, usuario: `membro_${indice}`, nome: `Pessoa ${indice}`, entrouEm: 1 });
			}
		});
		const codigo = await diretora.mutation(api.acessos.criarConvite, { codigoInep: INEP_COMUM });
		await expect(diretora.withIdentity(OUTRA_PESSOA).mutation(api.acessos.aceitarConvite, { codigo, nome: "João" })).rejects.toThrow(
			`até ${LIMITES.membrosPorEscola} pessoas`,
		);
	});
});

describe("escola de demonstração", () => {
	const SALDO_GUARDADO = {
		exercicio: ESCOLA_EXEMPLO.exercicioDoSaldo,
		saldo: ESCOLA_EXEMPLO.saldo,
		fonte: { nome: ESCOLA_EXEMPLO.fonteDoSaldo, endereco: ESCOLA_EXEMPLO.enderecoDaFonte },
		coletadoEm: ESCOLA_EXEMPLO.saldoColetadoEm.getTime(),
		pendencias: [],
	};

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("carrega a escola e o saldo guardados quando o banco está vazio", async () => {
		const t = convexTest(schema, MODULOS);
		expect(await t.mutation(internal.demonstracao.restaurar, {})).toBe(true);
		const painel = await t.query(api.painel.daEscola, { codigoInep: INEP });
		expect(painel?.escola).toEqual({
			codigoInep: ESCOLA_EXEMPLO.codigoInep,
			nome: ESCOLA_EXEMPLO.nome,
			municipio: ESCOLA_EXEMPLO.municipio,
		});
		expect(painel?.saldo).toEqual(SALDO_GUARDADO);
		expect(painel?.plano).toBeNull();
		expect(await t.mutation(internal.demonstracao.restaurar, {})).toBe(false);
		expect(await t.run((ctx) => ctx.db.query("escola").collect())).toHaveLength(1);
		expect(await t.run((ctx) => ctx.db.query("saldo").collect())).toHaveLength(1);
	});

	it("não troca o saldo que já veio do PDDE Info", async () => {
		const t = await escolaComSaldo();
		expect(await t.mutation(internal.demonstracao.restaurar, {})).toBe(false);
		const painel = await t.query(api.painel.daEscola, { codigoInep: INEP });
		expect(painel?.saldo?.saldo).toEqual(COLETA.saldo);
		expect(painel?.saldo?.fonte).toEqual(COLETA.fonte);
		expect(await t.run((ctx) => ctx.db.query("saldo").collect())).toHaveLength(1);
	});

	it("usa o saldo guardado quando o PDDE Info está fora do ar, mesmo com o banco vazio", async () => {
		const chamada = vi.fn(async () => {
			throw new TypeError("fetch failed");
		});
		vi.stubGlobal("fetch", chamada);
		const t = convexTest(schema, MODULOS);
		const resultado = await t.action(api.pddeInfo.consultar, { codigoInep: INEP });
		expect(chamada).toHaveBeenCalled();
		expect(resultado).toEqual({
			codigoInep: INEP,
			aviso: "Mostrando o saldo guardado da escola de demonstração. O PDDE Info não respondeu (fetch failed).",
		});
		const painel = await t.query(api.painel.daEscola, { codigoInep: INEP });
		expect(painel?.escola.nome).toBe(ESCOLA_EXEMPLO.nome);
		expect(painel?.saldo).toEqual(SALDO_GUARDADO);
		expect(await t.action(api.pddeInfo.consultar, { codigoInep: INEP })).toMatchObject({
			aviso: expect.stringContaining("Mostrando o último saldo salvo."),
		});
		expect(await t.run((ctx) => ctx.db.query("saldo").collect())).toHaveLength(1);
	});

	it("recomeça a demonstração na hora, sem precisar de conta", async () => {
		const t = await escolaComSaldo();
		await t.mutation(api.itens.preencherComExemplo, { codigoInep: INEP });
		await t.mutation(api.demonstracao.recomecar, {});
		const painel = await t.query(api.painel.daEscola, { codigoInep: INEP });
		expect(painel?.plano).toBeNull();
		expect(painel?.saldo?.saldo).toEqual(COLETA.saldo);
		for (const tabela of ["plano", "item", "orcamento"] as const) {
			expect(await t.run((ctx) => ctx.db.query(tabela).collect())).toEqual([]);
		}
		const vazio = convexTest(schema, MODULOS);
		await vazio.mutation(api.demonstracao.recomecar, {});
		expect((await vazio.query(api.painel.daEscola, { codigoInep: INEP }))?.saldo?.saldo).toEqual(ESCOLA_EXEMPLO.saldo);
	});

	it("não cadastra celular nem envia alertas", async () => {
		const t = await escolaComSaldo();
		await expect(
			t.mutation(api.contatos.salvar, { codigoInep: INEP, papel: "diretor", nome: "Maria", celular: "(18) 99123-4567" }),
		).rejects.toThrow("escola de demonstração");
		await expect(t.action(api.alertas.enviarAgora, { codigoInep: INEP })).rejects.toThrow("escola de demonstração");
		expect(await t.run((ctx) => ctx.db.query("contato").collect())).toEqual([]);
	});

	it("deixa de fora da rotina diária os celulares que já estavam na demonstração", async () => {
		const t = await escolaComSaldo();
		await t.run(async (ctx) => {
			const escola = await ctx.db.query("escola").first();
			if (escola) {
				await ctx.db.insert("contato", {
					escolaId: escola._id,
					papel: "diretor",
					nome: "Maria",
					celular: "18991234567",
					criadoEm: 1,
				});
			}
		});
		expect(await t.query(internal.alertas.escolasComContato, {})).toEqual([]);
	});

	it("restaura o plano depois de uma hora sem mudanças", async () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date("2026-11-22T12:00:00Z"));
		const t = await escolaComSaldo();
		await t.mutation(api.itens.preencherComExemplo, { codigoInep: INEP });
		await t.mutation(api.planos.aprovar, { codigoInep: INEP });
		await t.run(async (ctx) => {
			const escola = await ctx.db.query("escola").first();
			if (escola) {
				await ctx.db.insert("contato", {
					escolaId: escola._id,
					papel: "diretor",
					nome: "Maria",
					celular: "18991234567",
					criadoEm: 1,
				});
			}
		});

		vi.setSystemTime(new Date("2026-11-22T12:59:00Z"));
		expect(await t.mutation(internal.demonstracao.restaurar, {})).toBe(false);
		expect((await t.query(api.painel.daEscola, { codigoInep: INEP }))?.plano?.status).toBe("aprovado");

		vi.setSystemTime(new Date("2026-11-22T13:01:00Z"));
		expect(await t.mutation(internal.demonstracao.restaurar, {})).toBe(true);
		const painel = await t.query(api.painel.daEscola, { codigoInep: INEP });
		expect(painel?.plano).toBeNull();
		expect(painel?.itens).toEqual([]);
		expect(painel?.saldo?.saldo).toEqual(COLETA.saldo);
		for (const tabela of ["plano", "item", "orcamento", "contato"] as const) {
			expect(await t.run((ctx) => ctx.db.query(tabela).collect())).toEqual([]);
		}
		expect(await t.mutation(internal.demonstracao.restaurar, {})).toBe(false);
	});

	it("não mexe nas outras escolas", async () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date("2026-11-22T12:00:00Z"));
		const t = await escolaComResponsavel();
		await t.mutation(api.itens.preencherComExemplo, { codigoInep: INEP_COMUM });
		vi.setSystemTime(new Date("2026-11-22T15:00:00Z"));
		expect(await t.mutation(internal.demonstracao.restaurar, {})).toBe(true);
		expect(await t.mutation(internal.demonstracao.restaurar, {})).toBe(false);
		expect((await t.query(api.painel.daEscola, { codigoInep: INEP_COMUM }))?.itens.length).toBeGreaterThan(0);
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

describe("página pública da escola", () => {
	it("só aparece depois que quem cuida publica e mostra só o plano aprovado", async () => {
		const diretora = await escolaComResponsavel();
		const pagina = () => diretora.query(api.transparencia.daEscola, { codigoInep: INEP_COMUM });
		const publicar = (quem: Teste, publicar: boolean) =>
			quem.mutation(api.transparencia.publicar, { codigoInep: INEP_COMUM, publicar });
		expect(await pagina()).toBeNull();
		await expect(publicar(diretora.withIdentity(OUTRA_PESSOA), true)).rejects.toThrow("Só quem cuida");
		await publicar(diretora, true);
		await diretora.mutation(api.itens.preencherComExemplo, { codigoInep: INEP_COMUM });
		expect(await pagina()).toMatchObject({ escola: { codigoInep: INEP_COMUM }, plano: null });
		await diretora.mutation(api.planos.aprovar, { codigoInep: INEP_COMUM });
		const aprovada = await pagina();
		const total = aprovada?.plano?.itens.reduce((soma, { totalEmCentavos }) => soma + totalEmCentavos, 0);
		expect(aprovada?.plano?.itens.length).toBeGreaterThan(0);
		expect(total).toBe((aprovada?.plano?.total.custeio ?? 0) + (aprovada?.plano?.total.capital ?? 0));
		expect(await diretora.query(api.transparencia.publicadas, {})).toEqual([
			{ codigoInep: INEP_COMUM, publicadaEm: expect.any(Number) },
		]);
		await publicar(diretora, false);
		expect(await pagina()).toBeNull();
		expect(await diretora.query(api.transparencia.publicadas, {})).toEqual([]);
	});

	it("deixa a página da demonstração sempre no ar", async () => {
		const t = await escolaComSaldo();
		expect(await t.query(api.transparencia.daEscola, { codigoInep: INEP })).toEqual({ escola: ESCOLA, plano: null });
		await expect(t.mutation(api.transparencia.publicar, { codigoInep: INEP, publicar: false })).rejects.toThrow("sempre no ar");
	});
});

describe("painel da rede", () => {
	const SECRETARIA = { subject: "usuario_secretaria", name: "Ana" };

	async function redeCriada() {
		const diretora = await escolaComResponsavel();
		await diretora.mutation(api.itens.preencherComExemplo, { codigoInep: INEP_COMUM });
		await diretora.mutation(api.planos.aprovar, { codigoInep: INEP_COMUM });
		const secretaria = diretora.withIdentity(SECRETARIA);
		await secretaria.mutation(api.redes.criar, { nome: "Rede Municipal de Adamantina", seuNome: "Ana" });
		return { diretora, secretaria };
	}

	it("pede conta e rede antes de mostrar o painel", async () => {
		const t = convexTest(schema, MODULOS);
		expect(await t.query(api.redes.minha, {})).toBeNull();
		await expect(t.mutation(api.redes.adicionarEscolas, { texto: INEP_COMUM })).rejects.toThrow("Entre com sua conta");
		await expect(t.withIdentity(SECRETARIA).mutation(api.redes.adicionarEscolas, { texto: INEP_COMUM })).rejects.toThrow("Crie a rede");
		await expect(t.withIdentity(SECRETARIA).mutation(api.redes.criar, { nome: "R", seuNome: "Ana" })).rejects.toThrow("nome de 3");
	});

	it("acompanha as escolas coladas pelo INEP e põe primeiro as que precisam agir", async () => {
		const { secretaria } = await redeCriada();
		await secretaria.mutation(api.redes.adicionarEscolas, { texto: `${INEP_COMUM}\n99000099 abc` });
		expect(await secretaria.mutation(api.redes.adicionarEscolas, { texto: INEP_COMUM })).toEqual({
			adicionadas: 0,
			repetidas: 1,
			invalidos: [],
		});
		const painel = await secretaria.query(api.redes.minha, {});
		expect(painel?.rede.nome).toBe("Rede Municipal de Adamantina");
		expect(painel?.escolas.map(({ codigoInep, nivel }) => [codigoInep, nivel])).toEqual([
			[INEP_COMUM, "atenção"],
			["99000099", "sem dados"],
		]);
		expect(painel?.escolas[0]).toMatchObject({ temResponsavel: true, pendencias: 1 });
		expect(painel?.escolas[0].totalAprovado).toBeGreaterThan(0);
		expect(painel?.resumo).toMatchObject({ escolas: 2, comPlanoAprovado: 1, precisamAgir: 1 });
		expect(painel?.membros).toEqual([expect.objectContaining({ nome: "Ana", souEu: true })]);
		await secretaria.mutation(api.redes.removerEscola, { codigoInep: "99000099" });
		expect((await secretaria.query(api.redes.minha, {}))?.escolas).toHaveLength(1);
	});

	it("não deixa quem está fora da rede ver o painel e chama colegas por convite", async () => {
		const { diretora, secretaria } = await redeCriada();
		expect(await diretora.query(api.redes.minha, {})).toBeNull();
		const codigo = await secretaria.mutation(api.redes.criarConvite, {});
		expect(await diretora.query(api.redes.convite, { codigo })).toEqual({ nomeDaRede: "Rede Municipal de Adamantina", valido: true });
		await diretora.mutation(api.redes.aceitarConvite, { codigo, nome: "Maria" });
		expect((await diretora.query(api.redes.minha, {}))?.membros).toHaveLength(2);
		await expect(secretaria.withIdentity(OUTRA_PESSOA).mutation(api.redes.aceitarConvite, { codigo, nome: "João" })).rejects.toThrow(
			"não vale mais",
		);
		await expect(diretora.mutation(api.redes.criar, { nome: "Outra rede", seuNome: "Maria" })).rejects.toThrow("já participa");
	});

	it("limita as escolas de cada rede", async () => {
		const { secretaria } = await redeCriada();
		const codigos = Array.from({ length: LIMITES.escolasPorRede + 1 }, (_, indice) => String(35_000_000 + indice));
		await expect(secretaria.mutation(api.redes.adicionarEscolas, { texto: codigos.join("\n") })).rejects.toThrow(
			`até ${LIMITES.escolasPorRede} escolas`,
		);
	});
});

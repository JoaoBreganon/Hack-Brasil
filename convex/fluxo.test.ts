import { REGRAS_POR_TIPO } from "@aloca/dominio";
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

describe("contatos", () => {
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

	it("pede a chave do Firecrawl antes de buscar preços", async () => {
		const t = await escolaComSaldo();
		const itemId = await t.mutation(api.itens.adicionar, {
			codigoInep: INEP,
			descricao: "Roteador",
			tipo: "material permanente",
			quantidade: 1,
			prioridade: 1,
		});
		await expect(t.action(api.precos.buscar, { itemId })).rejects.toThrow("não está configurada");
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

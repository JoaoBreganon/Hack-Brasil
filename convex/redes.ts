import {
	avaliarEscolaDaRede,
	type EscolaNaRede,
	LIMITES,
	lerCodigosInep,
	ordenarPorRisco,
	resumirRede,
	simularPrazo,
	validarNomeDoContato,
} from "@aloca/dominio";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, type MutationCtx, query, type QueryCtx } from "./_generated/server";
import { buscarEscola } from "./escolas";
import { usuarioAtual } from "./lib/acesso";
import { FORMATO_DO_CODIGO, gerarCodigo, VALIDADE_DO_CONVITE_EM_MS } from "./lib/codigo";
import { falhar } from "./lib/falha";
import { buscarPlano, calcularPlano } from "./lib/plano";
import { buscarSaldoAtual } from "./saldos";

type Participacao = { usuario: string; membro: Doc<"membroDaRede">; rede: Doc<"rede"> };

async function buscarParticipacao(ctx: QueryCtx): Promise<Participacao | null> {
	const usuario = await usuarioAtual(ctx);
	const membro =
		usuario &&
		(await ctx.db
			.query("membroDaRede")
			.withIndex("por_usuario", (q) => q.eq("usuario", usuario))
			.first());
	const rede = membro && (await ctx.db.get(membro.redeId));
	return usuario && membro && rede ? { usuario, membro, rede } : null;
}

async function exigirParticipacao(ctx: QueryCtx): Promise<Participacao> {
	if (!(await usuarioAtual(ctx))) {
		falhar("Entre com sua conta para usar o painel da rede.");
	}
	return (await buscarParticipacao(ctx)) ?? falhar("Crie a rede ou peça um convite a quem já está nela.");
}

function validarNomeDaRede(texto: string): string {
	const nome = texto.replace(/\s+/g, " ").trim();
	const { minimo, maximo } = LIMITES.nomeDaRede;
	return nome.length >= minimo && nome.length <= maximo ? nome : falhar(`Dê um nome de ${minimo} a ${maximo} caracteres à rede.`);
}

async function situacaoDaEscola(ctx: QueryCtx, codigoInep: string): Promise<EscolaNaRede> {
	const escola = await buscarEscola(ctx, codigoInep);
	if (!escola) {
		return { codigoInep, nome: null, municipio: null, saldoTotal: null, totalAprovado: null, pendencias: 0, temResponsavel: false };
	}
	const [saldo, plano, responsavel] = await Promise.all([
		buscarSaldoAtual(ctx, escola._id),
		buscarPlano(ctx, escola._id),
		ctx.db
			.query("membro")
			.withIndex("por_escola_usuario", (q) => q.eq("escolaId", escola._id))
			.first(),
	]);
	const calculado = saldo && plano?.status === "aprovado" ? await calcularPlano(ctx, plano._id, saldo.saldo) : null;
	return {
		codigoInep,
		nome: escola.nome,
		municipio: escola.municipio,
		saldoTotal: saldo ? saldo.saldo.custeio + saldo.saldo.capital : null,
		totalAprovado: calculado ? calculado.totalPorCategoria.custeio + calculado.totalPorCategoria.capital : null,
		pendencias: saldo?.pendencias?.length ?? 0,
		temResponsavel: responsavel !== null,
	};
}

function escolasDaRede(ctx: QueryCtx, rede: Doc<"rede">) {
	return ctx.db
		.query("escolaDaRede")
		.withIndex("por_rede_codigo", (q) => q.eq("redeId", rede._id))
		.take(LIMITES.escolasPorRede);
}

async function entrarNaRede(ctx: MutationCtx, rede: Doc<"rede">, usuario: string, nome: string): Promise<void> {
	if (await buscarParticipacao(ctx)) {
		falhar("Sua conta já participa de uma rede no Aloca.");
	}
	const membros = await ctx.db
		.query("membroDaRede")
		.withIndex("por_rede", (q) => q.eq("redeId", rede._id))
		.take(LIMITES.membrosPorRede);
	if (membros.length >= LIMITES.membrosPorRede) {
		falhar(`Cada rede aceita até ${LIMITES.membrosPorRede} pessoas.`);
	}
	await ctx.db.insert("membroDaRede", {
		redeId: rede._id,
		usuario,
		nome: validarNomeDoContato(nome) ?? "Sem nome",
		entrouEm: Date.now(),
	});
}

export const minha = query({
	args: {},
	handler: async (ctx) => {
		const participacao = await buscarParticipacao(ctx);
		if (!participacao) {
			return null;
		}
		const { rede, usuario } = participacao;
		const [vinculos, membros] = await Promise.all([
			escolasDaRede(ctx, rede),
			ctx.db
				.query("membroDaRede")
				.withIndex("por_rede", (q) => q.eq("redeId", rede._id))
				.take(LIMITES.membrosPorRede),
		]);
		const { situacao } = simularPrazo(0);
		const linhas = ordenarPorRisco(
			await Promise.all(
				vinculos.map(async ({ codigoInep }) => avaliarEscolaDaRede(await situacaoDaEscola(ctx, codigoInep), situacao)),
			),
		);
		return {
			rede: { nome: rede.nome },
			prazo:
				situacao.tipo === "sem prazo"
					? null
					: { limiteParaUso: situacao.limiteParaUso.getTime(), diasUteis: situacao.diasUteisRestantes },
			resumo: resumirRede(linhas),
			escolas: linhas,
			membros: membros.map(({ _id, nome, usuario: dono }) => ({ _id, nome, souEu: dono === usuario })),
		};
	},
});

export const criar = mutation({
	args: { nome: v.string(), seuNome: v.string() },
	handler: async (ctx, { nome, seuNome }) => {
		const usuario = (await usuarioAtual(ctx)) ?? falhar("Entre com sua conta para criar a rede.");
		const redeId = await ctx.db.insert("rede", { nome: validarNomeDaRede(nome), criadaEm: Date.now() });
		const rede = (await ctx.db.get(redeId)) ?? falhar("Não foi possível criar a rede.");
		await entrarNaRede(ctx, rede, usuario, seuNome);
	},
});

export const adicionarEscolas = mutation({
	args: { texto: v.string() },
	handler: async (ctx, { texto }) => {
		const { rede } = await exigirParticipacao(ctx);
		const { validos, invalidos } = lerCodigosInep(texto.slice(0, LIMITES.escolasPorRede * 20));
		if (validos.length === 0) {
			falhar("Cole os códigos INEP das escolas, com 8 dígitos cada.");
		}
		const atuais = new Set((await escolasDaRede(ctx, rede)).map(({ codigoInep }) => codigoInep));
		const novos = validos.filter((codigoInep) => !atuais.has(codigoInep));
		if (atuais.size + novos.length > LIMITES.escolasPorRede) {
			falhar(`Cada rede acompanha até ${LIMITES.escolasPorRede} escolas. Hoje são ${atuais.size}.`);
		}
		const agora = Date.now();
		await Promise.all(novos.map((codigoInep) => ctx.db.insert("escolaDaRede", { redeId: rede._id, codigoInep, adicionadaEm: agora })));
		return { adicionadas: novos.length, repetidas: validos.length - novos.length, invalidos };
	},
});

export const removerEscola = mutation({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const { rede } = await exigirParticipacao(ctx);
		const vinculo = await ctx.db
			.query("escolaDaRede")
			.withIndex("por_rede_codigo", (q) => q.eq("redeId", rede._id).eq("codigoInep", codigoInep))
			.unique();
		if (vinculo) {
			await ctx.db.delete(vinculo._id);
		}
	},
});

export const criarConvite = mutation({
	args: {},
	handler: async (ctx): Promise<string> => {
		const { rede } = await exigirParticipacao(ctx);
		const agora = Date.now();
		const convites = await ctx.db
			.query("conviteDaRede")
			.withIndex("por_rede", (q) => q.eq("redeId", rede._id))
			.collect();
		const vencidos = convites.filter(({ expiraEm }) => expiraEm <= agora);
		await Promise.all(vencidos.map(({ _id }) => ctx.db.delete(_id)));
		if (convites.length - vencidos.length >= LIMITES.convitesPorRede) {
			falhar(`A rede já tem ${LIMITES.convitesPorRede} convites abertos. Espere alguém aceitar ou um convite vencer.`);
		}
		const codigo = gerarCodigo();
		await ctx.db.insert("conviteDaRede", { redeId: rede._id, codigo, criadoEm: agora, expiraEm: agora + VALIDADE_DO_CONVITE_EM_MS });
		return codigo;
	},
});

async function buscarConvite(ctx: QueryCtx, codigo: string) {
	return FORMATO_DO_CODIGO.test(codigo)
		? ctx.db
				.query("conviteDaRede")
				.withIndex("por_codigo", (q) => q.eq("codigo", codigo))
				.unique()
		: null;
}

export const convite = query({
	args: { codigo: v.string() },
	handler: async (ctx, { codigo }) => {
		const convite = await buscarConvite(ctx, codigo);
		const rede = convite && (await ctx.db.get(convite.redeId));
		return convite && rede ? { nomeDaRede: rede.nome, valido: convite.expiraEm > Date.now() } : null;
	},
});

export const aceitarConvite = mutation({
	args: { codigo: v.string(), nome: v.string() },
	handler: async (ctx, { codigo, nome }) => {
		const usuario = (await usuarioAtual(ctx)) ?? falhar("Entre com sua conta para aceitar o convite.");
		const convite = await buscarConvite(ctx, codigo);
		if (!convite || convite.expiraEm <= Date.now()) {
			falhar("Este convite não vale mais. Peça um novo a quem está na rede.");
		}
		const rede = (await ctx.db.get(convite.redeId)) ?? falhar("A rede deste convite não existe mais.");
		await entrarNaRede(ctx, rede, usuario, nome);
		await ctx.db.delete(convite._id);
	},
});

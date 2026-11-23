import {
	ehCodigoInepValido,
	ehEscolaDeDemonstracao,
	escolaDaPlanilha,
	importarSaldosCsv,
	LIMITES,
	lerSaldoDaEscolaNaPlanilha,
} from "@aloca/dominio";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation, type MutationCtx, type QueryCtx } from "./_generated/server";
import { buscarEscola, salvarEscola } from "./escolas";
import { lerAcesso, tornarMembro, usuarioAtual } from "./lib/acesso";
import { falhar } from "./lib/falha";
import { camposDaEscola, fonteDoDado, pendenciaDoPdde, saldoPorCategoria } from "./schema";
import { registrarUso } from "./usos";

type NovoSaldo = Omit<Doc<"saldo">, "_id" | "_creationTime">;

const TAMANHO_MAXIMO_DO_NOME_DO_ARQUIVO = 80;

function buscarSaldoMaisRecente(ctx: QueryCtx, escolaId: Id<"escola">, exercicio: number) {
	return ctx.db
		.query("saldo")
		.withIndex("por_escola_exercicio_coleta", (q) => q.eq("escolaId", escolaId).eq("exercicio", exercicio))
		.order("desc")
		.first();
}

export function buscarSaldoAtual(ctx: QueryCtx, escolaId: Id<"escola">) {
	return ctx.db
		.query("saldo")
		.withIndex("por_escola_exercicio_coleta", (q) => q.eq("escolaId", escolaId))
		.order("desc")
		.first();
}

async function registrarSaldo(ctx: MutationCtx, novo: NovoSaldo): Promise<Id<"saldo">> {
	const atual = await buscarSaldoMaisRecente(ctx, novo.escolaId, novo.exercicio);
	const mesmoSaldo = atual?.saldo.custeio === novo.saldo.custeio && atual.saldo.capital === novo.saldo.capital;
	if (!atual || !mesmoSaldo) {
		return ctx.db.insert("saldo", novo);
	}
	await ctx.db.patch(atual._id, { fonte: novo.fonte, coletadoEm: novo.coletadoEm, pendencias: novo.pendencias });
	return atual._id;
}

export const coletadoDesde = internalQuery({
	args: { codigoInep: v.string(), desde: v.number() },
	handler: async (ctx, { codigoInep, desde }) => {
		const escola = await buscarEscola(ctx, codigoInep);
		if (!escola) {
			return false;
		}
		const ultimo = await buscarSaldoAtual(ctx, escola._id);
		return ultimo !== null && ultimo.coletadoEm >= desde;
	},
});

export const registrarColeta = internalMutation({
	args: {
		escola: v.object(camposDaEscola),
		exercicio: v.number(),
		saldo: saldoPorCategoria,
		fonte: fonteDoDado,
		coletadoEm: v.number(),
		pendencias: v.optional(v.array(pendenciaDoPdde)),
	},
	handler: async (ctx, { escola, ...registro }) => {
		const escolaId = await salvarEscola(ctx, escola);
		return registrarSaldo(ctx, { escolaId, ...registro });
	},
});

export const importarPlanilha = mutation({
	args: { codigoInep: v.string(), texto: v.string(), nomeDoArquivo: v.string(), nome: v.optional(v.string()) },
	handler: async (ctx, { codigoInep, texto, nomeDoArquivo, nome = "" }) => {
		if (!ehCodigoInepValido(codigoInep)) {
			falhar("O código INEP tem 8 dígitos, só números.");
		}
		if (ehEscolaDeDemonstracao(codigoInep)) {
			falhar("A escola de demonstração já vem com o saldo guardado do PDDE Info. Use Buscar o saldo.");
		}
		const usuario = (await usuarioAtual(ctx)) ?? falhar("Entre com sua conta para importar a planilha.");
		if (texto.length > LIMITES.planilha) {
			falhar("A planilha é grande demais. Deixe só a linha da escola e tente de novo.");
		}
		const arquivo = nomeDoArquivo.replace(/\s+/g, " ").trim().slice(0, TAMANHO_MAXIMO_DO_NOME_DO_ARQUIVO) || "sem nome";
		const leitura = lerSaldoDaEscolaNaPlanilha(texto, codigoInep, { nome: `Planilha ${arquivo}` }, new Date());
		if (!leitura.ok) {
			falhar(leitura.mensagem);
		}
		const existente = await buscarEscola(ctx, codigoInep);
		if (existente) {
			const acesso = await lerAcesso(ctx, existente);
			if (acesso.temResponsavel && !acesso.membro) {
				falhar("Só quem cuida desta escola no Aloca pode importar a planilha. Peça um convite a quem já cuida dela.");
			}
			if (await buscarSaldoAtual(ctx, existente._id)) {
				falhar("Esta escola já tem saldo no Aloca. Para conferir o valor, use Atualizar saldo no Início.");
			}
		}
		await registrarUso(ctx, "planilha");
		const { registro } = leitura;
		const escolaId = existente?._id ?? (await salvarEscola(ctx, escolaDaPlanilha(registro)));
		const escola = (await ctx.db.get(escolaId)) ?? falhar("Não foi possível salvar a escola.");
		await tornarMembro(ctx, escola, usuario, nome);
		await registrarSaldo(ctx, {
			escolaId,
			exercicio: registro.exercicio,
			saldo: registro.saldo,
			fonte: registro.fonte,
			coletadoEm: registro.coletadoEm.getTime(),
		});
		return { exercicio: registro.exercicio, saldo: registro.saldo };
	},
});

export const importarCsv = internalMutation({
	args: { texto: v.string(), nomeDoArquivo: v.string() },
	handler: async (ctx, { texto, nomeDoArquivo }) => {
		const { registros, erros } = importarSaldosCsv(texto, { nome: `Planilha ${nomeDoArquivo}` }, new Date());
		const escolasNaoCadastradas: string[] = [];
		let importados = 0;
		for (const { codigoInep, exercicio, saldo, fonte, coletadoEm } of registros) {
			const escola = await buscarEscola(ctx, codigoInep);
			if (!escola) {
				escolasNaoCadastradas.push(codigoInep);
				continue;
			}
			await registrarSaldo(ctx, { escolaId: escola._id, exercicio, saldo, fonte, coletadoEm: coletadoEm.getTime() });
			importados += 1;
		}
		return { importados, erros, escolasNaoCadastradas };
	},
});

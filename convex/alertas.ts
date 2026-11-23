import {
	avaliarRisco,
	type DadosDoAlerta,
	ehEscolaDeDemonstracao,
	exercicioEmCurso,
	type NivelDeRisco,
	preencherTemplate,
	type SituacaoDoPrazo,
	simularPrazo,
	situacaoDoPrazo,
	TEMPLATE_DO_SMS,
	variaveisDoSms,
} from "@aloca/dominio";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, type ActionCtx, internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { buscarEscola } from "./escolas";
import { falhar, mensagemDoErro } from "./lib/falha";
import { type ConfiguracaoDaNvoip, enviarAlertaPelaNvoip, lerConfiguracaoDaNvoip } from "./lib/nvoip";
import { buscarPlano, calcularPlano } from "./lib/plano";
import { buscarSaldoAtual } from "./saldos";
import { canalDoAlerta, nivelDeRisco } from "./schema";

const MINUTO_EM_MS = 60_000;
const INTERVALO_DO_ENVIO_MANUAL_EM_MS = 10 * MINUTO_EM_MS;
const INTERVALO_DO_ENVIO_AUTOMATICO_EM_MS = 7 * 24 * 60 * MINUTO_EM_MS;
const NIVEIS_QUE_ALERTAM: NivelDeRisco[] = ["atenção", "urgente"];
const ALERTAS_NO_HISTORICO = 10;
const ENVIOS_MANUAIS_POR_HORA = 30;

type DadosParaEnvio = {
	escolaId: Id<"escola">;
	nomeDaEscola: string;
	contatos: { celular: string }[];
	ultimoAlertaEm: number | null;
	saldoEmRiscoEmCentavos: number;
};

type Envio = { enviados: number; falhas: number };

export const historico = query({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const escola = await buscarEscola(ctx, codigoInep);
		if (!escola) {
			return [];
		}
		const alertas = await ctx.db
			.query("alerta")
			.withIndex("por_escola_criacao", (q) => q.eq("escolaId", escola._id))
			.order("desc")
			.take(ALERTAS_NO_HISTORICO);
		return alertas.map(({ _id, mensagem, canal, erro, criadoEm, enviadoEm }) => ({
			_id,
			mensagem,
			canal: canal ?? null,
			erro: erro ?? null,
			criadoEm,
			enviadoEm: enviadoEm ?? null,
		}));
	},
});

export const dadosParaEnvio = internalQuery({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }): Promise<DadosParaEnvio | null> => {
		const escola = await buscarEscola(ctx, codigoInep);
		const saldo = escola && (await buscarSaldoAtual(ctx, escola._id));
		if (!escola || !saldo) {
			return null;
		}
		const [contatos, ultimo, plano] = await Promise.all([
			ctx.db
				.query("contato")
				.withIndex("por_escola_papel", (q) => q.eq("escolaId", escola._id))
				.collect(),
			ctx.db
				.query("alerta")
				.withIndex("por_escola_criacao", (q) => q.eq("escolaId", escola._id))
				.order("desc")
				.first(),
			buscarPlano(ctx, escola._id),
		]);
		const saldoTotal = saldo.saldo.custeio + saldo.saldo.capital;
		const noPlano = plano?.status === "aprovado" ? await calcularPlano(ctx, plano._id, saldo.saldo) : null;
		const totalNoPlano = noPlano ? noPlano.totalPorCategoria.custeio + noPlano.totalPorCategoria.capital : 0;
		return {
			escolaId: escola._id,
			nomeDaEscola: escola.nome,
			contatos: contatos.map(({ celular }) => ({ celular })),
			ultimoAlertaEm: ultimo?.criadoEm ?? null,
			saldoEmRiscoEmCentavos: saldoTotal - totalNoPlano,
		};
	},
});

export const enviadosDesde = internalQuery({
	args: { desde: v.number() },
	handler: async (ctx, { desde }) => {
		const recentes = await ctx.db
			.query("alerta")
			.withIndex("por_envio", (q) => q.gt("enviadoEm", desde))
			.take(ENVIOS_MANUAIS_POR_HORA);
		return recentes.length;
	},
});

export const escolasComContato = internalQuery({
	args: {},
	handler: async (ctx) => {
		const contatos = await ctx.db.query("contato").collect();
		const escolas = await Promise.all([...new Set(contatos.map(({ escolaId }) => escolaId))].map((escolaId) => ctx.db.get(escolaId)));
		return escolas.flatMap((escola) => (escola && !ehEscolaDeDemonstracao(escola.codigoInep) ? [escola.codigoInep] : []));
	},
});

export const registrar = internalMutation({
	args: {
		escolaId: v.id("escola"),
		exercicio: v.number(),
		nivel: nivelDeRisco,
		mensagem: v.string(),
		canal: v.optional(canalDoAlerta),
		erro: v.optional(v.string()),
	},
	handler: async (ctx, alerta) => {
		const agora = Date.now();
		await ctx.db.insert("alerta", { ...alerta, criadoEm: agora, ...(alerta.canal ? { enviadoEm: agora } : {}) });
	},
});

async function enviarParaContatos(
	ctx: ActionCtx,
	configuracao: ConfiguracaoDaNvoip,
	dados: DadosParaEnvio,
	situacao: Exclude<SituacaoDoPrazo, { tipo: "sem prazo" }>,
	nivel: NivelDeRisco,
): Promise<Envio> {
	const alerta: DadosDoAlerta = {
		nomeDaEscola: dados.nomeDaEscola,
		diasUteisRestantes: situacao.diasUteisRestantes,
		saldoEmRiscoEmCentavos: dados.saldoEmRiscoEmCentavos,
		limiteParaUso: situacao.limiteParaUso,
	};
	const mensagem = preencherTemplate(TEMPLATE_DO_SMS, variaveisDoSms(alerta));
	const resultados = await Promise.all(
		dados.contatos.map(async ({ celular }) => {
			const base = { escolaId: dados.escolaId, exercicio: situacao.exercicio, nivel, mensagem };
			try {
				const canal = await enviarAlertaPelaNvoip(configuracao, celular, alerta);
				await ctx.runMutation(internal.alertas.registrar, { ...base, canal });
				return true;
			} catch (erro) {
				await ctx.runMutation(internal.alertas.registrar, { ...base, erro: mensagemDoErro(erro) });
				return false;
			}
		}),
	);
	const enviados = resultados.filter(Boolean).length;
	return { enviados, falhas: resultados.length - enviados };
}

export const enviarAgora = action({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }): Promise<Envio> => {
		if (ehEscolaDeDemonstracao(codigoInep)) {
			falhar("A escola de demonstração não envia alertas.");
		}
		const configuracao = lerConfiguracaoDaNvoip() ?? falhar("O envio pela Nvoip ainda não está configurado no Convex.");
		const dados =
			(await ctx.runQuery(internal.alertas.dadosParaEnvio, { codigoInep })) ??
			falhar("Busque o saldo da escola antes de enviar alertas.");
		if (dados.contatos.length === 0) {
			falhar("Cadastre ao menos um celular para receber o alerta.");
		}
		if (dados.ultimoAlertaEm && Date.now() - dados.ultimoAlertaEm < INTERVALO_DO_ENVIO_MANUAL_EM_MS) {
			falhar("Um alerta acabou de ser enviado. Espere 10 minutos para mandar outro.");
		}
		const enviadosNaUltimaHora: number = await ctx.runQuery(internal.alertas.enviadosDesde, { desde: Date.now() - 60 * MINUTO_EM_MS });
		if (enviadosNaUltimaHora >= ENVIOS_MANUAIS_POR_HORA) {
			falhar("O limite de alertas da última hora foi atingido. Tente de novo mais tarde.");
		}
		const { situacao, risco } = simularPrazo(dados.saldoEmRiscoEmCentavos);
		if (situacao.tipo !== "correndo") {
			falhar("Não há prazo correndo para avisar.");
		}
		return enviarParaContatos(ctx, configuracao, dados, situacao, risco.nivel);
	},
});

export const enviarDoDia = internalAction({
	args: {},
	handler: async (ctx): Promise<Envio> => {
		const configuracao = lerConfiguracaoDaNvoip();
		if (!configuracao) {
			return { enviados: 0, falhas: 0 };
		}
		const hoje = new Date();
		const situacao = situacaoDoPrazo(exercicioEmCurso(hoje), hoje);
		if (situacao.tipo !== "correndo") {
			return { enviados: 0, falhas: 0 };
		}
		const total: Envio = { enviados: 0, falhas: 0 };
		for (const codigoInep of await ctx.runQuery(internal.alertas.escolasComContato, {})) {
			const dados = await ctx.runQuery(internal.alertas.dadosParaEnvio, { codigoInep });
			if (!dados || (dados.ultimoAlertaEm && hoje.getTime() - dados.ultimoAlertaEm < INTERVALO_DO_ENVIO_AUTOMATICO_EM_MS)) {
				continue;
			}
			const { nivel } = avaliarRisco(dados.saldoEmRiscoEmCentavos, situacao);
			if (NIVEIS_QUE_ALERTAM.includes(nivel)) {
				const envio = await enviarParaContatos(ctx, configuracao, dados, situacao, nivel);
				total.enviados += envio.enviados;
				total.falhas += envio.falhas;
			}
		}
		return total;
	},
});

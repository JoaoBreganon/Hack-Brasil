import {
	avaliarRisco,
	type CanalDoAlerta,
	type DadosDoAlerta,
	ehEscolaDeDemonstracao,
	exercicioEmCurso,
	montarEmailDoAlerta,
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
import { exigirEdicao, lerAcesso } from "./lib/acesso";
import { falhar, mensagemDoErro } from "./lib/falha";
import { type ConfiguracaoDaNvoip, enviarAlertaPelaNvoip, lerConfiguracaoDaNvoip } from "./lib/nvoip";
import { buscarPlano, calcularPlano } from "./lib/plano";
import { type ConfiguracaoDoResend, enviarEmailPeloResend, lerConfiguracaoDoResend } from "./lib/resend";
import { buscarSaldoAtual } from "./saldos";
import { canalDoAlerta, nivelDeRisco } from "./schema";
import { registrarUso } from "./usos";

const MINUTO_EM_MS = 60_000;
const INTERVALO_DO_ENVIO_MANUAL_EM_MS = 10 * MINUTO_EM_MS;
const INTERVALO_DO_ENVIO_AUTOMATICO_EM_MS = 7 * 24 * 60 * MINUTO_EM_MS;
const NIVEIS_QUE_ALERTAM: NivelDeRisco[] = ["atenção", "urgente"];
const ALERTAS_NO_HISTORICO = 10;

type DadosParaEnvio = {
	escolaId: Id<"escola">;
	codigoInep: string;
	nomeDaEscola: string;
	contatos: { celular: string | null; email: string | null }[];
	ultimoAlertaEm: number | null;
	saldoEmRiscoEmCentavos: number;
};

type Envio = { enviados: number; falhas: number };

type EnvioPreparado = { mensagem: string; enviar: () => Promise<CanalDoAlerta> };

type Canais = {
	nvoip: ConfiguracaoDaNvoip | null;
	resend: ConfiguracaoDoResend | null;
};

function lerCanais(): Canais | null {
	const canais = { nvoip: lerConfiguracaoDaNvoip(), resend: lerConfiguracaoDoResend() };
	return canais.nvoip || canais.resend ? canais : null;
}

function enderecoDoPlano(codigoInep: string): string | undefined {
	const site = process.env.SITE_URL?.replace(/\/+$/, "");
	return site ? `${site}/escola/${codigoInep}/plano` : undefined;
}

function prepararEnvios(canais: Canais, dados: DadosParaEnvio, alerta: DadosDoAlerta): EnvioPreparado[] {
	const { nvoip, resend } = canais;
	const sms = preencherTemplate(TEMPLATE_DO_SMS, variaveisDoSms(alerta));
	const email = montarEmailDoAlerta(alerta, enderecoDoPlano(dados.codigoInep));
	return dados.contatos.flatMap(({ celular, email: endereco }) => [
		...(nvoip && celular ? [{ mensagem: sms, enviar: () => enviarAlertaPelaNvoip(nvoip, celular, alerta) }] : []),
		...(resend && endereco
			? [{ mensagem: email.assunto, enviar: () => enviarEmailPeloResend(resend, endereco, email).then(() => "email" as const) }]
			: []),
	]);
}

function dadosDoAlerta(dados: DadosParaEnvio, situacao: Exclude<SituacaoDoPrazo, { tipo: "sem prazo" }>): DadosDoAlerta {
	return {
		nomeDaEscola: dados.nomeDaEscola,
		diasUteisRestantes: situacao.diasUteisRestantes,
		saldoEmRiscoEmCentavos: dados.saldoEmRiscoEmCentavos,
		limiteParaUso: situacao.limiteParaUso,
	};
}

export const historico = query({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const escola = await buscarEscola(ctx, codigoInep);
		if (!escola || !(await lerAcesso(ctx, escola)).membro) {
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
			codigoInep: escola.codigoInep,
			nomeDaEscola: escola.nome,
			contatos: contatos.map(({ celular, email }) => ({ celular: celular ?? null, email: email ?? null })),
			ultimoAlertaEm: ultimo?.criadoEm ?? null,
			saldoEmRiscoEmCentavos: saldoTotal - totalNoPlano,
		};
	},
});

export const reservarEnvioManual = internalMutation({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const escola = (await buscarEscola(ctx, codigoInep)) ?? falhar("Busque o saldo da escola antes de enviar alertas.");
		await exigirEdicao(ctx, escola);
		const ultimo = await ctx.db
			.query("alerta")
			.withIndex("por_escola_criacao", (q) => q.eq("escolaId", escola._id))
			.order("desc")
			.first();
		const agora = Date.now();
		if (agora - Math.max(ultimo?.criadoEm ?? 0, escola.envioManualEm ?? 0) < INTERVALO_DO_ENVIO_MANUAL_EM_MS) {
			falhar("Um alerta acabou de ser enviado. Espere 10 minutos para mandar outro.");
		}
		await registrarUso(ctx, "alerta manual");
		await ctx.db.patch(escola._id, { envioManualEm: agora });
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

async function enviarAlertas(
	ctx: ActionCtx,
	envios: EnvioPreparado[],
	base: { escolaId: Id<"escola">; exercicio: number; nivel: NivelDeRisco },
): Promise<Envio> {
	const resultados = await Promise.all(
		envios.map(async ({ mensagem, enviar }) => {
			try {
				const canal = await enviar();
				await ctx.runMutation(internal.alertas.registrar, { ...base, mensagem, canal });
				return true;
			} catch (erro) {
				await ctx.runMutation(internal.alertas.registrar, { ...base, mensagem, erro: mensagemDoErro(erro) });
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
		await ctx.runQuery(internal.acessos.exigirEdicaoDaEscola, { codigoInep });
		const canais = lerCanais() ?? falhar("O envio de alertas ainda não está configurado no Convex (Nvoip ou Resend).");
		const dados =
			(await ctx.runQuery(internal.alertas.dadosParaEnvio, { codigoInep })) ??
			falhar("Busque o saldo da escola antes de enviar alertas.");
		if (dados.contatos.length === 0) {
			falhar("Cadastre ao menos um celular ou e-mail para receber o alerta.");
		}
		const { situacao, risco } = simularPrazo(dados.saldoEmRiscoEmCentavos);
		if (situacao.tipo !== "correndo") {
			falhar("Não há prazo correndo para avisar.");
		}
		const envios = prepararEnvios(canais, dados, dadosDoAlerta(dados, situacao));
		if (envios.length === 0) {
			falhar(canais.nvoip ? "Cadastre um celular para receber o alerta." : "Cadastre um e-mail para receber o alerta.");
		}
		await ctx.runMutation(internal.alertas.reservarEnvioManual, { codigoInep });
		return enviarAlertas(ctx, envios, { escolaId: dados.escolaId, exercicio: situacao.exercicio, nivel: risco.nivel });
	},
});

export const enviarDoDia = internalAction({
	args: {},
	handler: async (ctx): Promise<Envio> => {
		const canais = lerCanais();
		if (!canais) {
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
				const envios = prepararEnvios(canais, dados, dadosDoAlerta(dados, situacao));
				const envio = await enviarAlertas(ctx, envios, { escolaId: dados.escolaId, exercicio: situacao.exercicio, nivel });
				total.enviados += envio.enviados;
				total.falhas += envio.falhas;
			}
		}
		return total;
	},
});

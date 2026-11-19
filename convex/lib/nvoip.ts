import {
	type CanalDoAlerta,
	type DadosDoAlerta,
	preencherTemplate,
	TEMPLATE_DO_SMS,
	variaveisDoSms,
	variaveisDoWhatsapp,
} from "@aloca/dominio";
import { buscarComTempoLimite } from "./requisicao";

const ENDERECO_DA_API = "https://api.nvoip.com.br/v2";
const TEMPO_LIMITE_EM_MS = 20_000;
const IDIOMA_DO_TEMPLATE = "pt_BR";
const CODIGO_DO_PAIS = "55";

export type ConfiguracaoDaNvoip = {
	numbersip: string;
	tokenDoUsuario: string;
	clienteId: string;
	clienteSegredo: string;
	instanciaDoWhatsapp?: string;
	templateDoWhatsapp?: string;
};

export function lerConfiguracaoDaNvoip(): ConfiguracaoDaNvoip | null {
	const { NVOIP_NUMBERSIP, NVOIP_USER_TOKEN, NVOIP_CLIENT_ID, NVOIP_CLIENT_SECRET, NVOIP_WHATSAPP_INSTANCE, NVOIP_WHATSAPP_TEMPLATE } =
		process.env;
	if (!NVOIP_NUMBERSIP || !NVOIP_USER_TOKEN || !NVOIP_CLIENT_ID || !NVOIP_CLIENT_SECRET) {
		return null;
	}
	return {
		numbersip: NVOIP_NUMBERSIP,
		tokenDoUsuario: NVOIP_USER_TOKEN,
		clienteId: NVOIP_CLIENT_ID,
		clienteSegredo: NVOIP_CLIENT_SECRET,
		instanciaDoWhatsapp: NVOIP_WHATSAPP_INSTANCE,
		templateDoWhatsapp: NVOIP_WHATSAPP_TEMPLATE,
	};
}

async function chamar(caminho: string, opcoes: RequestInit): Promise<unknown> {
	const resposta = await buscarComTempoLimite(`${ENDERECO_DA_API}${caminho}`, opcoes, TEMPO_LIMITE_EM_MS);
	if (!resposta.ok) {
		throw new Error(`a Nvoip respondeu ${resposta.status} em ${caminho}`);
	}
	return resposta.json();
}

async function obterToken(configuracao: ConfiguracaoDaNvoip): Promise<string> {
	const corpo = await chamar("/oauth/token", {
		method: "POST",
		headers: {
			Authorization: `Basic ${btoa(`${configuracao.clienteId}:${configuracao.clienteSegredo}`)}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			username: configuracao.numbersip,
			password: configuracao.tokenDoUsuario,
			grant_type: "password",
		}).toString(),
	});
	const token = (corpo as { access_token?: unknown }).access_token;
	if (typeof token !== "string") {
		throw new Error("a Nvoip não devolveu o token de acesso");
	}
	return token;
}

function enviarJson(caminho: string, token: string, corpo: object) {
	return chamar(caminho, {
		method: "POST",
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		body: JSON.stringify(corpo),
	});
}

function enviarWhatsapp(configuracao: ConfiguracaoDaNvoip, token: string, celular: string, dados: DadosDoAlerta): Promise<boolean> {
	const { instanciaDoWhatsapp, templateDoWhatsapp } = configuracao;
	if (!instanciaDoWhatsapp || !templateDoWhatsapp) {
		return Promise.resolve(false);
	}
	return enviarJson("/wa/sendTemplates", token, {
		idTemplate: templateDoWhatsapp,
		instance: instanciaDoWhatsapp,
		language: IDIOMA_DO_TEMPLATE,
		destination: celular,
		bodyVariables: variaveisDoWhatsapp(dados),
	}).then(
		() => true,
		() => false,
	);
}

export async function enviarAlertaPelaNvoip(
	configuracao: ConfiguracaoDaNvoip,
	celular: string,
	dados: DadosDoAlerta,
): Promise<CanalDoAlerta> {
	const token = await obterToken(configuracao);
	if (await enviarWhatsapp(configuracao, token, celular, dados)) {
		return "whatsapp";
	}
	await enviarJson("/sms", token, {
		numberPhone: celular.slice(CODIGO_DO_PAIS.length),
		message: preencherTemplate(TEMPLATE_DO_SMS, variaveisDoSms(dados)),
		flashSms: false,
	});
	return "sms";
}

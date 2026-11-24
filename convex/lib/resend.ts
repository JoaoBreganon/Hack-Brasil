import type { EmailDoAlerta } from "@aloca/dominio";
import { buscarComTempoLimite } from "./requisicao";

const ENDERECO_DA_API = "https://api.resend.com/emails";
const TEMPO_LIMITE_EM_MS = 20_000;

export type ConfiguracaoDoResend = {
	chave: string;
	remetente: string;
};

export function lerConfiguracaoDoResend(): ConfiguracaoDoResend | null {
	const { RESEND_API_KEY, RESEND_FROM } = process.env;
	return RESEND_API_KEY && RESEND_FROM ? { chave: RESEND_API_KEY, remetente: RESEND_FROM } : null;
}

export async function enviarEmailPeloResend(configuracao: ConfiguracaoDoResend, para: string, email: EmailDoAlerta): Promise<void> {
	const resposta = await buscarComTempoLimite(
		ENDERECO_DA_API,
		{
			method: "POST",
			headers: { Authorization: `Bearer ${configuracao.chave}`, "Content-Type": "application/json" },
			body: JSON.stringify({ from: configuracao.remetente, to: [para], subject: email.assunto, html: email.html, text: email.texto }),
		},
		TEMPO_LIMITE_EM_MS,
	);
	if (!resposta.ok) {
		throw new Error(`o Resend respondeu ${resposta.status}`);
	}
}

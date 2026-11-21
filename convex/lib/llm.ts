import {
	type ContextoDaSugestao,
	type EntradaDaNecessidade,
	ESQUEMA_DA_SUGESTAO,
	INSTRUCAO_DA_SUGESTAO,
	lerSugestoes,
	mensagemDaSugestao,
	NOME_DO_ESQUEMA_DA_SUGESTAO,
} from "@aloca/dominio";
import { buscarComTempoLimite } from "./requisicao";

const ENDERECO_PADRAO = "https://api.openai.com/v1";
const MODELO_PADRAO = "gpt-4o-mini";
const TEMPO_LIMITE_EM_MS = 60_000;

export type ConfiguracaoDoLlm = {
	chave: string;
	endereco: string;
	modelo: string;
};

type RespostaDoLlm = {
	choices?: { message?: { content?: unknown; refusal?: unknown } }[];
};

export function lerConfiguracaoDoLlm(): ConfiguracaoDoLlm | null {
	const { LLM_API_KEY, LLM_BASE_URL, LLM_MODEL } = process.env;
	if (!LLM_API_KEY) {
		return null;
	}
	return {
		chave: LLM_API_KEY,
		endereco: (LLM_BASE_URL || ENDERECO_PADRAO).replace(/\/+$/, ""),
		modelo: LLM_MODEL || MODELO_PADRAO,
	};
}

function lerJson(texto: string): unknown {
	try {
		return JSON.parse(texto);
	} catch {
		throw new Error("a resposta da IA não é um JSON válido");
	}
}

export async function sugerirItensComLlm(configuracao: ConfiguracaoDoLlm, contexto: ContextoDaSugestao): Promise<EntradaDaNecessidade[]> {
	const resposta = await buscarComTempoLimite(
		`${configuracao.endereco}/chat/completions`,
		{
			method: "POST",
			headers: { Authorization: `Bearer ${configuracao.chave}`, "Content-Type": "application/json" },
			body: JSON.stringify({
				model: configuracao.modelo,
				messages: [
					{ role: "system", content: INSTRUCAO_DA_SUGESTAO },
					{ role: "user", content: mensagemDaSugestao(contexto) },
				],
				response_format: {
					type: "json_schema",
					json_schema: { name: NOME_DO_ESQUEMA_DA_SUGESTAO, strict: true, schema: ESQUEMA_DA_SUGESTAO },
				},
			}),
		},
		TEMPO_LIMITE_EM_MS,
	);
	if (!resposta.ok) {
		throw new Error(`a IA respondeu ${resposta.status}`);
	}
	const mensagem = ((await resposta.json()) as RespostaDoLlm).choices?.[0]?.message;
	if (typeof mensagem?.refusal === "string" && mensagem.refusal) {
		throw new Error("a IA recusou o pedido");
	}
	if (typeof mensagem?.content !== "string") {
		throw new Error("a IA não devolveu os itens");
	}
	return lerSugestoes(lerJson(mensagem.content));
}

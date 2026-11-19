import { consultaDePreco, ESQUEMA_DO_PRECO, INSTRUCAO_DO_PRECO, type ResultadoDaBusca } from "@aloca/dominio";
import { buscarComTempoLimite } from "./requisicao";

const ENDERECO_DA_BUSCA = "https://api.firecrawl.dev/v2/search";
const RESULTADOS_POR_BUSCA = 8;
const TEMPO_LIMITE_EM_MS = 120_000;

function ehResultado(valor: unknown): valor is ResultadoDaBusca {
	return typeof valor === "object" && valor !== null && typeof (valor as { url?: unknown }).url === "string";
}

export async function buscarPrecosNaWeb(chave: string, descricao: string): Promise<ResultadoDaBusca[]> {
	const resposta = await buscarComTempoLimite(
		ENDERECO_DA_BUSCA,
		{
			method: "POST",
			headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
			body: JSON.stringify({
				query: consultaDePreco(descricao),
				limit: RESULTADOS_POR_BUSCA,
				sources: [{ type: "web" }],
				country: "BR",
				location: "Brazil",
				scrapeOptions: {
					formats: [{ type: "json", prompt: INSTRUCAO_DO_PRECO, schema: ESQUEMA_DO_PRECO }],
					onlyMainContent: true,
				},
			}),
		},
		TEMPO_LIMITE_EM_MS,
	);
	if (!resposta.ok) {
		throw new Error(`o Firecrawl respondeu ${resposta.status}`);
	}
	const corpo = (await resposta.json()) as { data?: { web?: unknown[] } };
	return (corpo.data?.web ?? []).filter(ehResultado).map(({ url, json }) => ({ url, json }));
}

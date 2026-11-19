export async function buscarComTempoLimite(endereco: string, opcoes: RequestInit, tempoLimiteEmMs: number): Promise<Response> {
	const controle = new AbortController();
	const espera = setTimeout(() => controle.abort(), tempoLimiteEmMs);
	try {
		return await fetch(endereco, { ...opcoes, signal: controle.signal });
	} catch (erro) {
		throw new Error(
			controle.signal.aborted ? `sem resposta em ${tempoLimiteEmMs / 1000} s` : erro instanceof Error ? erro.message : String(erro),
		);
	} finally {
		clearTimeout(espera);
	}
}

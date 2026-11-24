export const VALIDADE_DO_CONVITE_EM_MS = 7 * 24 * 60 * 60_000;
export const FORMATO_DO_CODIGO = /^[0-9a-f]{32}$/;

export function gerarCodigo(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const LOGIN_CONFIGURADO = Boolean(process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI);
export const LOGIN_NO_SERVIDOR = Boolean(
	LOGIN_CONFIGURADO && process.env.WORKOS_API_KEY && process.env.WORKOS_CLIENT_ID && process.env.WORKOS_COOKIE_PASSWORD,
);

export function caminhoDeVolta(texto: string | null | undefined): string {
	if (!texto || !texto.startsWith("/") || texto.startsWith("//") || /[\u0000-\u001f\u007f\\]/.test(texto)) {
		return "/entrar";
	}
	try {
		const url = new URL(texto, "http://aloca.local");
		return url.origin === "http://aloca.local" && url.pathname.startsWith("/") ? `${url.pathname}${url.search}${url.hash}` : "/entrar";
	} catch {
		return "/entrar";
	}
}

export function enderecoDeEntrada(voltar: string): string {
	return `/conta/entrar?${new URLSearchParams({ voltar }).toString()}`;
}

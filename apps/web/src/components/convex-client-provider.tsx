"use client";

import { AuthKitProvider, useAccessToken, useAuth } from "@workos-inc/authkit-nextjs/components";
import { ConvexProvider, ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { type ReactNode, useCallback, useMemo } from "react";
import { type Conta, ContextoDaConta } from "@/hooks/use-conta";
import { LOGIN_CONFIGURADO } from "@/lib/conta";

const ENDERECO_DO_CONVEX = process.env.NEXT_PUBLIC_CONVEX_URL;
const CLIENTE = ENDERECO_DO_CONVEX ? new ConvexReactClient(ENDERECO_DO_CONVEX) : null;

type Usuario = NonNullable<ReturnType<typeof useAuth>["user"]>;

function nomeDoUsuario({ firstName, lastName, email }: Usuario): string {
	return [firstName, lastName].filter(Boolean).join(" ") || email;
}

function useAutenticacaoDoAuthKit() {
	const { user, loading } = useAuth();
	const { getAccessToken, refresh } = useAccessToken();
	const fetchAccessToken = useCallback(
		async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
			if (!user) {
				return null;
			}
			try {
				return (await (forceRefreshToken ? refresh() : getAccessToken())) ?? null;
			} catch {
				return null;
			}
		},
		[user, refresh, getAccessToken],
	);
	return useMemo(() => ({ isLoading: loading, isAuthenticated: Boolean(user), fetchAccessToken }), [loading, user, fetchAccessToken]);
}

function ContaDoAuthKit({ cliente, children }: { cliente: ConvexReactClient; children: ReactNode }) {
	const { user, loading } = useAuth();
	const conta = useMemo<Conta>(
		() => ({ configurada: true, carregando: loading, usuario: user ? { nome: nomeDoUsuario(user) } : null }),
		[loading, user],
	);
	return (
		<ContextoDaConta value={conta}>
			<ConvexProviderWithAuth client={cliente} useAuth={useAutenticacaoDoAuthKit}>
				{children}
			</ConvexProviderWithAuth>
		</ContextoDaConta>
	);
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
	if (!CLIENTE) {
		return children;
	}
	if (!LOGIN_CONFIGURADO) {
		return <ConvexProvider client={CLIENTE}>{children}</ConvexProvider>;
	}
	return (
		<AuthKitProvider>
			<ContaDoAuthKit cliente={CLIENTE}>{children}</ContaDoAuthKit>
		</AuthKitProvider>
	);
}

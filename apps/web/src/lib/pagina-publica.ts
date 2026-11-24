import { ehCodigoInepValido } from "@aloca/dominio";
import { api } from "@convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import type { FunctionReturnType } from "convex/server";
import { cacheLife } from "next/cache";

const CONVEX_CONFIGURADO = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export type PaginaPublica = NonNullable<FunctionReturnType<typeof api.transparencia.daEscola>>;

export async function lerPaginaPublica(codigoInep: string): Promise<PaginaPublica | null> {
	"use cache";
	cacheLife("minutes");
	if (!CONVEX_CONFIGURADO || !ehCodigoInepValido(codigoInep)) {
		return null;
	}
	return fetchQuery(api.transparencia.daEscola, { codigoInep });
}

export async function escolasPublicadas(): Promise<FunctionReturnType<typeof api.transparencia.publicadas>> {
	"use cache";
	cacheLife("hours");
	return CONVEX_CONFIGURADO ? fetchQuery(api.transparencia.publicadas, {}) : [];
}

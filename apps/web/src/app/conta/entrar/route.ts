import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { caminhoDeVolta, LOGIN_NO_SERVIDOR } from "@/lib/conta";

export async function GET(requisicao: NextRequest) {
	const voltar = caminhoDeVolta(requisicao.nextUrl.searchParams.get("voltar"));
	redirect(LOGIN_NO_SERVIDOR ? await getSignInUrl({ returnTo: voltar }) : voltar);
}

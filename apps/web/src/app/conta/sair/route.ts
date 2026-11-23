import { signOut } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { LOGIN_NO_SERVIDOR } from "@/lib/conta";

export async function POST(requisicao: NextRequest) {
	if (!LOGIN_NO_SERVIDOR) {
		redirect("/entrar");
	}
	await signOut({ returnTo: new URL("/entrar", requisicao.nextUrl.origin).toString() });
}

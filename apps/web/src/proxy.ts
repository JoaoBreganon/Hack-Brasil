import { authkit, handleAuthkitHeaders } from "@workos-inc/authkit-nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { LOGIN_NO_SERVIDOR } from "@/lib/conta";

export default async function proxy(requisicao: NextRequest) {
	if (!LOGIN_NO_SERVIDOR) {
		return NextResponse.next();
	}
	const { headers } = await authkit(requisicao);
	return handleAuthkitHeaders(requisicao, headers);
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?|txt|xml|webmanifest)$).*)"],
};

import { handleAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { LOGIN_NO_SERVIDOR } from "@/lib/conta";

const retornoDoAuthKit = handleAuth({ returnPathname: "/entrar" });

export async function GET(requisicao: NextRequest) {
	if (!LOGIN_NO_SERVIDOR) {
		redirect("/entrar");
	}
	return retornoDoAuthKit(requisicao);
}

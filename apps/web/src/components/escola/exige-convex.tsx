import { connection } from "next/server";
import { type ReactNode, Suspense } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CONVEX_CONFIGURADO = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

async function RenderizarAPedido() {
	await connection();
	return null;
}

export function ExigeConvex({ children }: { children: ReactNode }) {
	if (CONVEX_CONFIGURADO) {
		return children;
	}
	return (
		<main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-20">
			<Suspense>
				<RenderizarAPedido />
			</Suspense>
			<Alert>
				<AlertTitle>O banco de dados não está ligado neste ambiente</AlertTitle>
				<AlertDescription>
					Defina NEXT_PUBLIC_CONVEX_URL no arquivo .env.local da raiz e rode pnpm convex:dev para usar as telas da escola.
				</AlertDescription>
			</Alert>
		</main>
	);
}

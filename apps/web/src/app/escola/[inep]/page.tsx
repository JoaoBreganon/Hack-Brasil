import type { Metadata } from "next";
import { TelaDoPainel } from "@/components/painel/tela-do-painel";

export const metadata: Metadata = {
	title: "Saldo e prazo",
	description: "Saldo do PDDE, dias úteis até o prazo de uso e pendências da escola no PDDE Info.",
};

export default function PaginaDoPainel() {
	return <TelaDoPainel />;
}

import type { Metadata } from "next";
import { TelaDeInicio } from "@/components/inicio/tela-de-inicio";

export const metadata: Metadata = {
	title: "Início",
	description: "Saldo do PDDE da escola, dias úteis até o prazo de uso e o próximo passo para não perder o dinheiro.",
};

export default function PaginaDeInicio() {
	return <TelaDeInicio />;
}

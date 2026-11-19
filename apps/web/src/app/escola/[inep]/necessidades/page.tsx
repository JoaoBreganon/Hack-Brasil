import type { Metadata } from "next";
import { TelaDeNecessidades } from "@/components/necessidades/tela-de-necessidades";

export const metadata: Metadata = {
	title: "O que comprar",
	description: "Lista do que a escola precisa comprar com o saldo do PDDE, com tipo de despesa e prioridade.",
};

export default function PaginaDeNecessidades() {
	return <TelaDeNecessidades />;
}

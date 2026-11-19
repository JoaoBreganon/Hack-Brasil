import type { Metadata } from "next";
import { TelaDeOrcamentos } from "@/components/orcamentos/tela-de-orcamentos";

export const metadata: Metadata = {
	title: "Orçamentos",
	description: "Três orçamentos por item, buscados na internet ou anotados à mão, com o menor preço destacado.",
};

export default function PaginaDeOrcamentos() {
	return <TelaDeOrcamentos />;
}

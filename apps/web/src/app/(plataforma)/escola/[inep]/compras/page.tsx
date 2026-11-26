import type { Metadata } from "next";
import { TelaDeCompras } from "@/components/compras/tela-de-compras";

export const metadata: Metadata = {
	title: "Compras",
	description: "O que a escola precisa comprar com o PDDE e os orçamentos de cada item, com o menor preço destacado.",
};

export default function PaginaDeCompras() {
	return <TelaDeCompras />;
}

import type { Metadata } from "next";
import { TelaDaAta } from "@/components/ata/tela-da-ata";

export const metadata: Metadata = {
	title: "Ata da APM",
	description: "Ata de aprovação do plano de compra e mapa de preços, prontos para imprimir e assinar.",
};

export default function PaginaDaAta() {
	return <TelaDaAta />;
}

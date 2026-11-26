import type { Metadata } from "next";
import { TelaDoPlano } from "@/components/plano/tela-do-plano";

export const metadata: Metadata = {
	title: "Plano de compra",
	description: "Plano de compra do PDDE montado pelas regras do FNDE, com o que entra, o que fica de fora e por quê.",
};

export default function PaginaDoPlano() {
	return <TelaDoPlano />;
}

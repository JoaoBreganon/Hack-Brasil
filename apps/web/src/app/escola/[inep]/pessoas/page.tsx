import type { Metadata } from "next";
import { TelaDePessoas } from "@/components/pessoas/tela-de-pessoas";

export const metadata: Metadata = {
	title: "Quem cuida",
	description: "As pessoas que podem mudar o plano, os celulares e os alertas da escola no Aloca.",
};

export default function PaginaDePessoas() {
	return <TelaDePessoas />;
}

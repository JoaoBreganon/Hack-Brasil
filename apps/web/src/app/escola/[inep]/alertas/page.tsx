import type { Metadata } from "next";
import { TelaDeAlertas } from "@/components/alertas/tela-de-alertas";

export const metadata: Metadata = {
	title: "Alertas no celular",
	description: "Celulares do diretor e do tesoureiro para receber o aviso de prazo do PDDE por WhatsApp ou SMS.",
};

export default function PaginaDeAlertas() {
	return <TelaDeAlertas />;
}

import type { Metadata } from "next";
import { TelaDeAlertas } from "@/components/alertas/tela-de-alertas";

export const metadata: Metadata = {
	title: "Alertas de prazo",
	description: "Celular e e-mail do diretor e do tesoureiro para receber o aviso de prazo do PDDE por WhatsApp, SMS ou e-mail.",
};

export default function PaginaDeAlertas() {
	return <TelaDeAlertas />;
}

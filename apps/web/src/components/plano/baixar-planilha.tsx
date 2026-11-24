"use client";

import { montarPlanilhaDoPlano, nomeDaPlanilhaDoPlano, type PlanoDeCompra } from "@aloca/dominio";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { baixarArquivo } from "@/lib/baixar";

const TIPO_DO_CSV = "text/csv;charset=utf-8";

type Propriedades = {
	codigoInep: string;
	exercicio: number;
	plano: PlanoDeCompra;
};

export function BaixarPlanilha({ codigoInep, exercicio, plano }: Propriedades) {
	function baixar() {
		baixarArquivo(nomeDaPlanilhaDoPlano(codigoInep, exercicio), montarPlanilhaDoPlano(plano), TIPO_DO_CSV);
	}

	return (
		<Button variant="secondary" onClick={baixar}>
			<DownloadIcon data-icon="inline-start" />
			Baixar planilha
		</Button>
	);
}

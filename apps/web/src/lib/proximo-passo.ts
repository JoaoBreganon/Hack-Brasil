import { ORCAMENTOS_EXIGIDOS, type PlanoDeCompra, REGRAS_POR_TIPO } from "@aloca/dominio";
import type { DadosDoPainel } from "@/hooks/use-painel-da-escola";

export type ProximoPasso = {
	titulo: string;
	detalhe: string;
	acao: string;
	caminho: string;
	busca?: Record<string, string>;
};

export function definirProximoPasso(dados: DadosDoPainel, plano: PlanoDeCompra): ProximoPasso {
	if (dados.itens.length === 0) {
		return {
			titulo: "Listar o que a escola precisa comprar",
			detalhe: "Comece pelo item mais urgente.",
			acao: "Abrir compras",
			caminho: "compras",
		};
	}
	const semOrcamentos = [...dados.itens]
		.sort((a, b) => a.prioridade - b.prioridade)
		.find(
			({ tipo, orcamentos, justificativa }) =>
				REGRAS_POR_TIPO[tipo].permitido && orcamentos.length < ORCAMENTOS_EXIGIDOS && !justificativa,
		);
	if (semOrcamentos) {
		const faltam = ORCAMENTOS_EXIGIDOS - semOrcamentos.orcamentos.length;
		return {
			titulo: semOrcamentos.descricao,
			detalhe: `${faltam === 1 ? "Falta 1 orçamento" : `Faltam ${faltam} orçamentos`} para o item entrar no plano.`,
			acao: "Abrir o item",
			caminho: "compras",
			busca: { item: semOrcamentos._id },
		};
	}
	if (dados.plano?.status !== "aprovado") {
		return {
			titulo: "Aprovar o plano na reunião da APM",
			detalhe: `${plano.itens.length} ${plano.itens.length === 1 ? "item está pronto" : "itens estão prontos"} para compra.`,
			acao: "Revisar o plano",
			caminho: "plano",
		};
	}
	return { titulo: "Imprimir a ata e colher as assinaturas", detalhe: "O plano já foi aprovado.", acao: "Abrir a ata", caminho: "ata" };
}

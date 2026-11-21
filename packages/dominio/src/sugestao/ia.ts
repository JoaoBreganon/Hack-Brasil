import { formatarReais } from "../formato/formatar";
import { LIMITES } from "../plano/entradas";
import { REGRAS_POR_TIPO, TIPOS_DE_DESPESA } from "../regras/regras";
import { type ContextoDaSugestao, quantasSugestoes } from "./sugestao";

export const NOME_DO_ESQUEMA_DA_SUGESTAO = "sugestao_de_itens";

export const ESQUEMA_DA_SUGESTAO = {
	type: "object",
	properties: {
		itens: {
			type: "array",
			description: "Itens de compra sugeridos, do mais urgente para o menos urgente",
			items: {
				type: "object",
				properties: {
					descricao: { type: "string", description: `O que comprar, em até ${LIMITES.descricao.maximo} caracteres` },
					tipo: { type: "string", enum: [...TIPOS_DE_DESPESA], description: "Tipo de despesa do PDDE que descreve o item" },
					quantidade: { type: "integer", description: "Quantidade de unidades, número inteiro maior que zero" },
					prioridade: { type: "integer", description: "Ordem de urgência, começando na prioridade informada" },
				},
				required: ["descricao", "tipo", "quantidade", "prioridade"],
				additionalProperties: false,
			},
		},
	},
	required: ["itens"],
	additionalProperties: false,
} as const;

export const INSTRUCAO_DA_SUGESTAO = [
	"Você ajuda a direção de uma escola pública brasileira a planejar o gasto do PDDE (Programa Dinheiro Direto na Escola).",
	"Sugira itens de compra concretos, cada um com descrição curta, tipo de despesa, quantidade e prioridade.",
	"Custeio paga material de consumo, livros, pequenos reparos e serviços. Capital paga material permanente.",
	"Mantenha o custo estimado dos itens de cada categoria dentro do saldo livre dela.",
	"Classifique cada item pelo tipo que de fato o descreve, mesmo quando for uma despesa que o PDDE não paga: o sistema bloqueia essas despesas. Nunca use outro tipo para disfarçar uma despesa vedada.",
	"Não repita itens que já estão na lista da escola.",
].join(" ");

export function mensagemDaSugestao({ saldo, pedido, jaNoPlano, primeiraPrioridade }: ContextoDaSugestao): string {
	const permitidos = TIPOS_DE_DESPESA.flatMap((tipo) => {
		const regra = REGRAS_POR_TIPO[tipo];
		return regra.permitido ? [`${tipo} (${regra.categoria})`] : [];
	});
	const vedados = TIPOS_DE_DESPESA.filter((tipo) => !REGRAS_POR_TIPO[tipo].permitido);
	return [
		`Saldo livre de custeio: ${formatarReais(saldo.custeio)}.`,
		`Saldo livre de capital: ${formatarReais(saldo.capital)}.`,
		`Tipos que o PDDE paga: ${permitidos.join("; ")}.`,
		`Tipos que o PDDE não paga: ${vedados.join("; ")}.`,
		`Já estão na lista: ${jaNoPlano.length > 0 ? jaNoPlano.join("; ") : "nenhum item"}.`,
		`Sugira até ${quantasSugestoes(jaNoPlano)} itens novos, com prioridade a partir de ${primeiraPrioridade}.`,
		pedido
			? `O que a escola precisa, nas palavras da direção: """${pedido}"""`
			: "A direção não descreveu o que falta. Sugira o que costuma faltar numa escola pública de ensino fundamental.",
	].join("\n");
}

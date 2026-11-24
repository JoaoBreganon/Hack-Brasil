import { formatarData, formatarDataNumerica, formatarValor } from "../formato/formatar";

export const CANAIS_DO_ALERTA = ["whatsapp", "sms", "email"] as const;
export const LIMITE_DO_SMS = 160;

export type CanalDoAlerta = (typeof CANAIS_DO_ALERTA)[number];

export const ROTULO_DO_CANAL: Record<CanalDoAlerta, string> = { whatsapp: "WhatsApp", sms: "SMS", email: "E-mail" };
export const LIMITE_DO_NOME_NO_SMS = 40;

export const TEMPLATE_DO_WHATSAPP = {
	nome: "aloca_prazo_pdde",
	categoria: "UTILITY",
	idioma: "pt_BR",
	cabecalho: "Prazo do PDDE",
	corpo: [
		"Aviso do Aloca sobre o PDDE da escola {{1}}.",
		"",
		"Dias úteis restantes: {{2}}",
		"Saldo em risco: R$ {{3}}",
		"Prazo final para uso: {{4}}",
		"",
		"Pela regra do FNDE, o saldo que não for usado até essa data é estornado. Abra o plano de compra no Aloca para ver o que a escola pode comprar dentro das regras do programa.",
	].join("\n"),
	rodape: "Aloca · alertas de prazo do PDDE",
} as const;

export const TEMPLATE_DO_SMS = "Aloca: PDDE da {{1}}. Prazo de {{2}} para usar R$ {{3}}, ate {{4}}. Depois o saldo e estornado.";

export type DadosDoAlerta = {
	nomeDaEscola: string;
	diasUteisRestantes: number;
	saldoEmRiscoEmCentavos: number;
	limiteParaUso: Date;
};

function umaLinha(texto: string): string {
	return texto.replace(/\s+/g, " ").trim();
}

function semAcentos(texto: string): string {
	return texto
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^\x20-\x7e]/g, "");
}

export function variaveisDoWhatsapp({ nomeDaEscola, diasUteisRestantes, saldoEmRiscoEmCentavos, limiteParaUso }: DadosDoAlerta): string[] {
	return [umaLinha(nomeDaEscola), String(diasUteisRestantes), formatarValor(saldoEmRiscoEmCentavos), formatarData(limiteParaUso)];
}

export function variaveisDoSms({ nomeDaEscola, diasUteisRestantes, saldoEmRiscoEmCentavos, limiteParaUso }: DadosDoAlerta): string[] {
	return [
		umaLinha(semAcentos(nomeDaEscola)).slice(0, LIMITE_DO_NOME_NO_SMS).trim(),
		diasUteisRestantes === 1 ? "1 dia util" : `${diasUteisRestantes} dias uteis`,
		formatarValor(saldoEmRiscoEmCentavos),
		formatarDataNumerica(limiteParaUso),
	];
}

export function preencherTemplate(template: string, variaveis: string[]): string {
	return template.replace(/\{\{(\d+)\}\}/g, (_, posicao: string) => {
		const valor = variaveis[Number(posicao) - 1];
		if (valor === undefined) {
			throw new RangeError(`Falta a variável {{${posicao}}} do template.`);
		}
		return valor;
	});
}

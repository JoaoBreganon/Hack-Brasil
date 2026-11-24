import { formatarData, formatarReais } from "../formato/formatar";
import type { DadosDoAlerta } from "./alerta";

export type EmailDoAlerta = {
	assunto: string;
	texto: string;
	html: string;
};

const ASSINATURA = "Aloca · alertas de prazo do PDDE";
const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escaparHtml(texto: string): string {
	return texto.replace(/[&<>"']/g, (caractere) => ESCAPES[caractere]);
}

function paragrafoHtml(texto: string): string {
	return `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#0b0f1c">${escaparHtml(texto)}</p>`;
}

export function montarEmailDoAlerta(dados: DadosDoAlerta, enderecoDoPlano?: string): EmailDoAlerta {
	const escola = dados.nomeDaEscola.replace(/\s+/g, " ").trim();
	const dias = dados.diasUteisRestantes === 1 ? "1 dia útil" : `${dados.diasUteisRestantes} dias úteis`;
	const valor = formatarReais(dados.saldoEmRiscoEmCentavos);
	const paragrafos = [
		`Faltam ${dias} para a ${escola} usar ${valor} do PDDE. O prazo final é ${formatarData(dados.limiteParaUso)}.`,
		"Pela regra do FNDE, o saldo que não for usado até essa data é estornado.",
		"Abra o plano de compra no Aloca para ver o que a escola pode comprar dentro das regras do programa.",
	];
	const botao = enderecoDoPlano
		? `<p style="margin:24px 0"><a href="${escaparHtml(enderecoDoPlano)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#0b0f1c;color:#ffffff;font-weight:600;text-decoration:none">Abrir o plano de compra</a></p>`
		: "";
	return {
		assunto: `PDDE da ${escola}: ${dias} para usar ${valor}`,
		texto: [...paragrafos, ...(enderecoDoPlano ? [enderecoDoPlano] : []), ASSINATURA].join("\n\n"),
		html: [
			'<!doctype html><html lang="pt-BR"><body style="margin:0;padding:32px 16px;background:#f5f4f0;font-family:Arial,Helvetica,sans-serif">',
			'<div style="max-width:560px;margin:0 auto;padding:32px;border:1px solid #e4e2dc;border-radius:12px;background:#ffffff">',
			`<p style="margin:0 0 8px;font-size:13px;color:#6c717e">Prazo do PDDE</p>`,
			`<h1 style="margin:0 0 20px;font-size:24px;line-height:1.2;color:#0b0f1c">${escaparHtml(`${valor} da ${escola} vencem em ${dias}`)}</h1>`,
			...paragrafos.map(paragrafoHtml),
			botao,
			`<p style="margin:24px 0 0;font-size:13px;color:#6c717e">${ASSINATURA}</p>`,
			"</div></body></html>",
		].join(""),
	};
}

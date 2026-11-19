import { criarData } from "../calendario/calendario";
import { ehCodigoInepValido, type Escola, type RegistroDeSaldo } from "../escola/escola";
import { dividirPeloPercentualPadrao, type Saldo } from "../regras/regras";
import { lerValorEmCentavos } from "./saldos";

export const ENDERECO_DA_CONSULTA_POR_ESCOLA = "https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar";
export const PROGRAMA_PDDE_BASICO = "PDDE";

export type EntidadeDoPdde = "UEx" | "EEx" | "EM";

export type ContaDoPdde = {
	programa: string;
	saldoEmCentavos: number;
};

export type RepasseDoPdde = {
	programa: string;
	destinacao: string;
	devido: Saldo;
	pago: Saldo;
	pagoEm: Date | null;
};

export type PendenciaDoPdde = {
	entidade: EntidadeDoPdde;
	assunto: string;
	mensagem: string;
};

export type SituacaoNoPddeInfo = {
	escola: Escola;
	exercicio: number;
	contas: ContaDoPdde[];
	repasses: RepasseDoPdde[];
	pendencias: PendenciaDoPdde[];
};

type Subcartao = {
	titulo: string;
	html: string;
};

const MAIOR_CODIGO_UNICODE = 0x10ffff;
const SUFIXO_DO_CODIGO_INEP = /\s*-\s*\d{8}$/;
const ENTIDADES_DO_HTML: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ordm: "º", ordf: "ª" };
const ACENTOS_DO_HTML: Record<string, string> = {
	acute: "\u0301",
	grave: "\u0300",
	circ: "\u0302",
	tilde: "\u0303",
	uml: "\u0308",
	cedil: "\u0327",
};

export function enderecoDaConsultaPorEscola(codigoInep: string, exercicio: number): string {
	if (!ehCodigoInepValido(codigoInep)) {
		throw new RangeError(`O código INEP "${codigoInep}" precisa ter 8 dígitos.`);
	}
	return `${ENDERECO_DA_CONSULTA_POR_ESCOLA}?ano=${exercicio}&co_escola=${codigoInep}&consultar=Consultar`;
}

function textoDoHtml(html: string): string {
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entidade, codigo: string) => {
			if (codigo.startsWith("#")) {
				const numero = /^#x/i.test(codigo) ? Number.parseInt(codigo.slice(2), 16) : Number(codigo.slice(1));
				return Number.isInteger(numero) && numero <= MAIOR_CODIGO_UNICODE ? String.fromCodePoint(numero) : entidade;
			}
			const acentuada = codigo.match(/^([a-z])(acute|grave|circ|tilde|uml|cedil)$/i);
			return acentuada
				? (acentuada[1] + ACENTOS_DO_HTML[acentuada[2].toLowerCase()]).normalize("NFC")
				: (ENTIDADES_DO_HTML[codigo] ?? entidade);
		})
		.replace(/\s+/g, " ")
		.trim();
}

function centavos(texto: string, contexto: string): number {
	const valor = lerValorEmCentavos(texto);
	if (valor === null) {
		throw new Error(`O PDDE Info mudou de formato: "${texto}" não é um valor em reais (${contexto}).`);
	}
	return valor;
}

function lerData(texto: string): Date | null {
	const partes = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
	return partes ? criarData(Number(partes[3]), Number(partes[2]), Number(partes[1])) : null;
}

function cartaoDaEscola(html: string, codigoInep: string): string | null {
	const inicio = html.indexOf(`id="chk-escola-${codigoInep}"`);
	if (inicio === -1) {
		return null;
	}
	const fim = html.indexOf('<div class="escola-item', inicio);
	return html.slice(inicio, fim === -1 ? undefined : fim);
}

function lerSubcartoes(cartao: string): Subcartao[] {
	return cartao
		.split(/<div class="govbr-subcard(?=[" ])/)
		.slice(1)
		.map((html) => ({ titulo: textoDoHtml(html.match(/class="govbr-subcard-title[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? ""), html }));
}

function lerCampos(html: string): Map<string, string> {
	const campos = new Map<string, string>();
	for (const [, rotulo, valor] of html.matchAll(/<span class="label">([^<]*)<\/span>\s*<span class="value[^"]*"[^>]*>([^<]*)<\/span>/g)) {
		const chave = textoDoHtml(rotulo).replace(/:$/, "");
		if (!campos.has(chave)) {
			campos.set(chave, textoDoHtml(valor));
		}
	}
	return campos;
}

function lerTabela(html: string): Record<string, string>[] {
	const cabecalho = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(([, celula]) => textoDoHtml(celula));
	const corpo = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? "";
	return [...corpo.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(([, linha]) => {
		const celulas = [...linha.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(([, celula]) => textoDoHtml(celula));
		return Object.fromEntries(cabecalho.map((titulo, indice) => [titulo, celulas[indice] ?? ""]));
	});
}

function entidadeDoSubcartao(titulo: string): EntidadeDoPdde | null {
	if (/Unidade Executora/i.test(titulo)) {
		return "UEx";
	}
	if (/Entidade Mantenedora/i.test(titulo)) {
		return "EM";
	}
	return /Entidade Executora/i.test(titulo) ? "EEx" : null;
}

function lerPendencias(entidade: EntidadeDoPdde, html: string): PendenciaDoPdde[] {
	const pendencias: PendenciaDoPdde[] = [];
	for (const [, bloco] of html.matchAll(/<div class="govbr-text-alert\b[^"]*"[^>]*>([\s\S]*?)<\/div>/g)) {
		const assunto = textoDoHtml(bloco.match(/<strong>([\s\S]*?)<\/strong>/)?.[1] ?? "").replace(/:$/, "");
		pendencias.push({
			entidade,
			assunto: assunto || "Situação",
			mensagem: textoDoHtml(bloco.replace(/<strong>[\s\S]*?<\/strong>/, "")),
		});
	}
	for (const [, atributos] of html.matchAll(/<span class="value receita-status"([^>]*)>/g)) {
		if (atributos.includes('data-receita-initial-impedimento="1"')) {
			const situacao = textoDoHtml(atributos.match(/data-receita-initial="([^"]*)"/)?.[1] ?? "");
			pendencias.push({
				entidade,
				assunto: "Situação na Receita Federal",
				mensagem: `${situacao}. Esta situação pode suspender o repasse do PDDE.`,
			});
		}
	}
	return pendencias;
}

function lerRepasses(programa: string, html: string): RepasseDoPdde[] {
	return lerTabela(html)
		.filter((linha) => linha["Destinação"] && linha["Destinação"] !== "Subtotal")
		.map((linha) => {
			const valor = (coluna: string) => centavos(linha[coluna] ?? "", `${coluna} de ${linha["Destinação"]}`);
			return {
				programa,
				destinacao: linha["Destinação"],
				devido: {
					custeio: valor("Vl Devido Custeio") + valor("Vl Ajuste Custeio"),
					capital: valor("Vl Devido Capital") + valor("Vl Ajuste Capital"),
				},
				pago: { custeio: valor("Vl Pago Custeio"), capital: valor("Vl Pago Capital") },
				pagoEm: lerData(linha["Data do Pagamento"] ?? ""),
			};
		});
}

export function lerConsultaPorEscola(html: string, codigoInep: string): SituacaoNoPddeInfo | null {
	const cartao = cartaoDaEscola(html, codigoInep);
	if (!cartao) {
		return null;
	}
	const subcartoes = lerSubcartoes(cartao);
	const dadosDaEscola = lerCampos(subcartoes.find(({ titulo }) => titulo === "Dados da escola")?.html ?? "");
	const identificacao = dadosDaEscola.get("Identificação") ?? "";
	const exercicio = Number(cartao.match(/name="an_exercicio" value="(\d{4})"/)?.[1]);
	if (!identificacao || !Number.isInteger(exercicio)) {
		throw new Error(`O PDDE Info mudou de formato: faltam a identificação ou o exercício da escola ${codigoInep}.`);
	}

	const contas: ContaDoPdde[] = [];
	const repasses: RepasseDoPdde[] = [];
	const pendencias: PendenciaDoPdde[] = [];
	for (const { titulo, html: conteudo } of subcartoes) {
		const entidade = entidadeDoSubcartao(titulo);
		if (conteudo.startsWith(" govbr-program-card")) {
			repasses.push(...lerRepasses(textoDoHtml(conteudo.match(/class="govbr-program-name">([^<]*)</)?.[1] ?? ""), conteudo));
		} else if (entidade) {
			pendencias.push(...lerPendencias(entidade, conteudo));
		} else if (titulo.startsWith("Dados Bancários")) {
			for (const linha of lerTabela(conteudo)) {
				const programa = linha["Programa/Ação"];
				contas.push({ programa, saldoEmCentavos: centavos(linha["Saldo (R$)"] ?? "", `saldo da conta do ${programa}`) });
				if (linha["Ocorrência"]) {
					pendencias.push({ entidade: "UEx", assunto: "Conta bancária", mensagem: `${programa}: ${linha["Ocorrência"]}` });
				}
			}
		}
	}

	return {
		escola: {
			codigoInep,
			nome: identificacao.replace(SUFIXO_DO_CODIGO_INEP, ""),
			municipio: [dadosDaEscola.get("Município"), dadosDaEscola.get("UF")].filter(Boolean).join("/"),
		},
		exercicio,
		contas,
		repasses,
		pendencias,
	};
}

export function saldoEmContaDoPddeBasico(contas: ContaDoPdde[]): number {
	return contas
		.filter(({ programa }) => programa === PROGRAMA_PDDE_BASICO)
		.reduce((total, { saldoEmCentavos }) => total + saldoEmCentavos, 0);
}

export function dividirPelosRepasses(totalEmCentavos: number, repasses: RepasseDoPdde[]): Saldo | null {
	const pago = repasses
		.filter(({ programa }) => programa === PROGRAMA_PDDE_BASICO)
		.reduce((soma, { pago }) => ({ custeio: soma.custeio + pago.custeio, capital: soma.capital + pago.capital }), {
			custeio: 0,
			capital: 0,
		});
	const totalPago = pago.custeio + pago.capital;
	if (totalPago <= 0) {
		return null;
	}
	const custeio = Math.round((totalEmCentavos * pago.custeio) / totalPago);
	return { custeio, capital: totalEmCentavos - custeio };
}

export function registroDeSaldoDoPddeInfo(situacao: SituacaoNoPddeInfo, coletadoEm: Date): RegistroDeSaldo {
	const { escola, exercicio } = situacao;
	const total = saldoEmContaDoPddeBasico(situacao.contas);
	const pelosRepasses = dividirPelosRepasses(total, situacao.repasses);
	const divisao = pelosRepasses ? `na proporção dos repasses de ${exercicio}` : "pelo percentual padrão de 80% e 20%";
	return {
		codigoInep: escola.codigoInep,
		exercicio,
		saldo: pelosRepasses ?? dividirPeloPercentualPadrao(total),
		fonte: {
			nome: `PDDE Info (FNDE), saldo das contas do PDDE. Custeio e capital divididos ${divisao}.`,
			endereco: enderecoDaConsultaPorEscola(escola.codigoInep, exercicio),
		},
		coletadoEm,
	};
}

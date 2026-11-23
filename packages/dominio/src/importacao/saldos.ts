import { ehCodigoInepValido, type Escola, type FonteDoDado, type RegistroDeSaldo } from "../escola/escola";
import { ESCOLA_EXEMPLO } from "../exemplos/escola-exemplo";
import { CATEGORIAS, type Categoria } from "../regras/regras";
import { type LinhaDoCsv, lerCsv } from "./csv";

type Coluna = "codigoInep" | "exercicio" | Categoria;
type ColunaOpcional = "nome" | "municipio";

const NOMES_DAS_COLUNAS: Record<Coluna, string[]> = {
	codigoInep: ["codigoinep", "inep", "codinep", "codigodaescola", "codigoescola"],
	exercicio: ["exercicio", "ano", "anoexercicio"],
	custeio: ["custeio", "saldocusteio", "valorcusteio"],
	capital: ["capital", "saldocapital", "valorcapital"],
};

const NOMES_DAS_COLUNAS_OPCIONAIS: Record<ColunaOpcional, string[]> = {
	nome: ["nome", "escola", "nomedaescola", "nomeescola"],
	municipio: ["municipio", "cidade", "municipiouf"],
};

const TAMANHO_MAXIMO_DO_NOME = 120;
const PRIMEIRO_EXERCICIO_DO_PDDE = 1995;

const ROTULOS: Record<Coluna, string> = {
	codigoInep: "código INEP",
	exercicio: "exercício",
	custeio: "custeio",
	capital: "capital",
};

export type ErroDeImportacao = {
	linha: number;
	mensagem: string;
};

export type RegistroDaPlanilha = RegistroDeSaldo & Partial<Record<ColunaOpcional, string>>;

export type ImportacaoDeSaldos = {
	registros: RegistroDaPlanilha[];
	erros: ErroDeImportacao[];
};

export type LeituraDaPlanilha = { ok: true; registro: RegistroDaPlanilha } | { ok: false; mensagem: string };

function normalizarCabecalho(texto: string): string {
	return texto
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "");
}

export function lerValorEmCentavos(texto: string): number | null {
	const limpo = texto.replace(/R\$/gi, "").replace(/\s/g, "");
	const negativo = limpo.startsWith("-");
	const numero = negativo ? limpo.slice(1) : limpo;
	let inteiro: string;
	let fracao: string;
	if (numero.includes(",")) {
		const partes = numero.split(",");
		if (partes.length !== 2) {
			return null;
		}
		[inteiro, fracao] = [partes[0].replace(/\./g, ""), partes[1]];
	} else if (/\.\d{1,2}$/.test(numero)) {
		const ponto = numero.lastIndexOf(".");
		[inteiro, fracao] = [numero.slice(0, ponto), numero.slice(ponto + 1)];
	} else {
		[inteiro, fracao] = [numero.replace(/\./g, ""), ""];
	}
	if (!/^\d+$/.test(inteiro) || !/^\d{0,2}$/.test(fracao)) {
		return null;
	}
	const centavos = Number(inteiro) * 100 + Number(fracao.padEnd(2, "0"));
	if (!Number.isSafeInteger(centavos)) {
		return null;
	}
	return negativo ? -centavos : centavos;
}

function localizarColunas(cabecalho: LinhaDoCsv): Record<Coluna, number> | Coluna[] {
	const normalizados = cabecalho.campos.map(normalizarCabecalho);
	const colunas = Object.keys(NOMES_DAS_COLUNAS) as Coluna[];
	const indices = Object.fromEntries(
		colunas.map((coluna) => [coluna, normalizados.findIndex((nome) => NOMES_DAS_COLUNAS[coluna].includes(nome))]),
	) as Record<Coluna, number>;
	const faltando = colunas.filter((coluna) => indices[coluna] === -1);
	return faltando.length > 0 ? faltando : indices;
}

function localizarColunasOpcionais(cabecalho: LinhaDoCsv): Partial<Record<ColunaOpcional, number>> {
	const normalizados = cabecalho.campos.map(normalizarCabecalho);
	return Object.fromEntries(
		(Object.keys(NOMES_DAS_COLUNAS_OPCIONAIS) as ColunaOpcional[]).flatMap((coluna) => {
			const indice = normalizados.findIndex((nome) => NOMES_DAS_COLUNAS_OPCIONAIS[coluna].includes(nome));
			return indice === -1 ? [] : [[coluna, indice]];
		}),
	);
}

function textoCurto(texto: string | undefined): string {
	return (texto ?? "").replace(/\s+/g, " ").trim().slice(0, TAMANHO_MAXIMO_DO_NOME);
}

export function importarSaldosCsv(texto: string, fonte: FonteDoDado, coletadoEm: Date): ImportacaoDeSaldos {
	const [cabecalho, ...linhas] = lerCsv(texto);
	if (!cabecalho) {
		return { registros: [], erros: [{ linha: 1, mensagem: "O arquivo está vazio." }] };
	}
	const colunas = localizarColunas(cabecalho);
	if (Array.isArray(colunas)) {
		const lista = colunas.map((coluna) => ROTULOS[coluna]).join(", ");
		return { registros: [], erros: [{ linha: cabecalho.numero, mensagem: `Faltam as colunas: ${lista}.` }] };
	}

	const opcionais = localizarColunasOpcionais(cabecalho);
	const ultimoExercicio = coletadoEm.getUTCFullYear();
	const registros: RegistroDaPlanilha[] = [];
	const erros: ErroDeImportacao[] = [];
	const vistos = new Map<string, number>();

	for (const { numero, campos } of linhas) {
		const valor = (coluna: Coluna) => (campos[colunas[coluna]] ?? "").trim();
		const problemas: string[] = [];

		const codigoInep = valor("codigoInep");
		if (!ehCodigoInepValido(codigoInep)) {
			problemas.push(`código INEP "${codigoInep}" precisa ter 8 dígitos`);
		}
		const textoDoExercicio = valor("exercicio");
		const exercicio = Number(textoDoExercicio);
		if (!/^\d{4}$/.test(textoDoExercicio) || exercicio < PRIMEIRO_EXERCICIO_DO_PDDE || exercicio > ultimoExercicio) {
			problemas.push(`exercício "${textoDoExercicio}" precisa ser um ano entre ${PRIMEIRO_EXERCICIO_DO_PDDE} e ${ultimoExercicio}`);
		}
		const saldo = { custeio: 0, capital: 0 };
		for (const categoria of CATEGORIAS) {
			const centavos = lerValorEmCentavos(valor(categoria));
			if (centavos === null) {
				problemas.push(`${categoria} "${valor(categoria)}" não é um valor em reais`);
			} else if (centavos < 0) {
				problemas.push(`${categoria} não pode ser negativo`);
			} else {
				saldo[categoria] = centavos;
			}
		}

		const chave = `${codigoInep}/${exercicio}`;
		const repetida = vistos.get(chave);
		if (problemas.length === 0 && repetida !== undefined) {
			problemas.push(`a escola ${codigoInep} já aparece no exercício ${exercicio} na linha ${repetida}`);
		}
		if (problemas.length > 0) {
			erros.push({ linha: numero, mensagem: `Linha ${numero}: ${problemas.join("; ")}.` });
			continue;
		}
		vistos.set(chave, numero);
		const extras = Object.fromEntries(
			Object.entries(opcionais).flatMap(([coluna, indice]) => {
				const valor = textoCurto(campos[indice]);
				return valor ? [[coluna, valor]] : [];
			}),
		);
		registros.push({ codigoInep, exercicio, saldo, fonte, coletadoEm, ...extras });
	}

	return { registros, erros };
}

export function lerSaldoDaEscolaNaPlanilha(texto: string, codigoInep: string, fonte: FonteDoDado, coletadoEm: Date): LeituraDaPlanilha {
	const { registros, erros } = importarSaldosCsv(texto, fonte, coletadoEm);
	const [registro] = registros.filter((atual) => atual.codigoInep === codigoInep).sort((a, b) => b.exercicio - a.exercicio);
	if (registro) {
		return { ok: true, registro };
	}
	if (registros.length === 0 && erros.length > 0) {
		return { ok: false, mensagem: `Não deu para ler a planilha. ${erros[0].mensagem}` };
	}
	const detalhe = erros.length > 0 ? ` ${erros[0].mensagem}` : "";
	return {
		ok: false,
		mensagem: `A planilha não tem uma linha válida da escola ${codigoInep}. Confira o código INEP, o exercício e os valores.${detalhe}`,
	};
}

export function escolaDaPlanilha({ codigoInep, nome, municipio }: RegistroDaPlanilha): Escola {
	const exemplo = codigoInep === ESCOLA_EXEMPLO.codigoInep ? ESCOLA_EXEMPLO : null;
	return {
		codigoInep,
		nome: nome || exemplo?.nome || `Escola ${codigoInep}`,
		municipio: municipio || exemplo?.municipio || "Município não informado",
	};
}

import { LIMITES, type NovaNecessidade } from "../plano/entradas";
import { CATEGORIAS, type Categoria, REGRAS_POR_TIPO, type TipoDeDespesa } from "../regras/regras";
import { chaveDaDescricao, type ContextoDaSugestao, quantasSugestoes } from "./sugestao";

export type ModeloDeSugestao = {
	descricao: string;
	tipo: TipoDeDespesa;
	precoDeReferenciaEmCentavos: number;
	quantidadeMaxima: number;
	palavras: string[];
};

type Candidato = {
	modelo: ModeloDeSugestao;
	ordem: number;
	pontos: number;
};

const SUGESTOES_POR_CATEGORIA = 3;

export const CATALOGO_DE_SUGESTOES: ModeloDeSugestao[] = [
	{
		descricao: "Livro de literatura infantojuvenil",
		tipo: "livro",
		precoDeReferenciaEmCentavos: 4_500,
		quantidadeMaxima: 200,
		palavras: ["livro", "literatura", "biblioteca", "leitura"],
	},
	{
		descricao: "Kit de material pedagógico (lápis, caderno, cola e tesoura)",
		tipo: "material de consumo",
		precoDeReferenciaEmCentavos: 6_000,
		quantidadeMaxima: 300,
		palavras: ["material pedagogico", "material escolar", "caderno", "lapis", "papelaria"],
	},
	{
		descricao: "Kit de limpeza e higiene",
		tipo: "material de consumo",
		precoDeReferenciaEmCentavos: 30_000,
		quantidadeMaxima: 30,
		palavras: ["limpeza", "higiene", "sabonete", "detergente", "papel higienico"],
	},
	{
		descricao: "Resma de papel sulfite A4",
		tipo: "material de consumo",
		precoDeReferenciaEmCentavos: 3_000,
		quantidadeMaxima: 200,
		palavras: ["sulfite", "resma", "papel a4"],
	},
	{
		descricao: "Pintura de sala de aula",
		tipo: "pequeno reparo",
		precoDeReferenciaEmCentavos: 250_000,
		quantidadeMaxima: 6,
		palavras: ["pintura", "pintar", "parede", "tinta", "mofo"],
	},
	{
		descricao: "Reparo elétrico com troca de lâmpadas",
		tipo: "pequeno reparo",
		precoDeReferenciaEmCentavos: 150_000,
		quantidadeMaxima: 1,
		palavras: ["eletric", "tomada", "fiacao", "lampada", "iluminacao"],
	},
	{
		descricao: "Conserto de vazamentos, torneiras e descargas",
		tipo: "pequeno reparo",
		precoDeReferenciaEmCentavos: 120_000,
		quantidadeMaxima: 1,
		palavras: ["hidraulic", "vazamento", "torneira", "descarga", "encanamento", "banheiro"],
	},
	{
		descricao: "Manutenção de aparelho de ar-condicionado",
		tipo: "serviço",
		precoDeReferenciaEmCentavos: 30_000,
		quantidadeMaxima: 10,
		palavras: ["ar-condicionado", "ar condicionado", "climatiz"],
	},
	{
		descricao: "Ventilador de parede",
		tipo: "material permanente",
		precoDeReferenciaEmCentavos: 25_000,
		quantidadeMaxima: 20,
		palavras: ["ventilador", "calor", "quente", "ventilacao", "abafad"],
	},
	{
		descricao: "Bebedouro industrial",
		tipo: "material permanente",
		precoDeReferenciaEmCentavos: 180_000,
		quantidadeMaxima: 3,
		palavras: ["bebedouro", "filtro de agua", "agua gelada"],
	},
	{
		descricao: "Projetor multimídia",
		tipo: "material permanente",
		precoDeReferenciaEmCentavos: 280_000,
		quantidadeMaxima: 3,
		palavras: ["projetor", "datashow", "data show", "multimidia"],
	},
	{
		descricao: "Notebook para uso pedagógico",
		tipo: "material permanente",
		precoDeReferenciaEmCentavos: 350_000,
		quantidadeMaxima: 10,
		palavras: ["notebook", "computador", "laptop", "informatica", "tecnologia"],
	},
	{
		descricao: "Roteador Wi-Fi 6",
		tipo: "material permanente",
		precoDeReferenciaEmCentavos: 50_000,
		quantidadeMaxima: 4,
		palavras: ["roteador", "wi-fi", "wifi", "internet", "conexao"],
	},
	{
		descricao: "Conjunto de carteira e cadeira escolar",
		tipo: "material permanente",
		precoDeReferenciaEmCentavos: 45_000,
		quantidadeMaxima: 40,
		palavras: ["carteira", "cadeira", "mesa", "mobiliario", "moveis"],
	},
	{
		descricao: "Estante de aço para biblioteca",
		tipo: "material permanente",
		precoDeReferenciaEmCentavos: 60_000,
		quantidadeMaxima: 6,
		palavras: ["estante", "prateleira", "biblioteca", "acervo"],
	},
	{
		descricao: "Impressora multifuncional",
		tipo: "material permanente",
		precoDeReferenciaEmCentavos: 150_000,
		quantidadeMaxima: 2,
		palavras: ["impressora", "impressao", "copia", "xerox", "escanear"],
	},
];

function categoriaDoModelo({ tipo }: ModeloDeSugestao): Categoria | null {
	const regra = REGRAS_POR_TIPO[tipo];
	return regra.permitido ? regra.categoria : null;
}

function porPontosEOrdem(a: Candidato, b: Candidato): number {
	return b.pontos - a.pontos || a.ordem - b.ordem;
}

function escolherDentroDoSaldo(candidatos: Candidato[], saldo: number): (Candidato & { quantidade: number })[] {
	const procurados = Math.max(SUGESTOES_POR_CATEGORIA, candidatos.filter(({ pontos }) => pontos > 0).length);
	const escolhidos: (Candidato & { quantidade: number })[] = [];
	let restante = saldo;
	for (const candidato of candidatos) {
		const { precoDeReferenciaEmCentavos: preco, quantidadeMaxima } = candidato.modelo;
		if (escolhidos.length >= procurados) {
			break;
		}
		if (preco > restante) {
			continue;
		}
		const parcela = Math.floor(restante / (procurados - escolhidos.length));
		const quantidade = Math.min(quantidadeMaxima, Math.max(1, Math.floor(parcela / preco)));
		restante -= quantidade * preco;
		escolhidos.push({ ...candidato, quantidade });
	}
	return escolhidos;
}

export function gerarSugestoesPorRegras({ saldo, pedido = "", jaNoPlano, primeiraPrioridade }: ContextoDaSugestao): NovaNecessidade[] {
	const busca = chaveDaDescricao(pedido);
	const presentes = new Set(jaNoPlano.map(chaveDaDescricao));
	const candidatos = CATALOGO_DE_SUGESTOES.map((modelo, ordem) => ({
		modelo,
		ordem,
		pontos: busca ? modelo.palavras.filter((palavra) => busca.includes(palavra)).length : 0,
	}))
		.filter(({ modelo }) => categoriaDoModelo(modelo) !== null && !presentes.has(chaveDaDescricao(modelo.descricao)))
		.sort(porPontosEOrdem);

	return CATEGORIAS.flatMap((categoria) =>
		escolherDentroDoSaldo(
			candidatos.filter(({ modelo }) => categoriaDoModelo(modelo) === categoria),
			saldo[categoria],
		),
	)
		.sort(porPontosEOrdem)
		.slice(0, quantasSugestoes(jaNoPlano))
		.map(({ modelo, quantidade }, indice) => ({
			descricao: modelo.descricao,
			tipo: modelo.tipo,
			quantidade,
			prioridade: Math.min(LIMITES.prioridade.maximo, Math.max(LIMITES.prioridade.minimo, primeiraPrioridade + indice)),
		}));
}

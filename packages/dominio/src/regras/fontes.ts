export type Fonte = {
	norma: string;
	trecho: string;
	endereco: string;
};

const RESOLUCAO_15_2021 =
	"https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pdde/media-pdde/sobre/RESOLUON15DE16DESETEMBRODE2021.NOVARESOLUOPDDE.PDF.pdf";
const RESOLUCAO_18_2025 =
	"https://www.gov.br/fnde/pt-br/acesso-a-informacao/legislacao/resolucoes/2025/resolucao-cd-fnde-no-18-de-27-de-novembro-de-2025";
const RESOLUCAO_7_2024 = "https://www.in.gov.br/en/web/dou/-/resolucao-cd/fnde-n-7-de-2-de-maio-de-2024-557685634";
const LEI_10_753_2003 = "https://www.planalto.gov.br/ccivil_03/leis/2003/l10.753.htm";

export const FONTES = {
	prazoDeUso: {
		norma: "Resolução CD/FNDE nº 7/2024, art. 16, com redação da Resolução CD/FNDE nº 18/2025",
		trecho: "Saldo do último dia útil do exercício pode ser usado até o 10º dia útil de fevereiro do exercício seguinte, a partir de 2027.",
		endereco: RESOLUCAO_18_2025,
	},
	estorno: {
		norma: "Resolução CD/FNDE nº 7/2024, art. 16, § 1º",
		trecho: "O Banco do Brasil estorna os saldos no 15º dia útil de fevereiro.",
		endereco: RESOLUCAO_7_2024,
	},
	destinacao: {
		norma: "Resolução CD/FNDE nº 15/2021, art. 4º",
		trecho: "Custeio, manutenção e pequenos investimentos: material permanente, pequenos reparos, material de consumo, avaliação, projetos pedagógicos.",
		endereco: RESOLUCAO_15_2021,
	},
	vedacaoOutroPrograma: {
		norma: "Resolução CD/FNDE nº 15/2021, art. 4º, § 2º, I",
		trecho: "Vedado custear ações já financiadas por outros programas do FNDE.",
		endereco: RESOLUCAO_15_2021,
	},
	vedacaoPessoal: {
		norma: "Resolução CD/FNDE nº 15/2021, art. 4º, § 2º, II",
		trecho: "Vedado pagar despesas com pessoal.",
		endereco: RESOLUCAO_15_2021,
	},
	vedacaoServidorEContasDeConsumo: {
		norma: "Resolução CD/FNDE nº 15/2021, art. 4º, § 2º, III",
		trecho: "Vedado pagar servidor ativo, empresa com servidor como sócio, aluguel, telefone, água, luz, esgoto e despesas assistenciais.",
		endereco: RESOLUCAO_15_2021,
	},
	vedacaoTarifaBancaria: {
		norma: "Resolução CD/FNDE nº 15/2021, art. 4º, § 2º, IV",
		trecho: "Vedado pagar tarifas bancárias.",
		endereco: RESOLUCAO_15_2021,
	},
	vedacaoTributo: {
		norma: "Resolução CD/FNDE nº 15/2021, art. 4º, § 2º, V",
		trecho: "Vedado pagar tributos, salvo os que incidem sobre o bem ou serviço comprado.",
		endereco: RESOLUCAO_15_2021,
	},
	percentualPadrao: {
		norma: "Resolução CD/FNDE nº 15/2021, art. 14, § 4º",
		trecho: "Sem escolha da UEx, o repasse vem 80% em custeio e 20% em capital.",
		endereco: RESOLUCAO_15_2021,
	},
	tresOrcamentos: {
		norma: "Resolução CD/FNDE nº 15/2021, art. 23",
		trecho: "Consolidação com os 3 melhores orçamentos por item ou lote.",
		endereco: RESOLUCAO_15_2021,
	},
	menorPreco: {
		norma: "Resolução CD/FNDE nº 15/2021, art. 23, § 2º",
		trecho: "Compra feita com base no menor preço por item ou lote.",
		endereco: RESOLUCAO_15_2021,
	},
	menosDeTresOrcamentos: {
		norma: "Resolução CD/FNDE nº 15/2021, art. 23, § 6º",
		trecho: "Menos de três orçamentos só com justificativa aprovada pela UEx.",
		endereco: RESOLUCAO_15_2021,
	},
	empateNoPreco: {
		norma: "Resolução CD/FNDE nº 15/2021, art. 23, § 8º",
		trecho: "Empate é desfeito por sorteio em ato público.",
		endereco: RESOLUCAO_15_2021,
	},
	livroEhConsumo: {
		norma: "Lei nº 10.753/2003, art. 18",
		trecho: "O livro não é considerado material permanente.",
		endereco: LEI_10_753_2003,
	},
} satisfies Record<string, Fonte>;

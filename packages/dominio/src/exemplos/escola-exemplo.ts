import type { Necessidade } from "../plano/plano";
import { dividirPeloPercentualPadrao } from "../regras/regras";

export const ESCOLA_EXEMPLO = {
	nome: "EMEF Professora Teruyo Kikuta",
	codigoInep: "35079923",
	municipio: "Adamantina/SP",
	saldo: dividirPeloPercentualPadrao(1_979_915),
	exercicioDoSaldo: 2026,
	saldoColetadoEm: new Date("2026-11-18T00:00:00-03:00"),
	fonteDoSaldo:
		"PDDE Info (FNDE), saldo das contas do PDDE coletado em 18 de novembro de 2026 e guardado para a demonstração. Custeio e capital divididos pelo percentual padrão de 80% e 20%.",
	enderecoDaFonte: "https://www.fnde.gov.br/pddeinfo/pddeinfo/escola/consultar?ano=2026&co_escola=35079923&consultar=Consultar",
};

export function ehEscolaDeDemonstracao(codigoInep: string): boolean {
	return codigoInep === ESCOLA_EXEMPLO.codigoInep;
}

export const NECESSIDADES_EXEMPLO: Necessidade[] = [
	{
		id: "livros",
		descricao: "Livros de literatura para a biblioteca",
		tipo: "livro",
		quantidade: 1,
		prioridade: 1,
		cotacoes: [
			{ fornecedor: "Livraria A", valorEmCentavos: 498_000 },
			{ fornecedor: "Livraria B", valorEmCentavos: 524_000 },
			{ fornecedor: "Livraria C", valorEmCentavos: 541_500 },
		],
	},
	{
		id: "roteador",
		descricao: "Roteador Wi-Fi 6",
		tipo: "material permanente",
		quantidade: 2,
		prioridade: 2,
		cotacoes: [
			{ fornecedor: "Loja A", valorEmCentavos: 129_000 },
			{ fornecedor: "Loja B", valorEmCentavos: 134_800 },
			{ fornecedor: "Loja C", valorEmCentavos: 141_590 },
		],
	},
	{
		id: "material-pedagogico",
		descricao: "Material pedagógico para o 1º ano",
		tipo: "material de consumo",
		quantidade: 1,
		prioridade: 3,
		cotacoes: [
			{ fornecedor: "Papelaria A", valorEmCentavos: 312_000 },
			{ fornecedor: "Papelaria B", valorEmCentavos: 326_000 },
			{ fornecedor: "Papelaria C", valorEmCentavos: 339_900 },
		],
	},
	{
		id: "janelas",
		descricao: "Reparo das janelas da sala 3",
		tipo: "pequeno reparo",
		quantidade: 1,
		prioridade: 4,
		cotacoes: [
			{ fornecedor: "Vidraçaria A", valorEmCentavos: 275_000 },
			{ fornecedor: "Vidraçaria B", valorEmCentavos: 290_000 },
			{ fornecedor: "Vidraçaria C", valorEmCentavos: 310_000 },
		],
	},
	{
		id: "projetor",
		descricao: "Projetor para a sala de leitura",
		tipo: "material permanente",
		quantidade: 1,
		prioridade: 5,
		cotacoes: [
			{ fornecedor: "Loja A", valorEmCentavos: 189_000 },
			{ fornecedor: "Loja B", valorEmCentavos: 199_000 },
			{ fornecedor: "Loja C", valorEmCentavos: 205_000 },
		],
	},
	{
		id: "conta-de-luz",
		descricao: "Conta de luz de dezembro",
		tipo: "conta de consumo",
		quantidade: 1,
		prioridade: 6,
		cotacoes: [{ fornecedor: "Distribuidora de energia", valorEmCentavos: 84_000 }],
	},
];

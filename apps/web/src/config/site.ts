const URL_PADRAO = "http://localhost:3000";
const URL_DA_VERCEL = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE = {
	nome: "Aloca",
	slogan: "Nenhuma escola perde o que já é dela.",
	descricao:
		"O Aloca ajuda o diretor e a APM a transformar o saldo do PDDE em compra antes do prazo, com plano de compra dentro das regras, três preços por item e ata pronta para assinar.",
	url: process.env.NEXT_PUBLIC_SITE_URL || (URL_DA_VERCEL ? `https://${URL_DA_VERCEL}` : URL_PADRAO),
	idioma: "pt-BR",
	localidade: "pt_BR",
	palavrasChave: [
		"PDDE",
		"Programa Dinheiro Direto na Escola",
		"plano de compra",
		"estorno do PDDE",
		"saldo do PDDE",
		"APM",
		"Unidade Executora",
		"FNDE",
		"gestão escolar",
		"Hack Brasil",
	],
	autores: ["Guilherme Carvalho Mais", "Gabriel Duarte Frias", "João Gabriel Breganon Ferreira"],
	corDoTema: "#0b0f1c",
} as const;

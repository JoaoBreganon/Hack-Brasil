export const PAPEIS_DO_CONTATO = ["diretor", "tesoureiro"] as const;

export type PapelDoContato = (typeof PAPEIS_DO_CONTATO)[number];

export const ROTULO_DO_PAPEL: Record<PapelDoContato, string> = {
	diretor: "Diretor ou diretora",
	tesoureiro: "Tesoureiro ou tesoureira da APM",
};

const LIMITES_DO_NOME = { minimo: 2, maximo: 80 } as const;
const CODIGO_DO_PAIS = "55";
const CELULAR_SEM_PAIS = /^[1-9][1-9]9\d{8}$/;

export function normalizarCelular(texto: string): string | null {
	const digitos = texto.replace(/\D/g, "");
	const semPais = digitos.length === 13 && digitos.startsWith(CODIGO_DO_PAIS) ? digitos.slice(2) : digitos;
	return CELULAR_SEM_PAIS.test(semPais) ? `${CODIGO_DO_PAIS}${semPais}` : null;
}

export function mascararCelular(celular: string): string {
	const semPais = celular.slice(CODIGO_DO_PAIS.length);
	return `(${semPais.slice(0, 2)}) •••••-${semPais.slice(-4)}`;
}

export function validarNomeDoContato(texto: string): string | null {
	const nome = texto.replace(/\s+/g, " ").trim();
	return nome.length >= LIMITES_DO_NOME.minimo && nome.length <= LIMITES_DO_NOME.maximo ? nome : null;
}

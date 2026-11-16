import type { Saldo } from "../regras/regras";

const FORMATO_DO_CODIGO_INEP = /^\d{8}$/;

export type Escola = {
	codigoInep: string;
	nome: string;
	municipio: string;
};

export type FonteDoDado = {
	nome: string;
	endereco?: string;
};

export type RegistroDeSaldo = {
	codigoInep: string;
	exercicio: number;
	saldo: Saldo;
	fonte: FonteDoDado;
	coletadoEm: Date;
};

export function ehCodigoInepValido(codigo: string): boolean {
	return FORMATO_DO_CODIGO_INEP.test(codigo);
}

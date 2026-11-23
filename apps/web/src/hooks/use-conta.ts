"use client";

import { createContext, useContext } from "react";

export type Conta = {
	configurada: boolean;
	carregando: boolean;
	usuario: { nome: string } | null;
};

export const ContextoDaConta = createContext<Conta>({ configurada: false, carregando: false, usuario: null });

export function useConta(): Conta {
	return useContext(ContextoDaConta);
}

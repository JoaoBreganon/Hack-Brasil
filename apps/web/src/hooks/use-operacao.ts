"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { mensagemDoErro } from "@/lib/erros";

export function useOperacao<Argumentos extends unknown[], Resultado>(operacao: (...argumentos: Argumentos) => Promise<Resultado>) {
	const [executando, setExecutando] = useState(false);

	const executar = useCallback(
		async (...argumentos: Argumentos): Promise<Resultado | undefined> => {
			setExecutando(true);
			try {
				return await operacao(...argumentos);
			} catch (erro) {
				toast.error(mensagemDoErro(erro));
				return undefined;
			} finally {
				setExecutando(false);
			}
		},
		[operacao],
	);

	return { executar, executando };
}

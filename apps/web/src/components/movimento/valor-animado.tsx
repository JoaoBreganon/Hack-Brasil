"use client";

import { formatarReais } from "@aloca/dominio";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

const DURACAO_EM_MS = 900;

function desacelerar(progresso: number): number {
	return 1 - (1 - progresso) ** 4;
}

export function ValorAnimado({ centavos }: { centavos: number }) {
	const reduzir = useReducedMotion();
	const texto = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const elemento = texto.current;
		if (reduzir || !elemento) {
			return;
		}
		const inicio = performance.now();
		let quadro = 0;
		function desenhar(agora: number) {
			const progresso = Math.min(1, (agora - inicio) / DURACAO_EM_MS);
			if (elemento) {
				elemento.textContent = formatarReais(Math.round(centavos * desacelerar(progresso)));
			}
			if (progresso < 1) {
				quadro = requestAnimationFrame(desenhar);
			}
		}
		quadro = requestAnimationFrame(desenhar);
		return () => cancelAnimationFrame(quadro);
	}, [centavos, reduzir]);

	return (
		<>
			<span ref={texto} aria-hidden="true" className="tabular-nums">
				{formatarReais(centavos)}
			</span>
			<span className="sr-only">{formatarReais(centavos)}</span>
		</>
	);
}

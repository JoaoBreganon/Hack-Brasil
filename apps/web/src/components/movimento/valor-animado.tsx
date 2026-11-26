"use client";

import { formatarReais } from "@aloca/dominio";
import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

const DURACAO_EM_SEGUNDOS = 0.9;

export function ValorAnimado({ centavos }: { centavos: number }) {
	const reduzir = useReducedMotion();
	const texto = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const elemento = texto.current;
		if (reduzir || !elemento) {
			return;
		}
		const controle = animate(0, centavos, {
			duration: DURACAO_EM_SEGUNDOS,
			ease: [0.16, 1, 0.3, 1],
			onUpdate: (valor) => {
				elemento.textContent = formatarReais(Math.round(valor));
			},
		});
		return () => controle.stop();
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

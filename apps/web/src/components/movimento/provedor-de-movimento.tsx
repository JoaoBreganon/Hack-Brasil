"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

function carregarRecursos() {
	return import("./recursos").then((modulo) => modulo.default);
}

export function ProvedorDeMovimento({ children }: { children: ReactNode }) {
	return (
		<LazyMotion features={carregarRecursos} strict>
			<MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}>
				{children}
			</MotionConfig>
		</LazyMotion>
	);
}

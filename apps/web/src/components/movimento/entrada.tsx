"use client";

import { motion } from "motion/react";
import { Children, Fragment, isValidElement, type ReactNode } from "react";

const ATRASO_ENTRE_BLOCOS = 0.07;

function achatar(filhos: ReactNode): ReactNode[] {
	return Children.toArray(filhos).flatMap((filho) =>
		isValidElement<{ children?: ReactNode }>(filho) && filho.type === Fragment ? achatar(filho.props.children) : [filho],
	);
}

export function Entrada({ children }: { children: ReactNode }) {
	return achatar(children).map((filho, indice) => (
		<motion.div
			key={indice}
			initial={{ opacity: 0, y: 18 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: indice * ATRASO_ENTRE_BLOCOS }}
			className="min-w-0"
		>
			{filho}
		</motion.div>
	));
}

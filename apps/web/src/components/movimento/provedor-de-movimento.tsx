"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

export function ProvedorDeMovimento({ children }: { children: ReactNode }) {
	return (
		<MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}>
			{children}
		</MotionConfig>
	);
}

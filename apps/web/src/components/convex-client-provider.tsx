"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const ENDERECO_DO_CONVEX = process.env.NEXT_PUBLIC_CONVEX_URL;
const CLIENTE = ENDERECO_DO_CONVEX ? new ConvexReactClient(ENDERECO_DO_CONVEX) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
	if (!CLIENTE) {
		return children;
	}
	return <ConvexProvider client={CLIENTE}>{children}</ConvexProvider>;
}

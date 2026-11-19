import { defineConfig } from "vitest/config";

const IGNORADOS = ["**/node_modules/**"];

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: "dominio",
					include: ["apps/**/src/**/*.test.{ts,tsx}", "packages/**/src/**/*.test.{ts,tsx}"],
					exclude: IGNORADOS,
				},
			},
			{
				test: {
					name: "convex",
					include: ["convex/**/*.test.ts"],
					exclude: IGNORADOS,
					environment: "edge-runtime",
					server: { deps: { inline: ["convex-test"] } },
				},
			},
		],
	},
});

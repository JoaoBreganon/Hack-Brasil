import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["apps/**/src/**/*.test.{ts,tsx}", "convex/**/*.test.ts", "packages/**/src/**/*.test.{ts,tsx}"],
		exclude: ["**/node_modules/**"],
	},
});

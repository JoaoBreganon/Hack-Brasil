import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const ARQUIVO_DE_AMBIENTE = ".env.local";

if (existsSync(ARQUIVO_DE_AMBIENTE)) {
	process.loadEnvFile(ARQUIVO_DE_AMBIENTE);
}

const SITE_PUBLICADO = process.env.E2E_URL || undefined;
const PORTA = Number(process.env.E2E_PORTA) || 3000;
const NA_INTEGRACAO_CONTINUA = Boolean(process.env.CI);

if (!SITE_PUBLICADO && !process.env.NEXT_PUBLIC_CONVEX_URL) {
	throw new Error(
		"Os testes de ponta a ponta precisam de um Convex com as funções atuais. Rode pnpm convex:dev e confira NEXT_PUBLIC_CONVEX_URL no .env.local da raiz, ou aponte E2E_URL para um site publicado.",
	);
}

const ENDERECO = SITE_PUBLICADO ?? `http://localhost:${PORTA}`;

export default defineConfig({
	testDir: "e2e",
	fullyParallel: false,
	workers: 1,
	forbidOnly: NA_INTEGRACAO_CONTINUA,
	retries: NA_INTEGRACAO_CONTINUA ? 1 : 0,
	timeout: 180_000,
	expect: { timeout: 20_000 },
	reporter: [[NA_INTEGRACAO_CONTINUA ? "github" : "list"], ["html", { open: "never" }]],
	use: {
		baseURL: ENDERECO,
		locale: "pt-BR",
		timezoneId: "America/Sao_Paulo",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: SITE_PUBLICADO
		? undefined
		: {
				command: `pnpm --filter web exec next dev --port ${PORTA}`,
				url: ENDERECO,
				reuseExistingServer: !NA_INTEGRACAO_CONTINUA,
				timeout: 180_000,
			},
});

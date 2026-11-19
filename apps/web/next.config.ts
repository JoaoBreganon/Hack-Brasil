import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

const RAIZ_DO_REPOSITORIO = path.resolve(process.cwd(), "../..");
const EM_DESENVOLVIMENTO = process.env.NODE_ENV === "development";
const INEP_DA_DEMONSTRACAO = "35079923";

loadEnvConfig(RAIZ_DO_REPOSITORIO);

function origensDoConvex(): string {
	const endereco = process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!endereco) {
		return "";
	}
	const { origin, protocol, host } = new URL(endereco);
	return ` ${origin} ${protocol === "https:" ? "wss" : "ws"}://${host}`;
}

const POLITICA_DE_CONTEUDO = [
	"default-src 'self'",
	`script-src 'self' 'unsafe-inline'${EM_DESENVOLVIMENTO ? " 'unsafe-eval'" : ""}`,
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob:",
	"font-src 'self'",
	`connect-src 'self' https://*.convex.cloud wss://*.convex.cloud${origensDoConvex()}${EM_DESENVOLVIMENTO ? " ws:" : ""}`,
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	"frame-ancestors 'none'",
].join("; ");

const CABECALHOS_DE_SEGURANCA = [
	{ key: "Content-Security-Policy", value: POLITICA_DE_CONTEUDO },
	{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
	{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
	agentRules: false,
	poweredByHeader: false,
	cacheComponents: true,
	partialPrefetching: true,
	transpilePackages: ["@aloca/dominio"],
	turbopack: {
		rules: {
			"*.css": {
				loaders: ["@tailwindcss/turbopack"],
				as: "*.css",
			},
		},
	},
	async redirects() {
		return [{ source: "/plano", destination: `/escola/${INEP_DA_DEMONSTRACAO}/plano`, permanent: false }];
	},
	async headers() {
		return [{ source: "/:path*", headers: CABECALHOS_DE_SEGURANCA }];
	},
};

export default nextConfig;

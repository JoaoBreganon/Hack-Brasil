import type { AuthConfig } from "convex/server";

const ID_DO_CLIENTE = process.env.WORKOS_CLIENT_ID;
const CHAVES = `https://api.workos.com/sso/jwks/${ID_DO_CLIENTE}`;

export default {
	providers: ID_DO_CLIENTE
		? [
				{ type: "customJwt", issuer: "https://api.workos.com/", algorithm: "RS256", jwks: CHAVES, applicationID: ID_DO_CLIENTE },
				{ type: "customJwt", issuer: `https://api.workos.com/user_management/${ID_DO_CLIENTE}`, algorithm: "RS256", jwks: CHAVES },
			]
		: [],
} satisfies AuthConfig;

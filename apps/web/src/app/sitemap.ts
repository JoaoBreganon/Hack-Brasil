import type { MetadataRoute } from "next";
import { enderecoDaPaginaPublica } from "@/config/navegacao";
import { SITE } from "@/config/site";
import { escolasPublicadas } from "@/lib/pagina-publica";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const escolas = await escolasPublicadas();
	return [
		{ url: SITE.url, changeFrequency: "weekly", priority: 1 },
		{ url: `${SITE.url}/entrar`, changeFrequency: "monthly", priority: 0.8 },
		...escolas.map(({ codigoInep, publicadaEm }) => ({
			url: `${SITE.url}${enderecoDaPaginaPublica(codigoInep)}`,
			lastModified: new Date(publicadaEm),
			changeFrequency: "weekly" as const,
			priority: 0.6,
		})),
	];
}

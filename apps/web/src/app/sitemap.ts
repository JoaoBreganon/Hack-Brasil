import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{ url: SITE.url, changeFrequency: "weekly", priority: 1 },
		{ url: `${SITE.url}/plano`, changeFrequency: "weekly", priority: 0.8 },
	];
}

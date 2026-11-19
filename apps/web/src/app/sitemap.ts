import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{ url: SITE.url, changeFrequency: "weekly", priority: 1 },
		{ url: `${SITE.url}/entrar`, changeFrequency: "monthly", priority: 0.8 },
	];
}

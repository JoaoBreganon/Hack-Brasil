import { SITE } from "@/config/site";

const DADOS = {
	"@context": "https://schema.org",
	"@type": "WebApplication",
	name: SITE.nome,
	slogan: SITE.slogan,
	description: SITE.descricao,
	url: SITE.url,
	inLanguage: SITE.idioma,
	applicationCategory: "EducationalApplication",
	operatingSystem: "Web",
	author: SITE.autores.map((nome) => ({ "@type": "Person", name: nome })),
};

const JSON_SEGURO = JSON.stringify(DADOS).replace(/</g, "\\u003c");

export function DadosEstruturados() {
	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_SEGURO }} />;
}

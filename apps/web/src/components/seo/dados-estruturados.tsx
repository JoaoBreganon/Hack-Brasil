import { SITE } from "@/config/site";
import { JsonLd } from "./json-ld";

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

export function DadosEstruturados() {
	return <JsonLd dados={DADOS} />;
}

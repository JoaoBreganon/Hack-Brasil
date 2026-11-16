import type { Categoria } from "@aloca/dominio";

const ESTILO: Record<Categoria, { rotulo: string; classe: string }> = {
	custeio: { rotulo: "Custeio", classe: "bg-custeio-fundo text-custeio" },
	capital: { rotulo: "Capital", classe: "bg-capital-fundo text-capital" },
};

export function SeloDeCategoria({ categoria }: { categoria: Categoria }) {
	const { rotulo, classe } = ESTILO[categoria];
	return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${classe}`}>{rotulo}</span>;
}

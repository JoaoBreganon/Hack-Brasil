import type { NivelNaRede } from "@aloca/dominio";
import { cn } from "cn";

const ROTULO: Record<NivelNaRede, string> = {
	urgente: "Urgente",
	perdido: "Prazo acabou",
	atenção: "Atenção",
	"em dia": "Em dia",
	"sem prazo": "Sem prazo",
	"sem dados": "Sem saldo buscado",
	"sem saldo": "Tudo no plano",
};

const ESTILO: Record<NivelNaRede, string> = {
	urgente: "bg-perigo-fundo text-perigo",
	perdido: "bg-perigo-fundo text-perigo",
	atenção: "bg-ambar/10 text-ambar",
	"em dia": "bg-pilula text-foreground",
	"sem prazo": "bg-pilula text-muted-foreground",
	"sem dados": "bg-pilula text-muted-foreground",
	"sem saldo": "bg-azul-fundo text-azul-texto",
};

export function SituacaoDaEscola({ nivel }: { nivel: NivelNaRede }) {
	return (
		<span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium whitespace-nowrap", ESTILO[nivel])}>
			{ROTULO[nivel]}
		</span>
	);
}

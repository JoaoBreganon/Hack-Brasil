import { XIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { enderecoDaArea } from "@/config/navegacao";

export function FecharPainel({ codigoInep, rotulo }: { codigoInep: string; rotulo: string }) {
	return (
		<Link
			href={enderecoDaArea(codigoInep, "compras")}
			scroll={false}
			aria-label={rotulo}
			className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "-mt-1 -mr-2 text-muted-foreground" })}
		>
			<XIcon />
		</Link>
	);
}

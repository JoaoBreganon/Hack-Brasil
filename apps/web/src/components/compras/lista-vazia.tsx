"use client";

import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { enderecoDaArea, ITEM_NOVO } from "@/config/navegacao";
import { useOperacao } from "@/hooks/use-operacao";

export function ListaVazia({ codigoInep }: { codigoInep: string }) {
	const preencher = useOperacao(useMutation(api.itens.preencherComExemplo));

	return (
		<Empty className="rounded-lg border border-border bg-card py-14">
			<EmptyHeader>
				<EmptyTitle className="text-lg font-semibold">Nenhum item ainda</EmptyTitle>
				<EmptyDescription>Comece pelo que a escola mais precisa. Para conhecer o Aloca, use a lista de exemplo.</EmptyDescription>
			</EmptyHeader>
			<EmptyContent className="flex-row flex-wrap justify-center">
				<Link href={enderecoDaArea(codigoInep, "compras", { item: ITEM_NOVO })} scroll={false} className={buttonVariants()}>
					<PlusIcon data-icon="inline-start" />
					Novo item
				</Link>
				<Button variant="secondary" onClick={() => preencher.executar({ codigoInep })} disabled={preencher.executando}>
					{preencher.executando && <Spinner data-icon="inline-start" />}
					Usar a lista de exemplo
				</Button>
			</EmptyContent>
		</Empty>
	);
}

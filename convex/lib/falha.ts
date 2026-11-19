import { ConvexError } from "convex/values";

export function falhar(mensagem: string): never {
	throw new ConvexError(mensagem);
}

export function mensagemDoErro(erro: unknown): string {
	if (erro instanceof ConvexError && typeof erro.data === "string") {
		return erro.data;
	}
	return erro instanceof Error ? erro.message : String(erro);
}

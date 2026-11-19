import { ConvexError } from "convex/values";

const MENSAGEM_PADRAO = "Algo deu errado. Tente de novo em instantes.";

export function mensagemDoErro(erro: unknown): string {
	return erro instanceof ConvexError && typeof erro.data === "string" ? erro.data : MENSAGEM_PADRAO;
}

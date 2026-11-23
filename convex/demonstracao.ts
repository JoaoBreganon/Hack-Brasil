import { ESCOLA_EXEMPLO } from "@aloca/dominio";
import { internalMutation } from "./_generated/server";
import { buscarEscola } from "./escolas";
import { itensComOrcamentos } from "./lib/plano";

const INATIVIDADE_PARA_RESTAURAR_EM_MS = 60 * 60_000;

export const restaurar = internalMutation({
	args: {},
	handler: async (ctx): Promise<boolean> => {
		const escola = await buscarEscola(ctx, ESCOLA_EXEMPLO.codigoInep);
		if (!escola) {
			return false;
		}
		const [planos, contatos] = await Promise.all([
			ctx.db
				.query("plano")
				.withIndex("por_escola_exercicio", (q) => q.eq("escolaId", escola._id))
				.collect(),
			ctx.db
				.query("contato")
				.withIndex("por_escola_papel", (q) => q.eq("escolaId", escola._id))
				.collect(),
		]);
		const itens = (await Promise.all(planos.map(({ _id }) => itensComOrcamentos(ctx, _id)))).flat();
		const ultimaMudanca = Math.max(
			0,
			...planos.flatMap((plano) => [plano._creationTime, plano.aprovadoEm ?? 0, plano.sugestaoComIaEm ?? 0]),
			...itens.flatMap((item) => [
				item._creationTime,
				item.buscaDePrecoEm ?? 0,
				...item.orcamentos.map(({ _creationTime }) => _creationTime),
			]),
		);
		if ((planos.length === 0 && contatos.length === 0) || Date.now() - ultimaMudanca < INATIVIDADE_PARA_RESTAURAR_EM_MS) {
			return false;
		}
		const orcamentos = itens.flatMap(({ orcamentos }) => orcamentos);
		await Promise.all([...orcamentos, ...itens, ...planos, ...contatos].map(({ _id }) => ctx.db.delete(_id)));
		return true;
	},
});

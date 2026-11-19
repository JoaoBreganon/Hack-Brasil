import { v } from "convex/values";
import { query } from "./_generated/server";
import { buscarEscola } from "./escolas";
import { buscarPlano, itensComOrcamentos } from "./lib/plano";
import { buscarSaldoAtual } from "./saldos";

export const daEscola = query({
	args: { codigoInep: v.string() },
	handler: async (ctx, { codigoInep }) => {
		const escola = await buscarEscola(ctx, codigoInep);
		if (!escola) {
			return null;
		}
		const [saldo, plano] = await Promise.all([buscarSaldoAtual(ctx, escola._id), buscarPlano(ctx, escola._id)]);
		const itens = plano ? await itensComOrcamentos(ctx, plano._id) : [];
		return {
			escola: { codigoInep: escola.codigoInep, nome: escola.nome, municipio: escola.municipio },
			saldo: saldo && {
				exercicio: saldo.exercicio,
				saldo: saldo.saldo,
				fonte: saldo.fonte,
				coletadoEm: saldo.coletadoEm,
				pendencias: saldo.pendencias ?? [],
			},
			plano: plano && { status: plano.status, aprovadoEm: plano.aprovadoEm ?? null },
			itens: itens.map((item) => ({
				_id: item._id,
				descricao: item.descricao,
				tipo: item.tipo,
				quantidade: item.quantidade,
				prioridade: item.prioridade,
				justificativa: item.justificativaParaMenosOrcamentos ?? null,
				buscaDePrecoEm: item.buscaDePrecoEm ?? null,
				orcamentos: item.orcamentos.map((orcamento) => ({
					_id: orcamento._id,
					fornecedor: orcamento.fornecedor,
					valorEmCentavos: orcamento.valorEmCentavos,
					endereco: orcamento.endereco ?? null,
					origem: orcamento.origem,
				})),
			})),
		};
	},
});

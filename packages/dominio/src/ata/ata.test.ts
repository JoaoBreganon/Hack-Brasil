import { describe, expect, it } from "vitest";
import { criarData } from "../calendario/calendario";
import { NECESSIDADES_EXEMPLO } from "../exemplos/escola-exemplo";
import { montarPlanoDeCompra } from "../plano/plano";
import { montarAta } from "./ata";

const ESCOLA = { codigoInep: "35079923", nome: "EMEF Professora Teruyo Kikuta", municipio: "Adamantina/SP" };

describe("montarAta", () => {
	const plano = montarPlanoDeCompra({ custeio: 1_500_000, capital: 400_000 }, NECESSIDADES_EXEMPLO);
	const ata = montarAta({ escola: ESCOLA, exercicio: 2027, plano, data: criarData(2027, 12, 15) });

	it("abre com a data, a escola e o exercício", () => {
		expect(ata.abertura).toContain("15 de dezembro de 2027");
		expect(ata.abertura).toContain("INEP 35079923");
		expect(ata.titulo).toContain("2027");
	});

	it("lista só os itens do plano com o fornecedor de menor preço", () => {
		expect(ata.itens.map(({ descricao }) => descricao)).toEqual(plano.itens.map(({ necessidade }) => necessidade.descricao));
		expect(ata.itens[0]).toMatchObject({ fornecedor: "Livraria A", valorUnitarioEmCentavos: 498_000, categoria: "custeio" });
	});

	it("fecha os totais por categoria", () => {
		expect(ata.total.geral).toBe(ata.total.custeio + ata.total.capital);
		expect(ata.total.geral).toBe(ata.itens.reduce((soma, { totalEmCentavos }) => soma + totalEmCentavos, 0));
	});

	it("marca uma vencedora por item no mapa de preços", () => {
		for (const linha of ata.mapaDePrecos) {
			expect(linha.cotacoes.filter(({ vencedora }) => vencedora)).toHaveLength(1);
			expect(linha.cotacoes[0].vencedora).toBe(true);
		}
	});
});

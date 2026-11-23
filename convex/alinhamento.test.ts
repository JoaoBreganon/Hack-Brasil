import type {
	CanalDoAlerta,
	Cotacao,
	Escola,
	Necessidade,
	NivelDeRisco,
	OrigemDoOrcamento,
	PapelDoContato,
	PendenciaDoPdde,
	RegistroDeSaldo,
	StatusDoPlano,
} from "@aloca/dominio";
import { describe, expectTypeOf, it } from "vitest";
import type { Doc } from "./_generated/dataModel";

type Campos<Tabela> = Omit<Tabela, "_id" | "_creationTime">;

describe("schema do Convex alinhado com @aloca/dominio", () => {
	it("escola e saldo guardam os mesmos campos do domínio", () => {
		expectTypeOf<Omit<Campos<Doc<"escola">>, "envioManualEm">>().toEqualTypeOf<Escola>();
		expectTypeOf<Doc<"saldo">["saldo"]>().toEqualTypeOf<RegistroDeSaldo["saldo"]>();
		expectTypeOf<Doc<"saldo">["fonte"]>().toEqualTypeOf<RegistroDeSaldo["fonte"]>();
	});

	it("item e orçamento cobrem a necessidade e a cotação", () => {
		expectTypeOf<Omit<Campos<Doc<"item">>, "planoId" | "buscaDePrecoEm">>().toEqualTypeOf<Omit<Necessidade, "id" | "cotacoes">>();
		expectTypeOf<Omit<Campos<Doc<"orcamento">>, "itemId" | "coletadoEm" | "origem">>().toEqualTypeOf<Cotacao>();
	});

	it("plano e alerta usam os mesmos valores do domínio", () => {
		expectTypeOf<Doc<"plano">["status"]>().toEqualTypeOf<StatusDoPlano>();
		expectTypeOf<Doc<"alerta">["nivel"]>().toEqualTypeOf<NivelDeRisco>();
		expectTypeOf<NonNullable<Doc<"alerta">["canal"]>>().toEqualTypeOf<CanalDoAlerta>();
		expectTypeOf<Doc<"contato">["papel"]>().toEqualTypeOf<PapelDoContato>();
		expectTypeOf<Doc<"orcamento">["origem"]>().toEqualTypeOf<OrigemDoOrcamento>();
		expectTypeOf<NonNullable<Doc<"saldo">["pendencias"]>[number]>().toEqualTypeOf<PendenciaDoPdde>();
	});
});

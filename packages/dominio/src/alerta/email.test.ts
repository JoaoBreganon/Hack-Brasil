import { describe, expect, it } from "vitest";
import { criarData } from "../calendario/calendario";
import { formatarReais } from "../formato/formatar";
import { escaparHtml, montarEmailDoAlerta } from "./email";

const DADOS = {
	nomeDaEscola: "EMEF Professora Teruyo Kikuta",
	diasUteisRestantes: 12,
	saldoEmRiscoEmCentavos: 1_979_915,
	limiteParaUso: criarData(2028, 2, 14),
};

describe("montarEmailDoAlerta", () => {
	it("diz quanto, quando e o que fazer, no assunto e no corpo", () => {
		const email = montarEmailDoAlerta(DADOS, "https://aloca.app/escola/35079923/plano");
		expect(email.assunto).toBe(`PDDE da EMEF Professora Teruyo Kikuta: 12 dias úteis para usar ${formatarReais(1_979_915)}`);
		expect(email.texto).toContain("14 de fevereiro de 2028");
		expect(email.texto).toContain("https://aloca.app/escola/35079923/plano");
		expect(email.html).toContain('href="https://aloca.app/escola/35079923/plano"');
	});

	it("trata o singular e funciona sem o endereço do plano", () => {
		const email = montarEmailDoAlerta({ ...DADOS, diasUteisRestantes: 1 });
		expect(email.assunto).toContain("1 dia útil");
		expect(email.html).not.toContain("<a ");
	});

	it("escapa o nome da escola, que vem de fora", () => {
		const email = montarEmailDoAlerta({ ...DADOS, nomeDaEscola: 'Escola <img src=x onerror="alert(1)">\n' });
		expect(email.html).not.toContain("<img");
		expect(email.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
		expect(email.assunto).not.toContain("\n");
	});
});

describe("escaparHtml", () => {
	it("troca os cinco caracteres especiais", () => {
		expect(escaparHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
	});
});

import { expect, type Page, test } from "@playwright/test";

const INEP_DA_DEMONSTRACAO = "35079923";
const INEP_SEM_SALDO = `99${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`;
const NOME_DA_ESCOLA = /teruyo kikuta/i;
const AVISO_DA_BUSCA = /preços? de exemplo, só para ilustrar|preços? novos? achados? em lojas da internet/;

function enderecoDaEscola(caminho = "", codigoInep = INEP_DA_DEMONSTRACAO) {
	return caminho ? `/escola/${codigoInep}/${caminho}` : `/escola/${codigoInep}`;
}

function titulo(page: Page, nome: string) {
	return page.getByRole("heading", { name: nome, level: 1 });
}

test.describe.configure({ mode: "serial" });

test("vai da página inicial ao código INEP da escola de demonstração", async ({ page }) => {
	await page.goto("/");
	await expect(titulo(page, "Nenhuma escola perde o que já é dela.")).toBeVisible();
	await page.getByRole("link", { name: "Começar pelo código INEP" }).click();

	await expect(page).toHaveURL(/\/entrar$/);
	await expect(titulo(page, "Qual é a sua escola?")).toBeVisible();
	const campo = page.getByLabel("Código INEP");
	await campo.fill("1234");
	await page.getByRole("button", { name: "Ver o saldo da escola" }).click();
	await expect(page.getByText("O código INEP tem 8 números.")).toBeVisible();

	await campo.fill(INEP_DA_DEMONSTRACAO);
	await page.getByRole("button", { name: "Ver o saldo da escola" }).click();
	const menu = page.getByRole("navigation", { name: "Áreas da escola" });
	const planilha = page.getByRole("link", { name: "Importar a planilha CSV" });
	await expect(menu.or(planilha)).toBeVisible({ timeout: 90_000 });
	if (await planilha.isVisible()) {
		await planilha.click();
	}

	await expect(page).toHaveURL(new RegExp(`/escola/${INEP_DA_DEMONSTRACAO}$`));
	await expect(page.getByText(`INEP ${INEP_DA_DEMONSTRACAO}`)).toBeVisible();
	await expect(titulo(page, "Início").or(titulo(page, "Ainda não temos o saldo desta escola"))).toBeVisible();
});

test("pede login para importar a planilha de uma escola sem saldo", async ({ page }) => {
	await page.goto(enderecoDaEscola("", INEP_SEM_SALDO));
	await expect(titulo(page, "Ainda não temos o saldo desta escola")).toBeVisible();
	await expect(page.getByText(/entre com sua conta|precisa de login/)).toBeVisible();
	const importar = page.getByRole("button", { name: "Importar planilha CSV" });
	await expect(importar.or(page.getByRole("link", { name: "Entrar para importar" }))).toBeVisible();
	if (await importar.isVisible()) {
		await expect(importar).toBeDisabled();
	}
});

test("recomeça a demonstração e mostra o saldo e o prazo no Início", async ({ page }) => {
	await page.goto(enderecoDaEscola());
	await expect(titulo(page, "Início")).toBeVisible({ timeout: 90_000 });
	await expect(page.getByRole("note").filter({ hasText: "Escola de demonstração" })).toBeVisible();
	await page.getByRole("button", { name: "Recomeçar a demonstração" }).click();
	await expect(page.getByText("A demonstração voltou ao começo.")).toBeVisible();

	await expect(page.getByRole("navigation", { name: "Áreas da escola" })).toBeVisible();
	await expect(page.getByText(NOME_DA_ESCOLA).first()).toBeVisible();
	await expect(page.getByRole("heading", { name: /dias úteis para usar o saldo/ })).toBeVisible();
	await expect(page.getByRole("table").first()).toBeVisible();
	await expect(page.getByText("último dia para usar o saldo").first()).toBeAttached();
	await expect(page.getByRole("region", { name: "Ainda sem destino" })).toContainText(/19\.799,15/);
});

test("monta as compras, barra o item vedado e junta os orçamentos", async ({ page }) => {
	await page.goto(enderecoDaEscola("compras"));
	await expect(page.getByText("Nenhum item ainda")).toBeVisible();
	await page.getByRole("button", { name: "Usar a lista de exemplo" }).click();

	const itens = page.getByRole("region", { name: "Itens" });
	await expect(itens.getByRole("listitem")).toHaveCount(6);
	const contaDeLuz = itens.getByRole("link", { name: /Conta de luz de dezembro/ });
	await expect(contaDeLuz).toContainText("Vedado");
	await contaDeLuz.click();
	await expect(page.getByText("O PDDE não paga conta de consumo. Este item fica fora do plano.")).toBeVisible();
	await expect(page.getByRole("button", { name: "Buscar preços" })).toBeDisabled();
	await page.getByRole("button", { name: /^Fora do plano/ }).click();
	await expect(itens.getByRole("link", { name: /Conta de luz de dezembro/ })).toBeVisible();
	await page.getByRole("button", { name: /^Todos/ }).click();

	await page.getByRole("link", { name: "Novo item" }).click();
	await page.getByLabel("O que comprar").fill("Ventilador de parede para a sala 2");
	await page.getByLabel("Tipo de despesa").selectOption("material permanente");
	await page.getByLabel("Quantidade").fill("2");
	await page.getByRole("button", { name: "Adicionar item" }).click();
	await expect(page.getByRole("heading", { name: "Ventilador de parede para a sala 2", level: 2 })).toBeVisible();

	await page.getByRole("button", { name: "Buscar preços" }).click();
	await expect(page.getByText(AVISO_DA_BUSCA)).toBeVisible({ timeout: 150_000 });
	const orcamentos = page.getByRole("list", { name: "Orçamentos, do menor para o maior" });
	await expect(orcamentos.getByRole("listitem").first()).toBeVisible();
	await expect(orcamentos).toContainText(/Orçamento de exemplo|Achado na internet/);
	await expect(orcamentos).toContainText("menor preço");

	await page.getByRole("link", { name: "Sugerir itens" }).click();
	await page.getByLabel("O que a escola precisa?").fill("A biblioteca tem poucos livros e as salas ficam quentes à tarde.");
	await page.getByRole("button", { name: "Sugerir itens" }).click();
	await expect(page.getByRole("heading", { name: /entr(ou|aram) na lista/ })).toBeVisible({ timeout: 90_000 });
});

test("revisa os totais e aprova o plano de compra", async ({ page }) => {
	await page.goto(enderecoDaEscola("plano"));
	await expect(titulo(page, "Plano de compra")).toBeVisible();
	await expect(page.getByText("Total do plano")).toBeVisible();

	const entram = page.getByRole("region", { name: "Entram no plano" });
	await expect(entram).toContainText("Livros de literatura para a biblioteca");
	await expect(entram).toContainText("Rascunho, ainda não aprovado");
	await expect(page.getByRole("region", { name: "Ficam de fora" })).toContainText("Conta de luz de dezembro");

	await page.getByRole("button", { name: "Aprovar o plano" }).click();
	await expect(page.getByText("A APM aprovou em reunião?")).toBeVisible();
	await page.getByRole("button", { name: "Sim, aprovar" }).click();
	await expect(page.getByText("Plano aprovado. A ata está pronta.")).toBeVisible();
	await expect(entram).toContainText("Aprovado pela APM");
	await expect(page.getByRole("button", { name: "Reabrir" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Abrir a ata" })).toBeVisible();
});

test("mostra a ata da APM com o mapa de preços pronta para imprimir", async ({ page }) => {
	await page.goto(enderecoDaEscola("ata"));
	await expect(titulo(page, "Ata da APM")).toBeVisible();

	const ata = page.getByRole("article", { name: /Ata de aprovação do plano de compra do PDDE/ });
	await expect(ata).toContainText(/APM da .*teruyo kikuta/i);
	await expect(ata).toContainText("Livros de literatura para a biblioteca");
	await expect(ata).not.toContainText("Rascunho");
	await expect(ata.getByRole("heading", { name: "Mapa de preços" })).toBeVisible();
	await expect(ata).toContainText("(escolhido)");
	await expect(page.getByRole("button", { name: "Imprimir ou salvar em PDF" })).toBeVisible();

	await page.emulateMedia({ media: "print" });
	await expect(ata).toBeVisible();
	await expect(page.getByRole("navigation", { name: "Áreas da escola" })).toBeHidden();
});

test("mostra quem recebe e a mensagem dos alertas de prazo", async ({ page }) => {
	await page.goto(enderecoDaEscola("alertas"));
	await expect(titulo(page, "Alertas de prazo")).toBeVisible();
	await expect(page.getByRole("region", { name: "Quem recebe" })).toContainText(
		"Na escola de demonstração não dá para cadastrar contatos",
	);
	await expect(page.getByRole("region", { name: "A mensagem" })).toContainText(NOME_DA_ESCOLA);
	await expect(page.getByRole("button", { name: "Enviar um teste agora" })).toHaveCount(0);
});

test.describe("no celular", () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test("abre e fecha o menu das áreas da escola", async ({ page }) => {
		await page.goto(enderecoDaEscola());
		const areas = page.getByRole("navigation", { name: "Áreas da escola" });
		await expect(page.getByRole("button", { name: "Abrir o menu" })).toBeVisible();
		await expect(areas).toBeHidden();

		await page.getByRole("button", { name: "Abrir o menu" }).click();
		await expect(page.getByRole("button", { name: "Fechar o menu" })).toHaveAttribute("aria-expanded", "true");
		await expect(areas).toBeVisible();
		await areas.getByRole("link", { name: "Compras" }).click();
		await expect(page).toHaveURL(new RegExp(`${enderecoDaEscola("compras")}$`));
		await expect(areas).toBeHidden();
		await expect(page.getByRole("banner").getByText("Compras", { exact: true })).toBeVisible();

		await page.getByRole("button", { name: "Abrir o menu" }).click();
		await expect(areas).toBeVisible();
		await page.keyboard.press("Escape");
		await expect(areas).toBeHidden();
	});
});

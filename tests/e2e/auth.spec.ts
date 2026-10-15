import { expect, test } from "@playwright/test";

test.describe("proteção de rotas", () => {
  for (const path of [
    "/painel",
    "/painel/proprietario",
    "/painel/anunciante",
    "/admin",
    "/conta",
  ]) {
    test(`${path} exige login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(
        new RegExp(
          `/entrar\\?next=${encodeURIComponent(path).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        ),
      );
      await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    });
  }

  test("parâmetro next externo não gera open redirect", async ({ page }) => {
    await page.goto("/entrar?next=//evil.example.com");
    await expect(page).toHaveURL(/\/entrar/);
  });
});

test.describe("formulários de autenticação", () => {
  test("cadastro valida campos no cliente", async ({ page }) => {
    await page.goto("/cadastro");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("Informe seu nome completo")).toBeVisible();
    await expect(page.getByText("É necessário aceitar os termos")).toBeVisible();

    await page.getByLabel("CPF ou CNPJ").fill("111.111.111-11");
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill("curta");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("CPF ou CNPJ inválido")).toBeVisible();
    await expect(page.getByText("A senha deve ter pelo menos 10 caracteres")).toBeVisible();
  });

  test("cadastro pré-seleciona proprietário a partir de /anuncie", async ({ page }) => {
    await page.goto("/cadastro?tipo=owner");
    await expect(page.getByRole("radio", { name: /Proprietário/ })).toBeChecked();
  });

  test("login valida e-mail", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill("invalido");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("E-mail inválido")).toBeVisible();
  });

  test("suporte valida campos obrigatórios", async ({ page }) => {
    await page.goto("/suporte?assunto=comercial");
    await expect(page.getByLabel("Assunto")).toHaveValue("comercial");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.getByText("Informe seu nome")).toBeVisible();
  });
});

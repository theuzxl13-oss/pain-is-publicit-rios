import { expect, test } from "@playwright/test";

test.describe("páginas públicas", () => {
  test("página inicial apresenta banner, busca e seções", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Encontre o espaço ideal para sua próxima campanha.",
    );
    await expect(page.getByRole("search")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Perguntas frequentes" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("busca do banner leva para /explorar com o termo", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Cidade, endereço ou região").fill("Campinas");
    await page.getByRole("button", { name: "Buscar painéis" }).click();
    await expect(page).toHaveURL(/\/explorar\?q=Campinas/);
    await expect(page.getByLabel("Cidade, bairro ou endereço")).toHaveValue("Campinas");
  });

  for (const [path, heading] of [
    ["/como-funciona", "Como funciona"],
    ["/anuncie", "Seu painel na vitrine de quem está contratando agora"],
    ["/suporte", "Suporte e contato"],
    ["/ajuda", "Central de ajuda"],
    ["/termos", "Termos de uso"],
    ["/privacidade", "Política de privacidade"],
    ["/cancelamento", "Política de cancelamento"],
  ] as const) {
    test(`página ${path} carrega`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    });
  }

  test("404 amigável", async ({ page }) => {
    const res = await page.goto("/paineis/nao-existe");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  });

  test("sem rolagem horizontal", async ({ page }) => {
    for (const path of ["/", "/explorar", "/cadastro", "/suporte"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("cabeçalhos de segurança", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["x-powered-by"]).toBeUndefined();
  });
});

test.describe("navegação", () => {
  test("menu mobile abre e navega", async ({ page, isMobile }) => {
    test.skip(!isMobile, "apenas mobile");
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await page.locator("#mobile-menu").getByRole("link", { name: "Como funciona" }).click();
    await expect(page).toHaveURL(/\/como-funciona$/);
  });

  test("menu desktop tem os itens do requisito", async ({ page, isMobile }) => {
    test.skip(isMobile, "apenas desktop");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Menu principal" });
    for (const label of [
      "Início",
      "Explorar painéis",
      "Como funciona",
      "Anuncie seu painel",
      "Suporte",
    ]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
    await expect(page.getByRole("banner").getByRole("link", { name: "Entrar" })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "Criar conta" })).toBeVisible();
  });
});

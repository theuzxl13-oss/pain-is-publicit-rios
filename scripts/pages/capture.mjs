// Captura telas do app em execução para a vitrine do GitHub Pages.
// Uso: BASE_URL=http://localhost:3000 OUT_DIR=_site/telas node scripts/pages/capture.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = process.env.OUT_DIR ?? "_site/telas";
mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { path: "/", name: "inicio", title: "Página inicial", full: true },
  { path: "/explorar", name: "explorar", title: "Explorar painéis" },
  { path: "/como-funciona", name: "como-funciona", title: "Como funciona", full: true },
  { path: "/anuncie", name: "anuncie", title: "Anuncie seu painel" },
  { path: "/cadastro", name: "cadastro", title: "Criar conta" },
  { path: "/entrar", name: "entrar", title: "Entrar" },
  { path: "/suporte", name: "suporte", title: "Suporte" },
  { path: "/ajuda", name: "ajuda", title: "Central de ajuda" },
];

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {},
);
const manifest = [];

async function shoot(context, variant) {
  const page = await context.newPage();
  for (const p of PAGES) {
    await page.goto(BASE_URL + p.path, { waitUntil: "networkidle" });
    const file = `${p.name}-${variant}.png`;
    await page.screenshot({ path: join(OUT_DIR, file), fullPage: Boolean(p.full) });
    manifest.push({ ...p, variant, file });
  }
  await page.close();
}

const desktop = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
await shoot(desktop, "desktop");
const mobile = await browser.newContext({ ...devices["Pixel 7"] });
await shoot(mobile, "mobile");

// Menu mobile aberto
const page = await mobile.newPage();
await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Abrir menu" }).click();
await page.screenshot({ path: join(OUT_DIR, "menu-mobile.png") });
manifest.push({
  path: "/",
  name: "menu",
  title: "Menu mobile",
  variant: "mobile",
  file: "menu-mobile.png",
});

await browser.close();
writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`${manifest.length} capturas em ${OUT_DIR}`);

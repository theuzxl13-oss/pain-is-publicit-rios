// Gera uma prévia estática e navegável das páginas públicas a partir do app em execução.
// Uso: BASE_URL=http://localhost:3000 OUT_DIR=<pasta> node scripts/preview/build-static-preview.mjs
// Sem servidor/banco: formulários ficam desabilitados e isso é avisado na própria página.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = process.env.OUT_DIR ?? "preview-out";
mkdirSync(OUT_DIR, { recursive: true });

const PAGES = {
  "/": "index.html",
  "/explorar": "explorar.html",
  "/como-funciona": "como-funciona.html",
  "/anuncie": "anuncie.html",
  "/suporte": "suporte.html",
  "/ajuda": "ajuda.html",
  "/termos": "termos.html",
  "/privacidade": "privacidade.html",
  "/cancelamento": "cancelamento.html",
  "/entrar": "entrar.html",
  "/cadastro": "cadastro.html",
  "/recuperar-senha": "recuperar-senha.html",
};
// Áreas logadas redirecionam para o login, como no app real.
const FALLBACK = { "/painel": "entrar.html", "/conta": "entrar.html", "/admin": "entrar.html" };

const cssCache = new Map();
async function inlineCss(href) {
  if (cssCache.has(href)) return cssCache.get(href);
  let css = await (await fetch(BASE_URL + href)).text();
  const urls = [
    ...new Set([...css.matchAll(/url\((\/_next\/static\/media\/[^)]+)\)/g)].map((m) => m[1])),
  ];
  for (const u of urls) {
    const buf = Buffer.from(await (await fetch(BASE_URL + u)).arrayBuffer());
    const mime = u.endsWith(".woff2") ? "font/woff2" : "application/octet-stream";
    css = css.split(`url(${u})`).join(`url(data:${mime};base64,${buf.toString("base64")})`);
  }
  cssCache.set(href, css);
  return css;
}

function mapHref(href) {
  const m = href.match(/^\/([^?#]*)(\?[^#]*)?(#.*)?$/);
  if (!m) return href;
  const path = "/" + m[1].replace(/\/$/, "");
  const target =
    PAGES[path] ??
    FALLBACK[Object.keys(FALLBACK).find((p) => path === p || path.startsWith(p + "/"))];
  return target ? target + (m[3] ?? "") : "index.html";
}

const MENU_LINKS = [
  ["index.html", "Início"],
  ["explorar.html", "Explorar painéis"],
  ["como-funciona.html", "Como funciona"],
  ["anuncie.html", "Anuncie seu painel"],
  ["suporte.html", "Suporte"],
  ["entrar.html", "Entrar"],
  ["cadastro.html", "Criar conta"],
];

const BANNER = `<div id="preview-banner" role="note" style="background:#fef3c7;color:#422006;font:500 13px/1.4 system-ui,sans-serif;padding-block:8px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));text-align:center;border-bottom:1px solid #fcd34d">Prévia navegável da Fase 1. O banco de dados ainda não está conectado: listas aparecem vazias e os formulários não enviam dados.</div>`;

const MOBILE_MENU = `<nav id="preview-mobile-menu" hidden aria-label="Menu principal" style="position:fixed;top:64px;left:0;right:0;bottom:0;z-index:60;background:#fff;padding:16px;overflow:auto;border-top:1px solid #e3e7ef">${MENU_LINKS.map(
  ([h, l]) =>
    `<a href="${h}" style="display:block;padding:14px 12px;border-radius:8px;font:500 16px system-ui,sans-serif;color:#0f172a;text-decoration:none">${l}</a>`,
).join("")}</nav>`;

const SCRIPT = `<script>
(function () {
  var btn = document.querySelector('header button[aria-label="Abrir menu"]');
  var menu = document.getElementById("preview-mobile-menu");
  if (btn && menu) {
    btn.addEventListener("click", function () {
      var header = btn.closest("header");
      menu.style.top = (header ? header.getBoundingClientRect().bottom : 64) + "px";
      menu.hidden = !menu.hidden;
      btn.setAttribute("aria-expanded", String(!menu.hidden));
    });
  }
  document.querySelectorAll("form").forEach(function (form) {
    if (form.getAttribute("role") === "search") return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector(".preview-note");
      if (!note) {
        note = document.createElement("p");
        note.className = "preview-note";
        note.setAttribute("role", "status");
        note.style.cssText = "margin:0;padding:12px 14px;border-radius:8px;background:#fef3c7;color:#422006;font:500 14px/1.4 system-ui,sans-serif";
        form.prepend(note);
      }
      note.textContent = "Nesta prévia o envio está desativado. Ele funciona quando o banco de dados for conectado.";
    });
  });
})();
</script>`;

for (const [path, file] of Object.entries(PAGES)) {
  const res = await fetch(BASE_URL + path, { redirect: "manual" });
  let html = await res.text();

  const cssLinks = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"[^>]*>/g)].map(
    (m) => m[1],
  );
  let css = "";
  for (const href of cssLinks) css += await inlineCss(href);

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "Prévia";
  let body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ?? "";
  const htmlClass = html.match(/<html[^>]*class="([^"]*)"/)?.[1] ?? "";

  body = body
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<link[^>]*>/g, "")
    .replace(/<template[\s\S]*?<\/template>/g, "")
    .replace(/<!--\$\??-->|<!--\/\$-->/g, "")
    .replace(/href="(\/[^"]*)"/g, (_, h) => `href="${mapHref(h)}"`)
    .replace(/action="\/explorar"/g, 'action="explorar.html"');

  const head = `<title>${title}</title>\n<style>${css}</style>`;
  const content = `${BANNER}<div class="${htmlClass}" style="font-family:var(--font-sans),system-ui,sans-serif">${body}</div>${MOBILE_MENU}${SCRIPT}`;

  // A página principal é envolvida pelo esqueleto do artefato; as demais precisam do próprio documento.
  const out =
    file === "index.html"
      ? `${head}\n${content}`
      : `<!doctype html><html lang="pt-BR" class="${htmlClass}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}</head><body>${content}</body></html>`;
  writeFileSync(join(OUT_DIR, file), out);
  console.log(`${path} → ${file} (${Math.round(out.length / 1024)} KB)`);
}

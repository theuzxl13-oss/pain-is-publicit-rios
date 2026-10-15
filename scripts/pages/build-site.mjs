// Gera a página da vitrine (GitHub Pages) a partir das capturas e do histórico git.
// Uso: OUT_DIR=_site REPO_URL=https://github.com/dono/repo node scripts/pages/build-site.mjs
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = process.env.OUT_DIR ?? "_site";
const REPO_URL = process.env.REPO_URL ?? "";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const manifest = JSON.parse(readFileSync(join(OUT_DIR, "telas", "manifest.json"), "utf8"));
const SEP = "\u001f";
const commits = execSync(`git log -n 40 --pretty=format:%H${SEP}%h${SEP}%an${SEP}%aI${SEP}%s`, {
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [sha, short, author, date, subject] = line.split(SEP);
    return { sha, short, author, date, subject };
  });
const head = commits[0];
const fmtDate = (iso) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

const desktop = manifest.filter((m) => m.variant === "desktop");
const mobile = manifest.filter((m) => m.variant === "mobile");

const shot = (m) => `
  <figure class="shot">
    <a href="telas/${esc(m.file)}" target="_blank" rel="noopener">
      <img src="telas/${esc(m.file)}" alt="Captura: ${esc(m.title)} (${m.variant === "mobile" ? "celular" : "desktop"})" loading="lazy">
    </a>
    <figcaption>${esc(m.title)} <code>${esc(m.path)}</code></figcaption>
  </figure>`;

const docs = [
  ["docs/FASES.md", "Status das fases", "O que foi implementado, testado e o que falta."],
  ["docs/PLANO.md", "Plano técnico", "Arquitetura, modelagem, fluxo, riscos e custos."],
  ["docs/DECISOES.md", "Decisões pendentes", "Pontos comerciais e regras provisórias."],
  ["README.md", "Instalação", "Como rodar, testar e publicar."],
];

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vitrine do Projeto</title>
<meta name="description" content="Acompanhamento visual da Plataforma de Locação de Painéis Publicitários.">
<style>
  :root {
    --bg: #f6f7fb; --card: #ffffff; --fg: #0f172a; --muted: #5b6475; --border: #e3e7ef;
    --primary: #1e3a8a; --accent: #f59e0b; --ink: #0b1224;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0b1020; --card: #121a2e; --fg: #e8ecf5; --muted: #9aa4b8; --border: #232c44; --primary: #8fb0ff; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  a { color: var(--primary); }
  .wrap { max-width: 1200px; margin: 0 auto; padding: 0 16px; }
  header.hero { background: var(--ink); color: #e8ecf5; padding: 48px 0 40px; }
  header.hero h1 { margin: 0 0 8px; font-size: clamp(26px, 4vw, 40px); letter-spacing: -0.02em; }
  header.hero p { margin: 0; color: #b8c2d8; max-width: 720px; }
  .meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
  .pill { display: inline-flex; gap: 6px; align-items: center; border: 1px solid #2a3554; border-radius: 999px; padding: 4px 12px; font-size: 13px; color: #d5dcec; text-decoration: none; }
  .pill b { color: var(--accent); font-weight: 600; }
  nav.tabs { position: sticky; top: 0; z-index: 2; background: var(--bg); border-bottom: 1px solid var(--border); }
  nav.tabs .wrap { display: flex; gap: 4px; overflow-x: auto; }
  nav.tabs a { padding: 12px 14px; text-decoration: none; color: var(--muted); font-weight: 600; white-space: nowrap; }
  nav.tabs a:hover { color: var(--fg); }
  section { padding: 36px 0 8px; }
  h2 { font-size: 22px; margin: 0 0 4px; letter-spacing: -0.01em; }
  .sub { color: var(--muted); margin: 0 0 20px; }
  .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
  .grid.mobile { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
  .shot { margin: 0; background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
  .shot img { display: block; width: 100%; height: 240px; object-fit: cover; object-position: top; border-bottom: 1px solid var(--border); }
  .grid.mobile .shot img { height: 360px; }
  .shot figcaption { padding: 10px 12px; font-weight: 600; font-size: 14px; display: flex; justify-content: space-between; gap: 8px; }
  code { font-size: 12px; color: var(--muted); font-weight: 400; }
  .docs { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
  .doc { display: block; padding: 16px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; text-decoration: none; color: var(--fg); }
  .doc strong { display: block; margin-bottom: 4px; color: var(--primary); }
  .doc span { color: var(--muted); font-size: 14px; }
  ol.log { list-style: none; margin: 0; padding: 0; background: var(--card); border: 1px solid var(--border); border-radius: 12px; }
  ol.log li { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; padding: 12px 16px; border-top: 1px solid var(--border); }
  ol.log li:first-child { border-top: 0; }
  ol.log .sha { font-family: ui-monospace, monospace; font-size: 13px; }
  ol.log .when { grid-column: 2; color: var(--muted); font-size: 13px; }
  .note { background: var(--card); border: 1px solid var(--border); border-left: 4px solid var(--accent); border-radius: 8px; padding: 12px 16px; color: var(--muted); }
  footer { padding: 40px 0; color: var(--muted); font-size: 13px; }
</style>
</head>
<body>
<header class="hero">
  <div class="wrap">
    <h1>Plataforma de Locação de Painéis Publicitários</h1>
    <p>Vitrine de acompanhamento do projeto. Esta página é gerada automaticamente a cada atualização da branch principal, com capturas reais da aplicação.</p>
    <div class="meta">
      <span class="pill">Atualizado em <b>${esc(fmtDate(head.date))}</b></span>
      <a class="pill" href="${esc(REPO_URL)}/commit/${esc(head.sha)}">Versão <b>${esc(head.short)}</b></a>
      <a class="pill" href="${esc(REPO_URL)}">Repositório no GitHub</a>
    </div>
  </div>
</header>
<nav class="tabs" aria-label="Seções">
  <div class="wrap">
    <a href="#desktop">Telas (desktop)</a>
    <a href="#mobile">Telas (celular)</a>
    <a href="#mudancas">Mudanças</a>
    <a href="#docs">Documentação</a>
  </div>
</nav>
<main class="wrap">
  <section id="desktop">
    <h2>Telas no desktop</h2>
    <p class="sub">Clique em uma captura para vê-la em tamanho real.</p>
    <div class="grid">${desktop.map(shot).join("")}</div>
  </section>
  <section id="mobile">
    <h2>Telas no celular</h2>
    <p class="sub">Capturas feitas com a dimensão de um Pixel 7.</p>
    <div class="grid mobile">${mobile.map(shot).join("")}</div>
  </section>
  <section>
    <p class="note">As capturas são do app rodando sem banco de dados conectado; por isso listas aparecem vazias e as áreas logadas não são exibidas. Com o Supabase configurado, o conteúdo real aparece.</p>
  </section>
  <section id="mudancas">
    <h2>Histórico de mudanças</h2>
    <p class="sub">Últimas ${commits.length} alterações na branch principal.</p>
    <ol class="log">${commits
      .map(
        (c) =>
          `<li><a class="sha" href="${esc(REPO_URL)}/commit/${esc(c.sha)}">${esc(c.short)}</a><span>${esc(c.subject)}</span><span class="when">${esc(c.author)} · ${esc(fmtDate(c.date))}</span></li>`,
      )
      .join("")}</ol>
  </section>
  <section id="docs">
    <h2>Documentação</h2>
    <p class="sub">Abre no GitHub, sempre na versão mais recente.</p>
    <div class="docs">${docs
      .map(
        ([path, title, text]) =>
          `<a class="doc" href="${esc(REPO_URL)}/blob/main/${path}"><strong>${esc(title)}</strong><span>${esc(text)}</span></a>`,
      )
      .join("")}</div>
  </section>
</main>
<footer class="wrap">Gerado pelo workflow “GitHub Pages” do repositório.</footer>
</body>
</html>`;

writeFileSync(join(OUT_DIR, "index.html"), html);
writeFileSync(join(OUT_DIR, ".nojekyll"), "");
console.log(`Vitrine gerada em ${OUT_DIR}/index.html`);

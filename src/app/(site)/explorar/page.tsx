import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { PanelCard } from "@/components/panels/panel-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { BRAZIL_STATES } from "@/config/brazil";
import {
  listActiveCategories,
  listPublishedPanels,
} from "@/server/repositories/catalog-repository";

export const metadata: Metadata = {
  title: "Explorar painéis",
  description: "Pesquise painéis publicitários por cidade, região, categoria e preço.",
};

const PAGE_SIZE = 12;
const SORTS = {
  recent: "Mais recentes",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
} as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function ExplorePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = param(sp, "q").slice(0, 80);
  const categoria = param(sp, "categoria");
  const uf = param(sp, "uf").toUpperCase();
  const sortParam = param(sp, "ordem");
  const sort = (sortParam in SORTS ? sortParam : "recent") as keyof typeof SORTS;
  const page = Math.max(1, Number.parseInt(param(sp, "pagina") || "1", 10) || 1);

  const [result, categories] = await Promise.all([
    listPublishedPanels({
      q,
      categorySlug: categoria || undefined,
      state: uf || undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    listActiveCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.data.total / PAGE_SIZE));
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoria) params.set("categoria", categoria);
    if (uf) params.set("uf", uf);
    if (sort !== "recent") params.set("ordem", sort);
    if (p > 1) params.set("pagina", String(p));
    const s = params.toString();
    return s ? `/explorar?${s}` : "/explorar";
  };

  return (
    <div className="container py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Explorar painéis</h1>
        <p className="mt-2 text-muted-foreground">
          Filtre por localização, formato e preço. A busca no mapa chega na próxima etapa da
          plataforma.
        </p>
      </header>

      <form
        method="get"
        action="/explorar"
        role="search"
        aria-label="Filtros de busca"
        className="mb-8 grid gap-4 rounded-xl border bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="f-q">Cidade, bairro ou endereço</Label>
          <Input
            id="f-q"
            name="q"
            defaultValue={q}
            maxLength={80}
            placeholder="Ex.: Campinas, Centro"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-uf">Estado</Label>
          <NativeSelect id="f-uf" name="uf" defaultValue={uf}>
            <option value="">Todos</option>
            {BRAZIL_STATES.map((s) => (
              <option key={s.uf} value={s.uf}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-cat">Tipo de painel</Label>
          <NativeSelect id="f-cat" name="categoria" defaultValue={categoria}>
            <option value="">Todos</option>
            {categories.data.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-ordem">Ordenar por</Label>
          <NativeSelect id="f-ordem" name="ordem" defaultValue={sort}>
            {Object.entries(SORTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" className="h-11">
          <SlidersHorizontal aria-hidden /> Aplicar
        </Button>
      </form>

      {result.error && result.error !== "not_configured" ? (
        <Alert variant="warning" title="Não foi possível carregar os painéis agora">
          Tente novamente em alguns instantes.
        </Alert>
      ) : result.data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">Nenhum painel encontrado com esses filtros.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tente ampliar a região ou remover algum filtro.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/explorar">Limpar filtros</Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
            {result.data.total}{" "}
            {result.data.total === 1 ? "painel encontrado" : "painéis encontrados"}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.items.map((panel) => (
              <PanelCard key={panel.id} panel={panel} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <Button asChild variant="outline" size="sm">
                  <Link href={pageHref(page - 1)} rel="prev">
                    <ChevronLeft aria-hidden /> Anterior
                  </Link>
                </Button>
              )}
              <span className="px-3 text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              {page < totalPages && (
                <Button asChild variant="outline" size="sm">
                  <Link href={pageHref(page + 1)} rel="next">
                    Próxima <ChevronRight aria-hidden />
                  </Link>
                </Button>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

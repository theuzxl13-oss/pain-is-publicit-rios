import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, Lightbulb, MapPin, Ruler, Users } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/server/domain/money";
import { LIGHTING_LABELS, formatDimensions } from "@/server/domain/panel";
import { BILLING_UNIT_LABELS } from "@/server/domain/pricing";
import { getPanelBySlug } from "@/server/repositories/catalog-repository";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const panel = await getPanelBySlug(slug);
  if (!panel) return { title: "Painel não encontrado" };
  return {
    title: panel.title,
    description: `${panel.categoryName} em ${panel.neighborhood}, ${panel.city} – ${panel.state}.`,
  };
}

export default async function PanelPage({ params }: { params: Params }) {
  const { slug } = await params;
  const panel = await getPanelBySlug(slug);
  if (!panel) notFound();

  const unit = BILLING_UNIT_LABELS[panel.billingUnit];

  return (
    <div className="container py-8 sm:py-12">
      <Link
        href="/explorar"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" /> Voltar para a busca
      </Link>

      {panel.status !== "published" && (
        <Alert variant="warning" title="Pré-visualização" className="mb-6">
          Este painel não está publicado e só é visível para o proprietário e administradores.
        </Alert>
      )}

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          <div>
            <Badge>{panel.categoryName}</Badge>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{panel.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin aria-hidden className="h-4 w-4" />
              {panel.street}
              {panel.streetNumber ? `, ${panel.streetNumber}` : ""} — {panel.neighborhood},{" "}
              {panel.city} – {panel.state}
            </p>
          </div>

          {panel.images.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2" aria-label="Galeria de imagens">
              {panel.images.map((img, i) => (
                <li
                  key={img.url}
                  className={
                    i === 0
                      ? "relative aspect-[16/10] overflow-hidden rounded-xl sm:col-span-2"
                      : "relative aspect-[4/3] overflow-hidden rounded-xl"
                  }
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
                    priority={i === 0}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid aspect-[16/10] place-items-center rounded-xl bg-muted text-muted-foreground">
              Sem fotos
            </div>
          )}

          <section aria-labelledby="desc">
            <h2 id="desc" className="text-xl font-semibold">
              Descrição
            </h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
              {panel.description || "O proprietário ainda não adicionou uma descrição."}
            </p>
          </section>

          <section aria-labelledby="carac">
            <h2 id="carac" className="text-xl font-semibold">
              Características
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Spec
                icon={Ruler}
                label="Dimensões"
                value={formatDimensions(panel.widthM, panel.heightM)}
              />
              <Spec icon={Lightbulb} label="Iluminação" value={LIGHTING_LABELS[panel.lighting]} />
              {panel.orientation && (
                <Spec icon={MapPin} label="Orientação" value={panel.orientation} />
              )}
              {panel.estimatedDailyImpressions != null && (
                <Spec
                  icon={Users}
                  label="Impactos diários estimados (informado pelo proprietário)"
                  value={panel.estimatedDailyImpressions.toLocaleString("pt-BR")}
                />
              )}
            </dl>
            {panel.visibilityNotes && (
              <p className="mt-4 text-sm text-muted-foreground">{panel.visibilityNotes}</p>
            )}
            {panel.features.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {panel.features.map((f) => (
                  <li key={f}>
                    <Badge variant="secondary">{f}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {panel.rentalRules && (
            <section aria-labelledby="regras">
              <h2 id="regras" className="text-xl font-semibold">
                Regras de contratação
              </h2>
              <p className="mt-3 whitespace-pre-line text-muted-foreground">{panel.rentalRules}</p>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border bg-card p-6 shadow-soft">
            <p className="text-3xl font-bold">{formatCents(panel.priceCents)}</p>
            <p className="text-sm text-muted-foreground">
              {unit.per}
              {panel.priceNegotiable && " · valor negociável"}
            </p>
            <p className="mt-4 text-sm">
              Prazo mínimo:{" "}
              <strong>
                {panel.minPeriods} {panel.minPeriods === 1 ? unit.singular : unit.plural}
              </strong>
            </p>
            {panel.availabilityNotes && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                <CalendarCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />{" "}
                {panel.availabilityNotes}
              </p>
            )}
            <Alert variant="info" className="mt-6">
              Calendário de disponibilidade, estimativa por período e solicitação de locação serão
              liberados nas próximas etapas da plataforma. Para interesse imediato, fale com nosso
              time comercial.
            </Alert>
            <Button asChild className="mt-4 w-full" size="lg">
              <Link href={`/suporte?assunto=comercial&painel=${encodeURIComponent(panel.slug)}`}>
                Tenho interesse
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Spec({ icon: Icon, label, value }: { icon: typeof Ruler; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-lg border p-4">
      <Icon aria-hidden className="mt-0.5 h-5 w-5 text-primary" />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, ImageOff, MapPin, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/server/domain/money";
import { formatDimensions } from "@/server/domain/panel";
import { BILLING_UNIT_LABELS } from "@/server/domain/pricing";
import type { PanelCardData } from "@/types/panel";

export function PanelCard({ panel }: { panel: PanelCardData }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-[4/3] bg-muted">
        {panel.coverUrl ? (
          <Image
            src={panel.coverUrl}
            alt={`Foto do painel ${panel.title}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            <ImageOff aria-hidden className="h-8 w-8" />
            <span className="sr-only">Sem foto</span>
          </div>
        )}
        <Badge className="absolute left-3 top-3 bg-background/90 text-foreground backdrop-blur">
          {panel.categoryName}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="line-clamp-1 text-base font-semibold">{panel.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin aria-hidden className="h-3.5 w-3.5" />
            {panel.neighborhood}, {panel.city} – {panel.state}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Ruler aria-hidden className="h-3.5 w-3.5" />
            <dt className="sr-only">Dimensões</dt>
            <dd>{formatDimensions(panel.widthM, panel.heightM)}</dd>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarCheck aria-hidden className="h-3.5 w-3.5" />
            <dt className="sr-only">Disponibilidade</dt>
            <dd className="line-clamp-1">{panel.availabilityNotes || "Consulte o calendário"}</dd>
          </div>
        </dl>
        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-4">
          <div>
            <p className="text-lg font-bold leading-none">{formatCents(panel.priceCents)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {BILLING_UNIT_LABELS[panel.billingUnit].per}
              {panel.priceNegotiable && " · negociável"}
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/paineis/${panel.slug}`} aria-label={`Ver detalhes de ${panel.title}`}>
              Ver detalhes
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

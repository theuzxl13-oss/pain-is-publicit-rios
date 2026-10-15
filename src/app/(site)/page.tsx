import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarRange,
  Lightbulb,
  LockKeyhole,
  MapPinned,
  Monitor,
  Route,
  ShieldCheck,
  Signpost,
  Wallet,
} from "lucide-react";
import { Faq } from "@/components/marketing/faq";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { SearchHeroForm } from "@/components/marketing/search-hero-form";
import { Section } from "@/components/marketing/section";
import { PanelCard } from "@/components/panels/panel-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  listActiveCategories,
  listPublishedPanels,
} from "@/server/repositories/catalog-repository";

const CATEGORY_ICONS: Record<string, typeof Monitor> = {
  outdoor: Signpost,
  "painel-led": Monitor,
  frontlight: Lightbulb,
  backlight: Lightbulb,
  empena: Building2,
  totem: MapPinned,
  rodoviario: Route,
};

const advertiserBenefits = [
  {
    icon: MapPinned,
    title: "Localizações comparáveis",
    text: "Veja endereço, dimensões, iluminação e preço lado a lado antes de decidir.",
  },
  {
    icon: CalendarRange,
    title: "Disponibilidade real",
    text: "Calendário por painel, com períodos reservados validados no servidor.",
  },
  {
    icon: ShieldCheck,
    title: "Pagamento protegido",
    text: "Pix ou cartão via intermediador. A reserva só é confirmada após o pagamento.",
  },
];

const ownerBenefits = [
  {
    icon: BarChart3,
    title: "Mais visibilidade",
    text: "Seu painel exposto para empresas e agências que procuram espaço agora.",
  },
  {
    icon: Wallet,
    title: "Recebimento organizado",
    text: "Acompanhe solicitações, reservas, valores recebidos e a receber em um só lugar.",
  },
  {
    icon: LockKeyhole,
    title: "Controle total",
    text: "Defina preços, prazo mínimo, regras e bloqueie períodos quando quiser.",
  },
];

export default async function HomePage() {
  const [panels, categories] = await Promise.all([
    listPublishedPanels({ pageSize: 6 }),
    listActiveCategories(),
  ]);

  return (
    <>
      {/* Banner principal */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div
          aria-hidden
          className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
        />
        <div className="container relative py-20 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-ink-foreground/80">
              <BadgeCheck aria-hidden className="h-3.5 w-3.5 text-accent" /> Painéis revisados pela
              nossa equipe
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Encontre o espaço ideal para sua próxima campanha.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-foreground/75">
              Explore painéis publicitários disponíveis, compare localizações e contrate espaços de
              publicidade em uma única plataforma.
            </p>
            <div className="mx-auto mt-10 max-w-2xl">
              <SearchHeroForm />
            </div>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-foreground/70">
              <li className="flex items-center gap-1.5">
                <ShieldCheck aria-hidden className="h-4 w-4 text-accent" /> Pagamento seguro
              </li>
              <li className="flex items-center gap-1.5">
                <CalendarRange aria-hidden className="h-4 w-4 text-accent" /> Reserva com data
                garantida
              </li>
              <li className="flex items-center gap-1.5">
                <Wallet aria-hidden className="h-4 w-4 text-accent" /> Pix e cartão
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Painéis em destaque */}
      <Section
        id="destaques"
        eyebrow="Marketplace"
        title="Painéis disponíveis"
        description="Os anúncios mais recentes aprovados na plataforma."
      >
        {panels.error ? (
          <Alert
            variant="warning"
            title="Não foi possível carregar os painéis agora"
            className="mx-auto max-w-xl"
          >
            Tente novamente em alguns instantes.
          </Alert>
        ) : panels.data.items.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-xl border border-dashed p-10 text-center">
            <p className="font-medium">Ainda não há painéis publicados.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              É proprietário de um espaço publicitário? Seja um dos primeiros a anunciar.
            </p>
            <Button asChild className="mt-6">
              <Link href="/anuncie">Anunciar meu painel</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {panels.data.items.map((panel) => (
                <PanelCard key={panel.id} panel={panel} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/explorar">
                  Ver todos os painéis <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </>
        )}
      </Section>

      {/* Como funciona */}
      <Section
        id="como-funciona"
        eyebrow="Como funciona"
        title="Da busca à veiculação, sem planilhas nem idas e vindas"
        className="bg-secondary/50"
      >
        <HowItWorks />
      </Section>

      {/* Categorias */}
      {categories.data.length > 0 && (
        <Section id="categorias" eyebrow="Categorias" title="Formatos para cada estratégia">
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.data.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] ?? Signpost;
              return (
                <li key={cat.id}>
                  <Link
                    href={`/explorar?categoria=${cat.slug}`}
                    className="flex h-full flex-col gap-3 rounded-xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
                  >
                    <Icon aria-hidden className="h-6 w-6 text-primary" />
                    <span className="font-semibold">{cat.name}</span>
                    {cat.description && (
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {cat.description}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {/* Vantagens */}
      <section aria-labelledby="vantagens-titulo" className="bg-secondary/50 py-16 sm:py-24">
        <div className="container">
          <h2 id="vantagens-titulo" className="sr-only">
            Vantagens
          </h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <BenefitPanel
              eyebrow="Para anunciantes"
              title="Planeje campanhas com dados claros"
              items={advertiserBenefits}
              cta={{ href: "/explorar", label: "Explorar painéis" }}
            />
            <BenefitPanel
              eyebrow="Para proprietários"
              title="Transforme espaço em receita recorrente"
              items={ownerBenefits}
              cta={{ href: "/anuncie", label: "Anunciar meu painel" }}
              dark
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <Section id="perguntas-frequentes" eyebrow="Dúvidas" title="Perguntas frequentes">
        <div className="mx-auto max-w-3xl">
          <Faq />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Não encontrou o que procurava?{" "}
            <Link href="/suporte" className="font-medium text-primary hover:underline">
              Fale com o suporte
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}

function BenefitPanel({
  eyebrow,
  title,
  items,
  cta,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  items: { icon: typeof Monitor; title: string; text: string }[];
  cta: { href: string; label: string };
  dark?: boolean;
}) {
  return (
    <div
      className={
        dark
          ? "rounded-2xl bg-ink p-8 text-ink-foreground sm:p-10"
          : "rounded-2xl border bg-card p-8 shadow-soft sm:p-10"
      }
    >
      <p
        className={
          dark
            ? "text-sm font-semibold uppercase tracking-wider text-accent"
            : "text-sm font-semibold uppercase tracking-wider text-primary"
        }
      >
        {eyebrow}
      </p>
      <h3
        className={
          dark
            ? "mt-3 text-2xl font-bold text-white sm:text-3xl"
            : "mt-3 text-2xl font-bold sm:text-3xl"
        }
      >
        {title}
      </h3>
      <ul className="mt-8 space-y-6">
        {items.map((item) => (
          <li key={item.title} className="flex gap-4">
            <span
              className={
                dark
                  ? "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10 text-accent"
                  : "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
              }
            >
              <item.icon aria-hidden className="h-5 w-5" />
            </span>
            <div>
              <p className={dark ? "font-semibold text-white" : "font-semibold"}>{item.title}</p>
              <p
                className={
                  dark
                    ? "mt-1 text-sm text-ink-foreground/70"
                    : "mt-1 text-sm text-muted-foreground"
                }
              >
                {item.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <Button asChild className="mt-8" variant={dark ? "accent" : "default"}>
        <Link href={cta.href}>
          {cta.label} <ArrowRight aria-hidden />
        </Link>
      </Button>
    </div>
  );
}

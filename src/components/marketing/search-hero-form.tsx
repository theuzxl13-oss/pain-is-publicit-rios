import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Formulário GET: funciona sem JavaScript e leva para /explorar?q=… */
export function SearchHeroForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form
      action="/explorar"
      method="get"
      role="search"
      className="flex w-full flex-col gap-2 rounded-2xl bg-white p-2 shadow-lift sm:flex-row"
    >
      <label htmlFor="hero-q" className="sr-only">
        Cidade, endereço ou região
      </label>
      <div className="relative flex-1">
        <MapPin
          aria-hidden
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id="hero-q"
          name="q"
          defaultValue={defaultValue}
          maxLength={80}
          placeholder="Cidade, endereço ou região"
          className="h-12 w-full rounded-xl border-0 bg-transparent pl-10 pr-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <Button type="submit" size="lg" variant="accent" className="h-12 rounded-xl">
        <Search aria-hidden /> Buscar painéis
      </Button>
    </form>
  );
}

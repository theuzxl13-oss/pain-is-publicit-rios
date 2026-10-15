import { cn } from "@/lib/utils";

export function Section({
  id,
  eyebrow,
  title,
  description,
  className,
  children,
  as: Heading = "h2",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  /** Use "h1" quando a seção abre a página. */
  as?: "h1" | "h2";
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-titulo` : undefined}
      className={cn("py-16 sm:py-24", className)}
    >
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          {eyebrow && (
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              {eyebrow}
            </p>
          )}
          <Heading id={id ? `${id}-titulo` : undefined} className="text-3xl font-bold sm:text-4xl">
            {title}
          </Heading>
          {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5 font-display font-bold", className)}
      aria-label={`${siteConfig.shortName} — página inicial`}
    >
      <span
        aria-hidden
        className="relative grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-3"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="11" rx="1.5" />
          <path d="M8 15v5M16 15v5M6 20h12" strokeLinecap="round" />
          <path
            d="M7 9h6"
            strokeLinecap="round"
            className="text-accent"
            stroke="hsl(var(--accent))"
          />
        </svg>
      </span>
      <span className={cn("text-lg tracking-tight", inverse ? "text-white" : "text-foreground")}>
        {siteConfig.shortName}
      </span>
    </Link>
  );
}

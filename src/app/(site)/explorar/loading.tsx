import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container space-y-6 py-12" role="status" aria-label="Carregando">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

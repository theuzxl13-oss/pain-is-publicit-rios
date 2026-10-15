import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { defaultDashboardPath } from "@/server/domain/roles";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Encaminha para o dashboard adequado aos papéis do usuário. */
export default async function DashboardIndex({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("/painel");
  const sp = await searchParams;
  const target = defaultDashboardPath(user.roles);
  const passthrough = new URLSearchParams();
  for (const key of ["acesso", "senha", "email"]) {
    const v = sp[key];
    if (typeof v === "string") passthrough.set(key, v);
  }
  const qs = passthrough.toString();
  redirect(qs ? `${target}?${qs}` : target);
}

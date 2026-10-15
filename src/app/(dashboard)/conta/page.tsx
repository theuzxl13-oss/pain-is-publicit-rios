import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MailWarning } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDocument } from "@/lib/validation/document";
import { requireUser } from "@/server/auth/session";
import { ROLE_LABELS, SELF_SERVICE_ROLES } from "@/server/domain/roles";
import {
  CompanyForm,
  DataRequestForm,
  EnableRoleButton,
  PasswordForm,
  ProfileForm,
} from "./account-forms";

export const metadata: Metadata = { title: "Minha conta" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DSR_STATUS: Record<string, string> = {
  received: "Recebida",
  in_progress: "Em andamento",
  completed: "Concluída",
  rejected: "Indeferida",
};

export default async function AccountPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("/conta");
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [companyRes, dsrRes] = await Promise.all([
    user.profile?.companyId
      ? supabase
          .from("companies")
          .select("legal_name, trade_name")
          .eq("id", user.profile.companyId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("data_subject_requests")
      .select("id, type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const missingRoles = SELF_SERVICE_ROLES.filter((r) => !user.roles.includes(r));
  const p = user.profile;

  return (
    <>
      <PageHeader
        title="Minha conta"
        description="Dados cadastrais, perfis de uso, segurança e privacidade."
      />

      {sp.conta === "suspensa" && <Alert variant="destructive" title="Sua conta está suspensa." />}

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            {user.email}
            {user.emailConfirmed ? (
              <Badge variant="success">
                <BadgeCheck aria-hidden className="h-3 w-3" /> E-mail confirmado
              </Badge>
            ) : (
              <Badge variant="warning">
                <MailWarning aria-hidden className="h-3 w-3" /> E-mail não confirmado
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaults={{
              fullName: p?.fullName ?? "",
              phone: p?.phone ?? "",
              document: p?.documentNumber ? formatDocument(p.documentNumber) : "",
              marketingOptIn: p?.marketingOptIn ?? false,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
          <CardDescription>Usada em contratos e comprovantes.</CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyForm
            defaults={{
              legalName: companyRes.data?.legal_name ?? "",
              tradeName: companyRes.data?.trade_name ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfis de uso</CardTitle>
          <CardDescription>
            Uma mesma conta pode atuar como anunciante e como proprietário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="flex flex-wrap gap-2">
            {user.roles.map((r) => (
              <li key={r}>
                <Badge>{ROLE_LABELS[r]}</Badge>
              </li>
            ))}
          </ul>
          {missingRoles.map((role) => (
            <EnableRoleButton key={role} role={role} />
          ))}
          <p className="text-xs text-muted-foreground">
            Permissões administrativas são concedidas apenas pela equipe da plataforma.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>
            Altere sua senha. Por segurança, confirmamos a senha atual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacidade (LGPD)</CardTitle>
          <CardDescription>
            Solicite acesso, correção, portabilidade ou exclusão dos seus dados. Saiba mais na{" "}
            <Link href="/privacidade" className="text-primary hover:underline">
              política de privacidade
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <DataRequestForm />
          {(dsrRes.data?.length ?? 0) > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Suas solicitações</h3>
              <ul className="divide-y rounded-lg border text-sm">
                {dsrRes.data!.map((r) => (
                  <li key={r.id} className="flex items-center justify-between p-3">
                    <span>{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                    <Badge variant="secondary">{DSR_STATUS[r.status] ?? r.status}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

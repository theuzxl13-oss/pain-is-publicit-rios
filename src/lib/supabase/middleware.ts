import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/env";
import { isAuthPage, isProtectedPath } from "@/server/domain/routes";

/**
 * Renova a sessão do Supabase a cada requisição e aplica a primeira camada
 * de proteção de rotas (autenticação). A autorização por papel é verificada
 * novamente nos layouts do servidor e, em última instância, pelo RLS.
 */
export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isSupabaseConfigured()) {
    if (isProtectedPath(pathname)) {
      return redirectToLogin(request, pathname + search);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() valida o token no servidor do Supabase (não confiar só no cookie).
  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  if (!userId && isProtectedPath(pathname)) {
    return redirectToLogin(request, pathname + search, response);
  }

  if (userId && isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/painel";
    url.search = "";
    return copyCookies(response, NextResponse.redirect(url));
  }

  return response;
}

function redirectToLogin(request: NextRequest, next: string, from?: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = "/entrar";
  url.search = `?next=${encodeURIComponent(next)}`;
  const redirect = NextResponse.redirect(url);
  return from ? copyCookies(from, redirect) : redirect;
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

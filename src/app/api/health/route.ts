import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Endpoint para monitoramento de disponibilidade (uptime). Não expõe segredos. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    supabaseConfigured: isSupabaseConfigured(),
    time: new Date().toISOString(),
  });
}

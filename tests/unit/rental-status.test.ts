import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  RENTAL_STATUSES,
  RENTAL_TRANSITIONS,
  canTransition,
  isTerminal,
} from "@/server/domain/rental-status";

/** Extrai o mapa de transições da função SQL (fonte de verdade) para garantir que o espelho TS não divirja. */
function sqlTransitions(): Record<string, string[]> {
  const sql = readFileSync(
    join(__dirname, "../../supabase/migrations/20261015000400_rentals.sql"),
    "utf8",
  );
  const body = sql.slice(
    sql.indexOf("function public.rental_transition_allowed"),
    sql.indexOf("create table public.rental_request_events"),
  );
  const map: Record<string, string[]> = {};
  for (const m of body.matchAll(/when '(\w+)' then _to in \(([^)]*)\)/g)) {
    map[m[1]!] = [...m[2]!.matchAll(/'(\w+)'/g)].map((x) => x[1]!);
  }
  return map;
}

describe("máquina de estados de solicitações", () => {
  it("espelho TS é idêntico à função SQL", () => {
    const sql = sqlTransitions();
    for (const status of RENTAL_STATUSES) {
      expect([...(sql[status] ?? [])].sort(), status).toEqual(
        [...RENTAL_TRANSITIONS[status]].sort(),
      );
    }
  });

  it("não permite pular o pagamento", () => {
    expect(canTransition("submitted", "confirmed")).toBe(false);
    expect(canTransition("negotiating", "confirmed")).toBe(false);
    expect(canTransition("awaiting_payment", "confirmed")).toBe(true);
  });

  it("estados finais não transitam", () => {
    for (const s of ["completed", "rejected", "cancelled", "expired"] as const) {
      expect(isTerminal(s)).toBe(true);
    }
  });
});

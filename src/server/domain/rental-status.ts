export const RENTAL_STATUSES = [
  "submitted",
  "under_review",
  "negotiating",
  "awaiting_payment",
  "confirmed",
  "in_progress",
  "completed",
  "rejected",
  "cancelled",
  "expired",
] as const;
export type RentalStatus = (typeof RENTAL_STATUSES)[number];

export const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  submitted: "Solicitação enviada",
  under_review: "Em análise",
  negotiating: "Em negociação",
  awaiting_payment: "Aguardando pagamento",
  confirmed: "Confirmada",
  in_progress: "Em andamento",
  completed: "Concluída",
  rejected: "Recusada",
  cancelled: "Cancelada",
  expired: "Expirada",
};

/**
 * Espelho da função SQL public.rental_transition_allowed (fonte de verdade).
 * Usado para exibir ações possíveis na interface; o banco revalida.
 */
export const RENTAL_TRANSITIONS: Record<RentalStatus, readonly RentalStatus[]> = {
  submitted: [
    "under_review",
    "negotiating",
    "awaiting_payment",
    "rejected",
    "cancelled",
    "expired",
  ],
  under_review: ["negotiating", "awaiting_payment", "rejected", "cancelled", "expired"],
  negotiating: ["awaiting_payment", "rejected", "cancelled", "expired"],
  awaiting_payment: ["confirmed", "negotiating", "cancelled", "expired"],
  confirmed: ["in_progress", "completed", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  rejected: [],
  cancelled: [],
  expired: [],
};

export function canTransition(from: RentalStatus, to: RentalStatus): boolean {
  return RENTAL_TRANSITIONS[from].includes(to);
}

export function isTerminal(status: RentalStatus): boolean {
  return RENTAL_TRANSITIONS[status].length === 0;
}

"use server";

import type { SupportInput } from "@/lib/validation/support";
import { createSupportTicket } from "@/server/services/support-service";

export async function submitSupportTicket(input: SupportInput) {
  return createSupportTicket(input);
}

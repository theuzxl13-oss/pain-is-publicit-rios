export const PANEL_STATUS_LABELS = {
  draft: "Rascunho",
  pending_review: "Em análise",
  changes_requested: "Correções solicitadas",
  published: "Publicado",
  rejected: "Reprovado",
  suspended: "Suspenso",
  inactive: "Desativado",
} as const;
export type PanelStatus = keyof typeof PANEL_STATUS_LABELS;

export const LIGHTING_LABELS = {
  none: "Sem iluminação",
  frontlight: "Frontlight",
  backlight: "Backlight",
  led: "LED",
  other: "Outra",
} as const;
export type LightingType = keyof typeof LIGHTING_LABELS;

export function formatDimensions(widthM: number, heightM: number): string {
  const fmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  return `${fmt.format(widthM)} × ${fmt.format(heightM)} m`;
}

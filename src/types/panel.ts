import type { BillingUnit } from "@/server/domain/pricing";
import type { LightingType, PanelStatus } from "@/server/domain/panel";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type PanelCardData = {
  id: string;
  slug: string;
  title: string;
  city: string;
  state: string;
  neighborhood: string;
  categoryName: string;
  widthM: number;
  heightM: number;
  priceCents: number;
  billingUnit: BillingUnit;
  priceNegotiable: boolean;
  availabilityNotes: string | null;
  coverUrl: string | null;
};

export type PanelDetail = PanelCardData & {
  description: string;
  street: string;
  streetNumber: string | null;
  postalCode: string;
  latitude: number;
  longitude: number;
  lighting: LightingType;
  orientation: string | null;
  visibilityNotes: string | null;
  estimatedDailyImpressions: number | null;
  features: string[];
  minPeriods: number;
  rentalRules: string | null;
  status: PanelStatus;
  images: { url: string; alt: string }[];
};

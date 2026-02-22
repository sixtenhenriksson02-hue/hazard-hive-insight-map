export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ReportStatus = "open" | "in-progress" | "resolved";

export interface RiskReport {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  riskLevel: RiskLevel;
  status: ReportStatus;
  reportedBy: string;
  createdAt: Date;
  resolvedAt?: Date;
  imageUrl?: string;
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Låg",
  medium: "Medel",
  high: "Hög",
  critical: "Kritisk",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Öppen",
  "in-progress": "Pågår",
  resolved: "Åtgärdad",
};

export const CATEGORIES = [
  "Halkrisk",
  "Snubbelrisk",
  "Belysning",
  "Brandsäkerhet",
  "Skyddsutrustning",
  "Ergonomi",
  "Kemikalier",
  "Elektricitet",
  "Fordon/Truckar",
  "Övrigt",
];

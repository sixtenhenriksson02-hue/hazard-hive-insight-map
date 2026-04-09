import { useLanguage } from "@/hooks/useLanguage";
import { Bot, MapPin } from "lucide-react";

const matrix = (t: (k: string) => string) => [
  { probability: t("matrix.veryLikely"), consequences: ["medium", "high", "critical", "critical"] as const },
  { probability: t("matrix.likely"), consequences: ["low", "medium", "high", "critical"] as const },
  { probability: t("matrix.possible"), consequences: ["low", "medium", "medium", "high"] as const },
  { probability: t("matrix.unlikely"), consequences: ["low", "low", "low", "medium"] as const },
];

const cellColors: Record<string, string> = {
  low: "bg-risk-low/20 text-risk-low border-risk-low/30",
  medium: "bg-risk-medium/20 text-risk-medium border-risk-medium/30",
  high: "bg-risk-high/20 text-risk-high border-risk-high/30",
  critical: "bg-risk-critical/20 text-risk-critical border-risk-critical/30",
};

export default function RiskMatrix() {
  const { t } = useLanguage();
  const rows = matrix(t);
  const consequenceLabels = [t("matrix.minor"), t("matrix.moderate"), t("matrix.serious"), t("matrix.verySevere")];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="rounded-lg border border-border bg-card p-4 md:p-6">
        <h2 className="text-lg font-bold text-card-foreground mb-4">{t("matrix.title")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-muted-foreground font-medium p-2 min-w-[110px]">
                  {t("matrix.probability")} ↓
                </th>
                {consequenceLabels.map((c) => (
                  <th key={c} className="text-center text-muted-foreground font-medium p-2 min-w-[90px]">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.probability}>
                  <td className="p-2 font-medium text-card-foreground text-xs md:text-sm">{row.probability}</td>
                  {row.consequences.map((level, j) => (
                    <td key={j} className="p-1.5">
                      <div className={`rounded-md border px-3 py-2 text-center font-semibold text-xs ${cellColors[level]}`}>
                        {t(`risk.${level}`)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">{t("matrix.consequence")} →</p>
      </div>

      {/* AI assessment explanation */}
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 md:p-5">
        <h3 className="text-sm font-semibold text-accent flex items-center gap-1.5 mb-2">
          <Bot className="h-4 w-4" /> {t("matrix.aiInfoTitle")}
        </h3>
        <div className="text-xs text-muted-foreground space-y-2">
          <p>{t("matrix.aiInfoText1")}</p>
          <p>{t("matrix.aiInfoText2")}</p>
          <p className="font-medium text-card-foreground">{t("matrix.aiInfoTips")}</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>{t("matrix.aiTip1")}</li>
            <li>{t("matrix.aiTip2")}</li>
            <li>{t("matrix.aiTip3")}</li>
            <li>{t("matrix.aiTip4")}</li>
          </ul>
        </div>
      </div>

      {/* APD plan explanation */}
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 md:p-5">
        <h3 className="text-sm font-semibold text-accent flex items-center gap-1.5 mb-2">
          <MapPin className="h-4 w-4" /> {t("matrix.apdInfoTitle")}
        </h3>
        <div className="text-xs text-muted-foreground space-y-2">
          <p>{t("matrix.apdInfoText1")}</p>
          <p>{t("matrix.apdInfoText2")}</p>
          <p>{t("matrix.apdInfoText3")}</p>
        </div>
      </div>
    </div>
  );
}

import { RiskLevel, RISK_LABELS } from "@/types/risk";

const matrix: { probability: string; consequences: RiskLevel[] }[] = [
  { probability: "Mycket troligt", consequences: ["medium", "high", "critical", "critical"] },
  { probability: "Troligt", consequences: ["low", "medium", "high", "critical"] },
  { probability: "Möjligt", consequences: ["low", "medium", "medium", "high"] },
  { probability: "Osannolikt", consequences: ["low", "low", "low", "medium"] },
];

const consequenceLabels = ["Lindrig", "Måttlig", "Allvarlig", "Mycket allvarlig"];

const cellColors: Record<RiskLevel, string> = {
  low: "bg-risk-low/20 text-risk-low border-risk-low/30",
  medium: "bg-risk-medium/20 text-risk-medium border-risk-medium/30",
  high: "bg-risk-high/20 text-risk-high border-risk-high/30",
  critical: "bg-risk-critical/20 text-risk-critical border-risk-critical/30",
};

export default function RiskMatrix() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-6 animate-fade-in">
      <h2 className="text-lg font-bold text-card-foreground mb-4">Riskmatris</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-muted-foreground font-medium p-2 min-w-[110px]">
                Sannolikhet ↓
              </th>
              {consequenceLabels.map((c) => (
                <th key={c} className="text-center text-muted-foreground font-medium p-2 min-w-[90px]">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.probability}>
                <td className="p-2 font-medium text-card-foreground text-xs md:text-sm">
                  {row.probability}
                </td>
                {row.consequences.map((level, j) => (
                  <td key={j} className="p-1.5">
                    <div
                      className={`rounded-md border px-3 py-2 text-center font-semibold text-xs ${cellColors[level]}`}
                    >
                      {RISK_LABELS[level]}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Konsekvens →
      </p>
    </div>
  );
}

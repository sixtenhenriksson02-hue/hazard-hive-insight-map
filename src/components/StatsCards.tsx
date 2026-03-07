import { AlertTriangle, CheckCircle2, FileWarning } from "lucide-react";
import { RiskReport } from "@/hooks/useReports";
import { useLanguage } from "@/hooks/useLanguage";

interface StatsCardsProps {
  reports: RiskReport[];
}

export default function StatsCards({ reports }: StatsCardsProps) {
  const { t } = useLanguage();
  const open = reports.filter((r) => r.status === "open").length;
  const resolved = reports.filter((r) => r.status === "resolved").length;
  const critical = reports.filter((r) => r.risk_level === "critical" && r.status !== "resolved").length;

  const stats = [
    { label: t("stats.open"), value: open, icon: AlertTriangle, colorClass: "text-status-open", bgClass: "bg-status-open/10" },
    { label: t("stats.resolved"), value: resolved, icon: CheckCircle2, colorClass: "text-status-resolved", bgClass: "bg-status-resolved/10" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <div key={stat.label} className="rounded-lg border border-border bg-card px-3 py-2.5 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex items-center gap-2">
            <div className={`rounded-md p-1.5 ${stat.bgClass}`}><stat.icon className={`h-4 w-4 ${stat.colorClass}`} /></div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-card-foreground leading-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
            </div>
            {stat.label === t("stats.open") && critical > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-risk-critical/10 text-risk-critical ml-auto">{critical} {t("stats.critical")}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

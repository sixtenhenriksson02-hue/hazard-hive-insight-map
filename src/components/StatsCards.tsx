import { AlertTriangle, CheckCircle2, Clock, FileWarning } from "lucide-react";
import { RiskReport } from "@/hooks/useReports";
import { useLanguage } from "@/hooks/useLanguage";

interface StatsCardsProps {
  reports: RiskReport[];
}

export default function StatsCards({ reports }: StatsCardsProps) {
  const { t } = useLanguage();
  const total = reports.length;
  const open = reports.filter((r) => r.status === "open").length;
  const inProgress = reports.filter((r) => r.status === "in-progress").length;
  const resolved = reports.filter((r) => r.status === "resolved").length;
  const critical = reports.filter((r) => r.risk_level === "critical" && r.status !== "resolved").length;

  const stats = [
    { label: t("stats.total"), value: total, icon: FileWarning, colorClass: "text-foreground", bgClass: "bg-secondary" },
    { label: t("stats.open"), value: open, icon: AlertTriangle, colorClass: "text-status-open", bgClass: "bg-status-open/10" },
    { label: t("stats.inProgress"), value: inProgress, icon: Clock, colorClass: "text-status-in-progress", bgClass: "bg-status-in-progress/10" },
    { label: t("stats.resolved"), value: resolved, icon: CheckCircle2, colorClass: "text-status-resolved", bgClass: "bg-status-resolved/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div key={stat.label} className="rounded-lg border border-border bg-card p-4 md:p-5 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex items-center justify-between mb-3">
            <div className={`rounded-md p-2 ${stat.bgClass}`}><stat.icon className={`h-5 w-5 ${stat.colorClass}`} /></div>
            {stat.label === t("stats.open") && critical > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-risk-critical/10 text-risk-critical">{critical} {t("stats.critical")}</span>
            )}
          </div>
          <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

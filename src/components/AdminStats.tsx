import { useMemo, useState } from "react";
import { RiskReport } from "@/hooks/useReports";
import { useLanguage } from "@/hooks/useLanguage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { CheckCircle2, Calendar, MapPin, AlertTriangle } from "lucide-react";

interface AdminStatsProps {
  reports: RiskReport[];
}

const RISK_COLORS: Record<string, string> = {
  low: "hsl(142, 71%, 45%)",
  medium: "hsl(48, 96%, 53%)",
  high: "hsl(25, 95%, 53%)",
  critical: "hsl(0, 72%, 51%)",
};

const riskBadgeClass: Record<string, string> = {
  low: "bg-risk-low/15 text-risk-low",
  medium: "bg-risk-medium/15 text-risk-medium",
  high: "bg-risk-high/15 text-risk-high",
  critical: "bg-risk-critical/15 text-risk-critical",
};

const TYPE_COLORS = ["hsl(217, 91%, 60%)", "hsl(0, 72%, 51%)"];

export default function AdminStats({ reports }: AdminStatsProps) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState(30);

  const filtered = useMemo(() => {
    if (period === 0) return reports;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    return reports.filter((r) => new Date(r.created_at) >= cutoff);
  }, [reports, period]);

  const resolved = filtered.filter((r) => r.status === "resolved").length;
  const total = filtered.length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const resolvedReports = useMemo(() => {
    return filtered
      .filter((r) => r.status === "resolved")
      .sort((a, b) => new Date(b.resolved_at ?? b.updated_at).getTime() - new Date(a.resolved_at ?? a.updated_at).getTime());
  }, [filtered]);

  const avgResolutionDays = useMemo(() => {
    const rr = filtered.filter((r) => r.resolved_at);
    if (rr.length === 0) return 0;
    const totalDays = rr.reduce((sum, r) => {
      const diff = new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime();
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round(totalDays / rr.length * 10) / 10;
  }, [filtered]);

  const byRisk = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    filtered.forEach((r) => { counts[r.risk_level] = (counts[r.risk_level] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: t(`risk.${name}`),
      value,
      fill: RISK_COLORS[name],
    }));
  }, [filtered, t]);

  const byType = useMemo(() => [
    { name: t("adminStats.observations"), value: filtered.filter((r) => r.report_type === "observation").length },
    { name: t("adminStats.injuryReports"), value: filtered.filter((r) => r.report_type === "injury").length },
    { name: t("adminStats.improvements"), value: filtered.filter((r) => r.report_type === "improvement").length },
  ], [filtered, t]);

  const byCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Period selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-card-foreground">{t("adminStats.period")}:</span>
        {[7, 30, 90, 180, 365, 0].map((d) => (
          <button
            key={d}
            onClick={() => setPeriod(d)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              period === d
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-accent"
            }`}
          >
            {d === 7 ? t("adminStats.last7") : d === 30 ? t("adminStats.last30") : d === 90 ? t("adminStats.last90") : d === 180 ? t("adminStats.last180") : d === 365 ? t("adminStats.last365") : t("adminStats.allTime")}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-card-foreground">{total}</p>
          <p className="text-sm text-muted-foreground">{t("stats.total")}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-status-resolved">{resolutionRate}%</p>
          <p className="text-sm text-muted-foreground">{t("adminStats.resolutionRate")}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-card-foreground">{avgResolutionDays}</p>
          <p className="text-sm text-muted-foreground">{t("adminStats.avgResolutionDays")}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-risk-critical">{filtered.filter((r) => r.report_type === "injury").length}</p>
          <p className="text-sm text-muted-foreground">{t("adminStats.injuryReports")}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">{t("adminStats.byCategory")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byCategory}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">{t("adminStats.byRisk")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byRisk} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {byRisk.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 md:col-span-2">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">{t("form.reportType")}</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={byType} layout="vertical">
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {byType.map((_, i) => (
                  <Cell key={i} fill={TYPE_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resolved reports history */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-status-resolved" />
          {t("adminStats.resolvedHistory")} ({resolvedReports.length})
        </h3>
        {resolvedReports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t("adminStats.noResolved")}</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {resolvedReports.map((r) => (
              <div key={r.id} className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
                <CheckCircle2 className="h-4 w-4 text-status-resolved mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-card-foreground">{r.title}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${riskBadgeClass[r.risk_level]}`}>
                      {t(`risk.${r.risk_level}`)}
                    </span>
                    {r.report_type === "injury" && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" />{t("form.injury")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{r.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t("adminStats.resolvedAt")}: {new Date(r.resolved_at ?? r.updated_at).toLocaleDateString("sv-SE")}
                    </span>
                    <span className="text-muted-foreground">{r.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

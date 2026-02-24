import { useMemo, useState } from "react";
import { RiskReport } from "@/hooks/useReports";
import { useLanguage } from "@/hooks/useLanguage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface AdminStatsProps {
  reports: RiskReport[];
}

const RISK_COLORS: Record<string, string> = {
  low: "hsl(142, 71%, 45%)",
  medium: "hsl(48, 96%, 53%)",
  high: "hsl(25, 95%, 53%)",
  critical: "hsl(0, 72%, 51%)",
};

const TYPE_COLORS = ["hsl(217, 91%, 60%)", "hsl(0, 72%, 51%)"];

export default function AdminStats({ reports }: AdminStatsProps) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState(30);

  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    return reports.filter((r) => new Date(r.created_at) >= cutoff);
  }, [reports, period]);

  const resolved = filtered.filter((r) => r.status === "resolved").length;
  const total = filtered.length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const avgResolutionDays = useMemo(() => {
    const resolvedReports = filtered.filter((r) => r.resolved_at);
    if (resolvedReports.length === 0) return 0;
    const totalDays = resolvedReports.reduce((sum, r) => {
      const diff = new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime();
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round(totalDays / resolvedReports.length * 10) / 10;
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
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setPeriod(d)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              period === d
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-accent"
            }`}
          >
            {d === 7 ? t("adminStats.last7") : d === 30 ? t("adminStats.last30") : t("adminStats.last90")}
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
        {/* By category */}
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

        {/* By risk level */}
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

        {/* By type */}
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
    </div>
  );
}

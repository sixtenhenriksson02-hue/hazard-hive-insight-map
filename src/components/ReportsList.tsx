import { RiskReport, ReportStatus } from "@/hooks/useReports";
import { useLanguage } from "@/hooks/useLanguage";
import { ChevronRight, Flame } from "lucide-react";
import { computeDueDate, isReportOverdue } from "@/hooks/useProjectDeadline";

interface ReportsListProps {
  reports: RiskReport[];
  isAdmin: boolean;
  onUpdateStatus?: (id: string, status: ReportStatus) => void;
  onSelect: (report: RiskReport) => void;
  deadlineDays?: number | null;
}
const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const riskColor: Record<string, string> = {
  low: "bg-risk-low",
  medium: "bg-risk-medium",
  high: "bg-risk-high",
  critical: "bg-risk-critical",
};

export default function ReportsList({ reports, isAdmin, onUpdateStatus, onSelect, deadlineDays }: ReportsListProps) {
  const { t } = useLanguage();

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t("dashboard.noReports")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {reports.map((report, i) => {
        const overdue = isReportOverdue(report.created_at, report.status, deadlineDays);
        const due = computeDueDate(report.created_at, deadlineDays);
        return (
          <div
            key={report.id}
            onClick={() => onSelect(report)}
            className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all cursor-pointer animate-fade-in ${
              overdue
                ? "border-destructive bg-destructive/10 hover:bg-destructive/15 ring-1 ring-destructive/60"
                : "border-border bg-card hover:border-accent/40"
            }`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {/* Risk indicator dot */}
            <span className={`shrink-0 h-3 w-3 rounded-full ${riskColor[report.risk_level]}`} />

            {/* Title + location */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-medium truncate transition-colors ${overdue ? "text-destructive" : "text-card-foreground group-hover:text-accent"}`}>
                  {capitalize(report.title)}
                </span>
                {overdue && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground uppercase">
                    <Flame className="h-2.5 w-2.5" /> Prio
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground truncate block">
                {[report.building, report.specific_location, report.category].filter(Boolean).join(" · ")}
              </span>
              {report.description && (
                <span className="text-xs text-muted-foreground/70 line-clamp-1 block mt-0.5">
                  {report.description}
                </span>
              )}
              {report.due_date && report.status !== "resolved" && (
                <span className={`text-[10px] block mt-0.5 ${overdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                  {overdue ? "Försenad sedan " : "Deadline: "}
                  {new Date(report.due_date).toLocaleDateString("sv-SE")}
                </span>
              )}
            </div>

            {/* Date */}
            <span className="shrink-0 text-xs text-muted-foreground hidden sm:block">
              {new Date(report.created_at).toLocaleDateString("sv-SE")}
            </span>

            {/* Admin quick status */}
            {isAdmin && onUpdateStatus && report.status !== "resolved" && (
              <select
                className="shrink-0 text-xs border border-border rounded px-1.5 py-0.5 bg-card text-card-foreground"
                value={report.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(report.id, e.target.value as ReportStatus);
                }}
              >
                <option value="open">{t("status.open")}</option>
                <option value="resolved">{t("status.resolved")}</option>
              </select>
            )}

            <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${overdue ? "text-destructive" : "text-muted-foreground group-hover:text-accent"}`} />
          </div>
        );
      })}
    </div>
  );
}

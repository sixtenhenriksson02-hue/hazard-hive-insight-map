import { RiskReport, ReportStatus } from "@/hooks/useReports";
import { useLanguage } from "@/hooks/useLanguage";
import { AlertTriangle, FileText, ChevronRight } from "lucide-react";

interface ReportsListProps {
  reports: RiskReport[];
  isAdmin: boolean;
  onUpdateStatus?: (id: string, status: ReportStatus) => void;
  onSelect: (report: RiskReport) => void;
}
const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const riskColor: Record<string, string> = {
  low: "bg-risk-low",
  medium: "bg-risk-medium",
  high: "bg-risk-high",
  critical: "bg-risk-critical",
};

export default function ReportsList({ reports, isAdmin, onUpdateStatus, onSelect }: ReportsListProps) {
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
      {reports.map((report, i) => (
        <div
          key={report.id}
          onClick={() => onSelect(report)}
          className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-accent/40 transition-all cursor-pointer animate-fade-in"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          {/* Risk indicator dot */}
          <span className={`shrink-0 h-3 w-3 rounded-full ${riskColor[report.risk_level]}`} />

          {/* Type icon */}
          {report.report_type === "injury" ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}

          {/* Title + location */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-card-foreground truncate block group-hover:text-accent transition-colors">
              {capitalize(report.title)}
            </span>
            <span className="text-xs text-muted-foreground truncate block">
              {[report.building, report.specific_location, report.category].filter(Boolean).join(" · ")}
            </span>
            {report.description && (
              <span className="text-xs text-muted-foreground/70 line-clamp-1 block mt-0.5">
                {report.description}
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

          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-accent transition-colors" />
        </div>
      ))}
    </div>
  );
}

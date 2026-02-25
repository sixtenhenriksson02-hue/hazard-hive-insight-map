import { RiskReport, ReportStatus } from "@/hooks/useReports";
import { useLanguage } from "@/hooks/useLanguage";
import { MapPin, Calendar, User, ChevronRight, AlertTriangle, FileText, Bot } from "lucide-react";

interface ReportsListProps {
  reports: RiskReport[];
  isAdmin: boolean;
  onUpdateStatus?: (id: string, status: ReportStatus) => void;
  onSelect: (report: RiskReport) => void;
}

const riskBadgeClass: Record<string, string> = {
  low: "bg-risk-low/15 text-risk-low",
  medium: "bg-risk-medium/15 text-risk-medium",
  high: "bg-risk-high/15 text-risk-high",
  critical: "bg-risk-critical/15 text-risk-critical",
};

const statusDotClass: Record<string, string> = {
  open: "bg-status-open",
  "in-progress": "bg-status-in-progress",
  resolved: "bg-status-resolved",
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
    <div className="space-y-3">
      {reports.map((report, i) => (
        <div
          key={report.id}
          onClick={() => onSelect(report)}
          className="group rounded-lg border border-border bg-card p-4 md:p-5 hover:border-accent/40 transition-all cursor-pointer animate-fade-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskBadgeClass[report.risk_level]}`}>
                  {t(`risk.${report.risk_level}`)}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className={`inline-block h-2 w-2 rounded-full ${statusDotClass[report.status]}`} />
                  {report.status === "open" ? t("status.open") : report.status === "in-progress" ? t("status.inProgress") : t("status.resolved")}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                {report.report_type === "injury" ? (
                  <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                    <AlertTriangle className="h-3 w-3" />{t("form.injury")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />{t("form.observation")}
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-card-foreground group-hover:text-accent transition-colors truncate">
                {report.title}
              </h3>

              {/* AI explanation preview */}
              {report.ai_explanation && (
                <p className="text-xs text-accent/80 mt-1 line-clamp-1 flex items-center gap-1">
                  <Bot className="h-3 w-3 shrink-0" />
                  {report.ai_explanation}
                </p>
              )}

              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {report.description || report.category}
              </p>

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                {report.building && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{report.building}{report.specific_location ? ` – ${report.specific_location}` : ""}</span>
                )}
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(report.created_at).toLocaleDateString("sv-SE")}</span>
                {isAdmin && report.reporter_name && (
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{report.reporter_name}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
              {isAdmin && report.status !== "resolved" && onUpdateStatus && (
                <select
                  className="text-xs border border-border rounded-md px-2 py-1 bg-card text-card-foreground"
                  value={report.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(report.id, e.target.value as ReportStatus);
                  }}
                >
                  <option value="open">{t("status.open")}</option>
                  <option value="in-progress">{t("status.inProgress")}</option>
                  <option value="resolved">{t("status.resolved")}</option>
                </select>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

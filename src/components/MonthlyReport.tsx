import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RiskReport } from "@/hooks/useReports";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, TrendingUp, Shield, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from "lucide-react";

interface MonthlyReportProps {
  reports: RiskReport[];
}

interface MonthlyReportData {
  summary: string;
  key_risks: { risk: string; severity: string; count: number; recommendation: string }[];
  trends: string[];
  improvements: string[];
  action_plan: { action: string; priority: string; responsible: string }[];
}

const riskDotColor: Record<string, string> = {
  low: "bg-risk-low",
  medium: "bg-risk-medium",
  high: "bg-risk-high",
  critical: "bg-risk-critical",
};

const priorityLabel: Record<string, string> = {
  high: "Hög",
  medium: "Medel",
  low: "Låg",
};

const priorityColor: Record<string, string> = {
  high: "text-risk-high",
  medium: "text-risk-medium",
  low: "text-risk-low",
};

export default function MonthlyReport({ reports }: MonthlyReportProps) {
  const { t } = useLanguage();
  const { activeProjectId } = useAuth();
  const { projects } = useProjects();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const projectName = projects.find(p => p.id === activeProjectId)?.name ?? t("project.allProjects");

  const getMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("sv-SE", { year: "numeric", month: "long" });
  };

  const generateReport = async () => {
    setLoading(true);
    setReport(null);

    const [year, month] = selectedMonth.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const monthReports = reports.filter(r => {
      const d = new Date(r.created_at);
      return d >= new Date(startDate) && d <= new Date(endDate);
    });

    try {
      const { data, error } = await supabase.functions.invoke("monthly-report", {
        body: {
          reports: monthReports.map(r => ({
            title: r.title,
            description: r.description,
            category: r.category,
            risk_level: r.risk_level,
            status: r.status,
            report_type: r.report_type,
            building: r.building,
            specific_location: r.specific_location,
            body_part: r.body_part,
            injury_type: r.injury_type,
            ai_explanation: r.ai_explanation,
          })),
          project_name: projectName,
          month_label: getMonthLabel(selectedMonth),
        },
      });

      if (error) throw error;
      setReport(data);
    } catch (e) {
      console.error("Monthly report error:", e);
    }
    setLoading(false);
  };

  // Generate month options for last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { value: val, label: getMonthLabel(val) };
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs"
      >
        <FileText className="h-4 w-4 mr-1.5" />
        {t("monthly.generate")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              {t("monthly.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-3 mb-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              {monthOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <Button onClick={generateReport} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("monthly.generating")}
                </span>
              ) : (
                t("monthly.generate")
              )}
            </Button>
          </div>

          {report && (
            <div className="space-y-5 animate-fade-in">
              {/* Header */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="text-sm font-bold text-card-foreground mb-1">
                  {projectName} — {getMonthLabel(selectedMonth)}
                </h3>
                <p className="text-sm text-muted-foreground">{report.summary}</p>
              </div>

              {/* Key Risks */}
              <div>
                <h3 className="text-sm font-bold text-card-foreground flex items-center gap-1.5 mb-3">
                  <AlertTriangle className="h-4 w-4 text-risk-high" />
                  {t("monthly.keyRisks")}
                </h3>
                <div className="space-y-2">
                  {report.key_risks.map((risk, i) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${riskDotColor[risk.severity]}`} />
                        <span className="text-sm font-medium text-card-foreground">{risk.risk}</span>
                        <span className="text-xs text-muted-foreground ml-auto">({risk.count} st)</span>
                      </div>
                      <div className="flex items-start gap-1.5 ml-4.5">
                        <ArrowRight className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                        <span className="text-xs text-muted-foreground">{risk.recommendation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trends */}
              <div>
                <h3 className="text-sm font-bold text-card-foreground flex items-center gap-1.5 mb-3">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  {t("monthly.trends")}
                </h3>
                <ul className="space-y-1.5">
                  {report.trends.map((trend, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {trend}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div>
                <h3 className="text-sm font-bold text-card-foreground flex items-center gap-1.5 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-risk-low" />
                  {t("monthly.improvements")}
                </h3>
                <ul className="space-y-1.5">
                  {report.improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-risk-low shrink-0 mt-0.5" />
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Plan */}
              <div>
                <h3 className="text-sm font-bold text-card-foreground flex items-center gap-1.5 mb-3">
                  <Shield className="h-4 w-4 text-primary" />
                  {t("monthly.actionPlan")}
                </h3>
                <div className="space-y-2">
                  {report.action_plan.map((action, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-card-foreground">{action.action}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className={`font-medium ${priorityColor[action.priority]}`}>
                            {priorityLabel[action.priority] ?? action.priority}
                          </span>
                          <span className="text-muted-foreground">{action.responsible}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

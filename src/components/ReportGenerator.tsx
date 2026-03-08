import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RiskReport } from "@/hooks/useReports";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, TrendingUp, Shield, CheckCircle2, AlertTriangle, Loader2, ArrowRight, Save } from "lucide-react";

interface ReportGeneratorProps {
  reports: RiskReport[];
}

interface ReportData {
  summary: string;
  key_risks: { risk: string; severity: string; count: number; recommendation: string }[];
  trends: string[];
  improvements: string[];
  action_plan: { action: string; priority: string; responsible: string }[];
}

type ReportType = "monthly" | "quarterly" | "yearly";

const riskDotColor: Record<string, string> = {
  low: "bg-risk-low",
  medium: "bg-risk-medium",
  high: "bg-risk-high",
  critical: "bg-risk-critical",
};

export default function ReportGenerator({ reports }: ReportGeneratorProps) {
  const { lang, t } = useLanguage();
  const { activeProjectId, user } = useAuth();
  const { projects } = useProjects();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const projectName = projects.find(p => p.id === activeProjectId)?.name ?? t("project.allProjects");

  const getPeriodLabel = (period: string, type: ReportType) => {
    const [year, month] = period.split("-").map(Number);
    if (type === "yearly") return `${year}`;
    if (type === "quarterly") {
      const q = Math.ceil(month / 3);
      return `Q${q} ${year}`;
    }
    const date = new Date(year, month - 1);
    return date.toLocaleDateString(lang === "en" ? "en-US" : "sv-SE", { year: "numeric", month: "long" });
  };

  const getFilteredReports = () => {
    const [year, month] = selectedPeriod.split("-").map(Number);
    let startDate: Date, endDate: Date;

    if (reportType === "yearly") {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    } else if (reportType === "quarterly") {
      const q = Math.ceil(month / 3);
      startDate = new Date(year, (q - 1) * 3, 1);
      endDate = new Date(year, q * 3, 0, 23, 59, 59);
    } else {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    }

    return reports.filter(r => {
      const d = new Date(r.created_at);
      return d >= startDate && d <= endDate;
    });
  };

  const generateReport = async () => {
    setLoading(true);
    setReport(null);

    const periodReports = getFilteredReports();
    const periodLabel = getPeriodLabel(selectedPeriod, reportType);

    try {
      const { data, error } = await supabase.functions.invoke("generate-report", {
        body: {
          reports: periodReports.map(r => ({
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
          period_label: periodLabel,
          report_type: reportType,
          language: lang,
        },
      });

      if (error) throw error;
      setReport(data);
    } catch (e) {
      console.error("Report generation error:", e);
      toast({ title: t("reportGen.error"), variant: "destructive" });
    }
    setLoading(false);
  };

  const saveDocument = async () => {
    if (!report || !user) return;
    setSaving(true);

    const periodLabel = getPeriodLabel(selectedPeriod, reportType);
    const title = `${t(`reportGen.${reportType}`)} — ${projectName} — ${periodLabel}`;

    const { error } = await supabase.from("documents").insert({
      title,
      document_type: reportType,
      period_label: periodLabel,
      project_id: activeProjectId,
      project_name: projectName,
      content: report as any,
      language: lang,
      created_by: user.id,
    });

    if (error) {
      toast({ title: t("reportGen.saveError"), variant: "destructive" });
    } else {
      toast({ title: t("reportGen.saved") });
    }
    setSaving(false);
  };

  // Generate period options
  const periodOptions = reportType === "yearly"
    ? Array.from({ length: 5 }, (_, i) => {
        const y = new Date().getFullYear() - i;
        return { value: `${y}-01`, label: `${y}` };
      })
    : reportType === "quarterly"
    ? Array.from({ length: 8 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i * 3);
        const q = Math.ceil((d.getMonth() + 1) / 3);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return { value: val, label: `Q${q} ${d.getFullYear()}` };
      })
    : Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return { value: val, label: getPeriodLabel(val, "monthly") };
      });

  const priorityLabel: Record<string, Record<string, string>> = {
    high: { sv: "Hög", en: "High" },
    medium: { sv: "Medel", en: "Medium" },
    low: { sv: "Låg", en: "Low" },
  };
  const priorityColor: Record<string, string> = {
    high: "text-risk-high",
    medium: "text-risk-medium",
    low: "text-risk-low",
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-xs">
        <FileText className="h-4 w-4 mr-1.5" />
        {t("reportGen.button")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              {t("reportGen.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Report type selector */}
            <div className="flex gap-1">
              {(["monthly", "quarterly", "yearly"] as ReportType[]).map(type => (
                <button
                  key={type}
                  onClick={() => { setReportType(type); setReport(null); }}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    reportType === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-accent"
                  }`}
                >
                  {t(`reportGen.${type}`)}
                </button>
              ))}
            </div>

            <select
              value={selectedPeriod}
              onChange={(e) => { setSelectedPeriod(e.target.value); setReport(null); }}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              {periodOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <Button onClick={generateReport} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("reportGen.generating")}
                </span>
              ) : (
                t("reportGen.generate")
              )}
            </Button>
          </div>

          {report && (
            <div className="space-y-5 animate-fade-in">
              {/* Save button */}
              <div className="flex justify-end">
                <Button onClick={saveDocument} disabled={saving} variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-1.5" />
                  {saving ? t("common.loading") : t("reportGen.saveDoc")}
                </Button>
              </div>

              {/* Header */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="text-sm font-bold text-card-foreground mb-1">
                  {projectName} — {getPeriodLabel(selectedPeriod, reportType)}
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
                        <span className="text-xs text-muted-foreground ml-auto">({risk.count})</span>
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
                            {priorityLabel[action.priority]?.[lang] ?? action.priority}
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

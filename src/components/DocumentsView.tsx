import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Trash2, Eye, Calendar, TrendingUp, Shield, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

interface DocumentRecord {
  id: string;
  title: string;
  document_type: string;
  period_label: string;
  project_name: string | null;
  content: any;
  language: string;
  created_at: string;
}

const riskDotColor: Record<string, string> = {
  low: "bg-risk-low",
  medium: "bg-risk-medium",
  high: "bg-risk-high",
  critical: "bg-risk-critical",
};

const priorityColor: Record<string, string> = {
  high: "text-risk-high",
  medium: "text-risk-medium",
  low: "text-risk-low",
};

export default function DocumentsView() {
  const { viewAs } = useAuth();
  const { t, lang } = useLanguage();
  const isAdmin = viewAs === "admin";
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchDocs = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setDocs(data as DocumentRecord[]);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const deleteDoc = async (id: string) => {
    await supabase.from("documents").delete().eq("id", id);
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const filteredDocs = filter === "all" ? docs : docs.filter(d => d.document_type === filter);

  const typeLabel: Record<string, string> = {
    monthly: t("reportGen.monthly"),
    quarterly: t("reportGen.quarterly"),
    yearly: t("reportGen.yearly"),
  };

  const priorityLabel: Record<string, string> = {
    high: lang === "sv" ? "Hög" : "High",
    medium: lang === "sv" ? "Medel" : "Medium",
    low: lang === "sv" ? "Låg" : "Low",
  };

  return (
    <>
      <div className="flex gap-2 mb-4">
        {["all", "monthly", "quarterly", "yearly"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-accent"
            }`}
          >
            {f === "all" ? t("common.all") : typeLabel[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">{t("common.loading")}</p>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("documents.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
              <FileText className="h-8 w-8 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-card-foreground truncate">{doc.title}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                    {typeLabel[doc.document_type] ?? doc.document_type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(doc.created_at).toLocaleDateString(lang === "en" ? "en-US" : "sv-SE")}
                  </span>
                  <span className="uppercase text-[10px] font-bold">{doc.language}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedDoc(doc)}>
                  <Eye className="h-4 w-4" />
                </Button>
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => deleteDoc(doc.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedDoc} onOpenChange={(o) => !o && setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              {selectedDoc?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedDoc?.content && (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">{selectedDoc.content.summary}</p>
              </div>
              {selectedDoc.content.key_risks?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-card-foreground flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="h-4 w-4 text-risk-high" />
                    {t("monthly.keyRisks")}
                  </h3>
                  <div className="space-y-2">
                    {selectedDoc.content.key_risks.map((risk: any, i: number) => (
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
              )}
              {selectedDoc.content.trends?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-card-foreground flex items-center gap-1.5 mb-3">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    {t("monthly.trends")}
                  </h3>
                  <ul className="space-y-1.5">
                    {selectedDoc.content.trends.map((trend: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        {trend}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedDoc.content.improvements?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-card-foreground flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-risk-low" />
                    {t("monthly.improvements")}
                  </h3>
                  <ul className="space-y-1.5">
                    {selectedDoc.content.improvements.map((imp: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-risk-low shrink-0 mt-0.5" />
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedDoc.content.action_plan?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-card-foreground flex items-center gap-1.5 mb-3">
                    <Shield className="h-4 w-4 text-primary" />
                    {t("monthly.actionPlan")}
                  </h3>
                  <div className="space-y-2">
                    {selectedDoc.content.action_plan.map((action: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
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
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

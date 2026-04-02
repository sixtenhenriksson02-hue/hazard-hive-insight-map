import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Trash2, Eye, Calendar, Download, Building2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { generateFormalPDF } from "@/lib/pdfTemplate";

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


// PDF download now uses the shared formal template

export default function DocumentsView() {
  const { viewAs } = useAuth();
  const { t, lang } = useLanguage();
  const isAdmin = viewAs === "admin";
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

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

  const filteredDocs = useMemo(() => {
    let result = filter === "all" ? docs : docs.filter(d => d.document_type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        (d.project_name && d.project_name.toLowerCase().includes(q)) ||
        d.period_label.toLowerCase().includes(q)
      );
    }
    return result;
  }, [docs, filter, search]);

  const typeLabel: Record<string, string> = {
    monthly: t("reportGen.monthly"),
    quarterly: t("reportGen.quarterly"),
    yearly: t("reportGen.yearly"),
  };

  const typeIcon: Record<string, string> = {
    monthly: "M",
    quarterly: "Q",
    yearly: "Å",
  };

  const sectionTitle = (sv: string, en: string) => lang === "en" ? en : sv;

  const renderDocContent = (content: any) => {
    const isProseFormat = typeof content.risk_analysis === "string";

    if (isProseFormat) {
      const sections = [
        { key: "summary", sv: "Sammanfattning", en: "Executive Summary" },
        { key: "risk_analysis", sv: "Riskanalys", en: "Risk Analysis" },
        { key: "trends", sv: "Trender och mönster", en: "Trends and Patterns" },
        { key: "improvements", sv: "Positiva resultat", en: "Positive Results" },
        { key: "action_plan", sv: "Åtgärdsplan", en: "Action Plan" },
        { key: "conclusion", sv: "Slutsats", en: "Conclusion" },
      ];

      return (
        <div className="space-y-6">
          {sections.map(s => {
            const text = content[s.key];
            if (!text) return null;
            return (
              <section key={s.key}>
                <h3 className="text-sm font-bold text-card-foreground mb-3 border-b border-border pb-2 uppercase tracking-wide">
                  {sectionTitle(s.sv, s.en)}
                </h3>
                <div className="text-sm text-card-foreground/80 leading-relaxed whitespace-pre-line">
                  {text.split("\n").filter(Boolean).map((paragraph: string, i: number) => (
                    <p key={i} className="mb-3">{paragraph}</p>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      );
    }

    // Legacy bullet-point format
    return (
      <div className="space-y-5">
        {content.summary && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="text-sm font-bold text-card-foreground mb-2 uppercase tracking-wide">{sectionTitle("Sammanfattning", "Summary")}</h3>
            <p className="text-sm text-card-foreground/80 leading-relaxed">{content.summary}</p>
          </div>
        )}
        {content.key_risks?.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-card-foreground mb-3 border-b border-border pb-2 uppercase tracking-wide">{sectionTitle("Nyckelrisker", "Key Risks")}</h3>
            <div className="space-y-2">
              {content.key_risks.map((risk: any, i: number) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <p className="text-sm text-card-foreground font-medium">{risk.risk}</p>
                  <p className="text-xs text-muted-foreground mt-1">{risk.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {content.trends?.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-card-foreground mb-3 border-b border-border pb-2 uppercase tracking-wide">{sectionTitle("Trender", "Trends")}</h3>
            {content.trends.map((trend: string, i: number) => (
              <p key={i} className="text-sm text-card-foreground/80 mb-2 leading-relaxed">{trend}</p>
            ))}
          </div>
        )}
        {content.improvements?.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-card-foreground mb-3 border-b border-border pb-2 uppercase tracking-wide">{sectionTitle("Förbättringar", "Improvements")}</h3>
            {content.improvements.map((imp: string, i: number) => (
              <p key={i} className="text-sm text-card-foreground/80 mb-2 leading-relaxed">{imp}</p>
            ))}
          </div>
        )}
        {content.action_plan?.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-card-foreground mb-3 border-b border-border pb-2 uppercase tracking-wide">{sectionTitle("Åtgärdsplan", "Action Plan")}</h3>
            {content.action_plan.map((action: any, i: number) => (
              <div key={i} className="rounded-lg border border-border p-3 mb-2">
                <p className="text-sm text-card-foreground">{action.action}</p>
                <p className="text-xs text-muted-foreground mt-1">{action.responsible}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
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
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={sectionTitle("Sök dokument...", "Search documents...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">{t("common.loading")}</p>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("documents.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-accent/40 transition-all cursor-pointer" onClick={() => setSelectedDoc(doc)}>
              <div className="shrink-0 h-10 w-10 rounded-lg bg-accent/10 text-accent font-bold text-sm flex items-center justify-center">
                {typeIcon[doc.document_type] ?? "D"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-card-foreground truncate group-hover:text-accent transition-colors">{doc.title}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                    {typeLabel[doc.document_type] ?? doc.document_type}
                  </span>
                  {doc.project_name && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {doc.project_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(doc.created_at).toLocaleDateString(lang === "en" ? "en-US" : "sv-SE")}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                <Button variant="outline" size="sm" onClick={() => generateFormalPDF(doc.content, doc.title, doc.language, doc.project_name, doc.period_label, doc.document_type)}>
                  <Download className="h-4 w-4" />
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              {selectedDoc?.title}
            </DialogTitle>
            {selectedDoc?.project_name && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Building2 className="h-3 w-3" />
                {selectedDoc.project_name} · {selectedDoc.period_label} · {new Date(selectedDoc.created_at).toLocaleDateString(lang === "en" ? "en-US" : "sv-SE")}
              </p>
            )}
          </DialogHeader>
          {selectedDoc?.content && (
            <div className="animate-fade-in">
              <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={() => downloadDocPDF(selectedDoc.content, selectedDoc.title, selectedDoc.language, selectedDoc.project_name)}>
                  <Download className="h-4 w-4 mr-1.5" />
                  {t("reportGen.downloadPdf")}
                </Button>
              </div>
              {renderDocContent(selectedDoc.content)}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

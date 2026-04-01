import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RiskReport, RiskLevel, useComments } from "@/hooks/useReports";
import { CATEGORIES_I18N } from "@/lib/translations";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Calendar, User, MessageSquare, Pencil, Send, Building2, AlertTriangle, Bot, RefreshCw, CheckCircle2, Languages, Loader2 } from "lucide-react";

interface ReportDetailProps {
  report: RiskReport | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: any) => void;
  onReassess?: (id: string) => Promise<void>;
}

const riskBadgeClass: Record<string, string> = {
  low: "bg-risk-low/15 text-risk-low",
  medium: "bg-risk-medium/15 text-risk-medium",
  high: "bg-risk-high/15 text-risk-high",
  critical: "bg-risk-critical/15 text-risk-critical",
};

const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];

export default function ReportDetail({ report, open, onClose, onUpdate, onReassess }: ReportDetailProps) {
  const { viewAs, user } = useAuth();
  const { lang, t } = useLanguage();
  const isAdmin = viewAs === "admin";
  const { comments, addComment } = useComments(report?.id ?? null);
  const [newComment, setNewComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", location: "", category: "" });
  const [reassessing, setReassessing] = useState(false);
  const [translatedExplanation, setTranslatedExplanation] = useState<string | null>(null);
  const [translatedActions, setTranslatedActions] = useState<string[] | null>(null);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);

  if (!report) return null;

  const canEdit = isAdmin || report.reported_by === user?.id;
  const categories = CATEGORIES_I18N[lang];

  const startEdit = () => {
    setEditForm({
      title: report.title,
      description: report.description,
      location: report.location,
      category: report.category,
    });
    setEditing(true);
  };

  const saveEdit = () => {
    onUpdate(report.id, editForm);
    setEditing(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment.trim());

    // Check if comment mentions fixing/resolving - trigger reassessment
    const fixKeywords = ["åtgärd", "fixad", "fixed", "resolved", "löst", "reparerad", "korrigerad", "repaired", "corrected"];
    const lowerComment = newComment.toLowerCase();
    if (fixKeywords.some(k => lowerComment.includes(k)) && onReassess && report.status !== "resolved") {
      setReassessing(true);
      await onReassess(report.id);
      setReassessing(false);
    }

    setNewComment("");
  };

  const handleOverrideRisk = (newLevel: RiskLevel) => {
    onUpdate(report.id, {
      risk_level: newLevel,
      ai_explanation: `${report.ai_explanation ?? ""}\n\n[${t("detail.adminOverride")}]`,
    });
  };

  const handleReassess = async () => {
    if (!onReassess) return;
    setReassessing(true);
    await onReassess(report.id);
    setReassessing(false);
  };

  const handleTranslate = async () => {
    if (showTranslated && translatedTitle) {
      setShowTranslated(false);
      return;
    }
    if (translatedTitle) {
      setShowTranslated(true);
      return;
    }
    setTranslating(true);
    try {
      const textsToTranslate = [
        report.title,
        report.description,
        report.ai_explanation ?? "",
        ...(report.suggested_actions ?? []),
      ].filter(Boolean);
      const targetLang = "en"; // Reports are written in Swedish, always translate to English
      const { data, error } = await supabase.functions.invoke("translate-text", {
        body: { texts: textsToTranslate, target_language: targetLang },
      });
      if (!error && data?.translations) {
        let idx = 0;
        setTranslatedTitle(data.translations[idx++]);
        setTranslatedDescription(data.translations[idx++]);
        if (report.ai_explanation) {
          setTranslatedExplanation(data.translations[idx++]);
        }
        setTranslatedActions(data.translations.slice(idx));
        setShowTranslated(true);
      }
    } catch (e) {
      console.error("Translation error:", e);
    }
    setTranslating(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskBadgeClass[report.risk_level]}`}>
              {t(`risk.${report.risk_level}`)}
            </span>
            {report.report_type === "injury" && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />{t("form.injury")}
              </span>
            )}
            {editing ? (
              <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
            ) : (
              <span className="truncate">{showTranslated && translatedTitle ? translatedTitle.charAt(0).toUpperCase() + translatedTitle.slice(1) : report.title ? report.title.charAt(0).toUpperCase() + report.title.slice(1) : report.title}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Global translate button */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs" onClick={handleTranslate} disabled={translating}>
              {translating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Languages className="h-3 w-3 mr-1" />}
              {translating ? t("translate.translating") : showTranslated ? t("translate.original") : t("translate.button")}
            </Button>
          </div>

          {report.image_url && (
            <img src={report.image_url} alt="" className="w-full h-48 object-cover rounded-md" />
          )}

          {/* AI Explanation */}
          {report.ai_explanation && (
            <div className="rounded-md border border-accent/20 bg-accent/5 p-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-semibold text-accent flex items-center gap-1">
                  <Bot className="h-3.5 w-3.5" /> {t("detail.aiAssessment")}
                </h4>
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleReassess} disabled={reassessing}>
                      <RefreshCw className={`h-3 w-3 mr-1 ${reassessing ? "animate-spin" : ""}`} />
                      {t("detail.reassess")}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {showTranslated && translatedExplanation ? translatedExplanation : report.ai_explanation}
              </p>
            </div>
          )}

          {/* Suggested Actions */}
          {report.suggested_actions && report.suggested_actions.length > 0 && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <h4 className="text-xs font-semibold text-primary flex items-center gap-1 mb-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> {t("detail.suggestedActions")}
              </h4>
              <ul className="space-y-1.5">
                {(showTranslated && translatedActions ? translatedActions : report.suggested_actions).map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-card-foreground">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] mt-0.5">
                      {i + 1}
                    </span>
                    <span>{action.replace(/^\[PRIO\]\s*/i, "").replace(/^\d+[\.\)]\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Admin risk override */}
          {isAdmin && !editing && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">{t("detail.overrideRisk")}:</span>
              {RISK_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => handleOverrideRisk(level)}
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-all ${
                    report.risk_level === level
                      ? `${riskBadgeClass[level]} ring-2 ring-offset-1 ring-current`
                      : `${riskBadgeClass[level]} opacity-50 hover:opacity-100`
                  }`}
                >
                  {t(`risk.${level}`)}
                </button>
              ))}
            </div>
          )}

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{t("form.description")}</label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t("detail.location")}</label>
                <Input value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t("form.category")}</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEdit} size="sm" className="bg-accent text-accent-foreground">{t("common.save")}</Button>
                <Button onClick={() => setEditing(false)} size="sm" variant="outline">{t("common.cancel")}</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{showTranslated && translatedDescription ? translatedDescription : report.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {report.building && (
                  <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{report.building}</span>
                )}
                {report.specific_location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{report.specific_location}</span>
                )}
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(report.created_at).toLocaleDateString("sv-SE")}</span>
                {isAdmin && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{report.reporter_name ?? "–"}</span>}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{t("detail.status")}:</span>
                 <span className="font-medium">
                  {report.status === "resolved" ? t("status.resolved") : t("status.open")}
                </span>
                <span className="text-muted-foreground">•</span>
                <span>{report.category}</span>
              </div>

              {/* Injury details */}
              {report.report_type === "injury" && (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 space-y-1">
                  <h4 className="text-sm font-semibold text-destructive">{t("detail.injuryDetails")}</h4>
                  {report.body_part && <p className="text-xs"><span className="font-medium">{t("injury.bodyPart")}:</span> {report.body_part}</p>}
                  {report.injury_type && <p className="text-xs"><span className="font-medium">{t("injury.type")}:</span> {report.injury_type}</p>}
                  <p className="text-xs"><span className="font-medium">{t("injury.medicalCare")}:</span> {report.medical_care_required ? t("common.yes") : t("common.no")}</p>
                  <p className="text-xs"><span className="font-medium">{t("injury.absence")}:</span> {report.absence_required ? `${t("common.yes")} (${report.absence_days} ${t("common.days")})` : t("common.no")}</p>
                </div>
              )}

              {canEdit && (
                <Button onClick={startEdit} size="sm" variant="outline">
                  <Pencil className="h-3.5 w-3.5 mr-1" /> {t("common.edit")}
                </Button>
              )}
            </>
          )}

          {/* Comments */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
              <MessageSquare className="h-4 w-4" /> {t("detail.comments")} ({comments.length})
            </h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="rounded-md bg-muted p-3">
                  <p className="text-sm">{c.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(c.created_at).toLocaleString("sv-SE")}
                  </p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-xs text-muted-foreground">{t("detail.noComments")}</p>}
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                placeholder={t("detail.writeComment")}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <Button onClick={handleAddComment} size="icon" className="bg-accent text-accent-foreground shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

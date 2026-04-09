import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Send, MapPin, Building2, SpellCheck, Loader2, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { CATEGORIES_I18N, INJURY_CATEGORIES_I18N, IMPROVEMENT_CATEGORIES_I18N, BODY_PARTS_I18N, INJURY_TYPES_I18N } from "@/lib/translations";
import { ReportType } from "@/hooks/useReports";
import SitePlanViewer from "@/components/SitePlanViewer";
import { supabase } from "@/integrations/supabase/client";

interface ReportFormProps {
  onSubmit: (report: {
    title: string;
    description: string;
    location: string;
    category: string;
    imageFile?: File;
    report_type: ReportType;
    building?: string;
    specific_location?: string;
    body_part?: string;
    injury_type?: string;
    medical_care_required?: boolean;
    absence_required?: boolean;
    absence_days?: number;
    severity_rating?: number;
    project_id?: string;
    site_plan_id?: string;
    plan_x?: number;
    plan_y?: number;
  }) => void;
  onClose?: () => void;
}

interface SpellCheckDiff {
  originalTitle: string;
  originalDescription: string;
  correctedTitle: string;
  correctedDescription: string;
  hadErrors: boolean;
}

export default function ReportForm({ onSubmit, onClose }: ReportFormProps) {
  const { toast } = useToast();
  const { lang, t } = useLanguage();
  const { role, activeProjectId, userProjects } = useAuth();
  const { projects } = useProjects();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = role === "admin";

  // Step management: 0=type+what, 1=where, 2=details(optional)
  const [step, setStep] = useState(0);

  const [reportType, setReportType] = useState<ReportType>("observation");
  // title is auto-generated from description
  const [description, setDescription] = useState("");
  const [specificLocation, setSpecificLocation] = useState("");
  const [category, setCategory] = useState(CATEGORIES_I18N[lang][0]);
  const [bodyPart, setBodyPart] = useState("");
  const [injuryType, setInjuryType] = useState("");
  const [medicalCare, setMedicalCare] = useState(false);
  const [absenceRequired, setAbsenceRequired] = useState(false);
  const [absenceDays, setAbsenceDays] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState(activeProjectId ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [planLocation, setPlanLocation] = useState<{ planId: string; x: number; y: number } | null>(null);
  const [spellChecking, setSpellChecking] = useState(false);
  const [spellChecked, setSpellChecked] = useState(false);
  const [showSpellReview, setShowSpellReview] = useState(false);
  const [spellDiff, setSpellDiff] = useState<SpellCheckDiff | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem("report-draft");
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.description) setDescription(d.description);
        if (d.reportType) setReportType(d.reportType);
        if (d.category) setCategory(d.category);
        if (d.specificLocation) setSpecificLocation(d.specificLocation);
        if (d.step) setStep(d.step);
        toast({ title: t("draft.restored") });
      } catch {}
      localStorage.removeItem("report-draft");
    }
  }, []);

  const hasContent = description.trim().length > 0 || specificLocation.trim().length > 0;

  const saveDraft = () => {
    localStorage.setItem("report-draft", JSON.stringify({
      description, reportType, category, specificLocation, step,
    }));
    setShowDraftDialog(false);
    onClose?.();
  };

  const discardDraft = () => {
    localStorage.removeItem("report-draft");
    setShowDraftDialog(false);
    onClose?.();
  };

  const handleClose = () => {
    if (hasContent) {
      setShowDraftDialog(true);
    } else {
      onClose?.();
    }
  };

  const categories = reportType === "injury" ? INJURY_CATEGORIES_I18N[lang] : reportType === "improvement" ? IMPROVEMENT_CATEGORIES_I18N[lang] : CATEGORIES_I18N[lang];
  const bodyParts = BODY_PARTS_I18N[lang];
  const injuryTypes = INJURY_TYPES_I18N[lang];

  const availableProjects = isAdmin ? projects : userProjects.map(up => ({ id: up.project_id, name: up.project_name }));
  const currentProjectName = availableProjects.find(p => p.id === (selectedProjectId || activeProjectId))?.name ?? "";

  const totalSteps = reportType === "injury" ? 3 : 2;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const runSpellCheck = async (titleText: string, descText: string): Promise<SpellCheckDiff | null> => {
    const textsToCheck = [titleText, descText].filter(t => t.trim().length > 0);
    if (textsToCheck.length === 0) return null;
    try {
      const { data, error } = await supabase.functions.invoke("spellcheck", {
        body: { texts: textsToCheck },
      });
      if (!error && data?.corrected && data.corrected.length > 0) {
        let idx = 0;
        const correctedTitle = titleText.trim() ? data.corrected[idx++] : titleText;
        const correctedDesc = descText.trim() && idx < data.corrected.length ? data.corrected[idx] : descText;
        return {
          originalTitle: titleText,
          originalDescription: descText,
          correctedTitle,
          correctedDescription: correctedDesc,
          hadErrors: data.had_errors ?? false,
        };
      }
    } catch (e) {
      console.error("Spellcheck error:", e);
    }
    return null;
  };

  const doSubmit = async (finalTitle: string, finalDescription: string) => {
    setSubmitting(true);
    const pid = selectedProjectId || activeProjectId || "";
    const building = availableProjects.find(p => p.id === pid)?.name ?? "";
    const capitalizedTitle = finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1);

    await onSubmit({
      title: capitalizedTitle,
      description: finalDescription,
      location: `${building} - ${specificLocation}`,
      category,
      imageFile: imageFile ?? undefined,
      report_type: reportType,
      building,
      specific_location: specificLocation,
      body_part: reportType === "injury" ? bodyPart : undefined,
      injury_type: reportType === "injury" ? injuryType : undefined,
      medical_care_required: reportType === "injury" ? medicalCare : false,
      absence_required: reportType === "injury" ? absenceRequired : false,
      absence_days: reportType === "injury" ? absenceDays : 0,
      project_id: pid,
      site_plan_id: planLocation?.planId,
      plan_x: planLocation?.x,
      plan_y: planLocation?.y,
    });

    setSubmitting(false);
    setStep(0);
    setDescription("");
    setSpecificLocation("");
    setCategory(categories[0]);
    setBodyPart("");
    setInjuryType("");
    setMedicalCare(false);
    setAbsenceRequired(false);
    setAbsenceDays(0);
    setImageFile(null);
    setImagePreview(null);
    setPlanLocation(null);
    setShowPlanPicker(false);
  };

  // Auto-generate a title from the description (first ~60 chars)
  const generateTitle = (text: string): string => {
    const firstLine = text.split('\n')[0].trim();
    if (firstLine.length <= 60) return firstLine;
    return firstLine.substring(0, 57) + "...";
  };

  const handleSubmit = async () => {
    if (!description.trim() || !specificLocation) {
      toast({ title: t("form.fillAllFields"), variant: "destructive" });
      return;
    }

    const autoTitle = generateTitle(description);

    // Auto spell-check before submitting
    if (!spellChecked && description.trim()) {
      setSubmitting(true);
      const result = await runSpellCheck(autoTitle, description);
      setSubmitting(false);

      if (result && result.hadErrors &&
          (result.originalTitle !== result.correctedTitle || result.originalDescription !== result.correctedDescription)) {
        setSpellDiff(result);
        setShowSpellReview(true);
        return;
      }
    }

    await doSubmit(autoTitle, description);
  };

  const handleAcceptSpellCheck = async () => {
    if (!spellDiff) return;
    setShowSpellReview(false);
    setDescription(spellDiff.correctedDescription);
    setSpellChecked(true);
    const autoTitle = generateTitle(spellDiff.correctedDescription);
    await doSubmit(autoTitle, spellDiff.correctedDescription);
    setSpellDiff(null);
  };

  const handleRejectSpellCheck = async () => {
    if (!spellDiff) return;
    setShowSpellReview(false);
    setSpellChecked(true);
    const autoTitle = generateTitle(spellDiff.originalDescription);
    await doSubmit(autoTitle, spellDiff.originalDescription);
    setSpellDiff(null);
  };

  const canGoNext = () => {
    if (step === 0) return description.trim().length > 5;
    if (step === 1) return specificLocation.trim().length > 0;
    return true;
  };

  const stepLabels = lang === "sv"
    ? [reportType === "improvement" ? "Ditt förslag" : "Vad hände?", "Var?", "Skadedetaljer"]
    : [reportType === "improvement" ? "Your suggestion" : "What happened?", "Where?", "Injury details"];

  return (
    <>
      <div className={`rounded-lg border border-border bg-card animate-fade-in transition-all ${
        expanded ? "fixed inset-4 z-50 overflow-y-auto p-5 md:p-6 shadow-xl" : "p-4 md:p-5"
      }`}>
        {expanded && <div className="fixed inset-0 bg-background/80 -z-10" onClick={() => setExpanded(false)} />}
        {/* Header with step indicator */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-card-foreground">{t("dashboard.newReport")}</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-accent" : i < step ? "w-4 bg-accent/40" : "w-4 bg-muted"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={expanded ? (lang === "sv" ? "Förminska" : "Minimize") : (lang === "sv" ? "Förstora" : "Expand")}
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title={lang === "sv" ? "Stäng" : "Close"}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Step title */}
        <p className="text-xs text-muted-foreground mb-3 font-medium">
          {lang === "sv" ? "Steg" : "Step"} {step + 1}: {stepLabels[step]}
        </p>

        {/* STEP 0: What happened */}
        {step === 0 && (
          <div className="space-y-3">
            {/* Report type toggle - compact */}
            <div className="flex gap-1.5">
              {(["observation", "injury", "improvement"] as const).map((rt) => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => {
                    setReportType(rt);
                    setCategory(
                      rt === "injury" ? INJURY_CATEGORIES_I18N[lang][0] :
                      rt === "improvement" ? IMPROVEMENT_CATEGORIES_I18N[lang][0] :
                      CATEGORIES_I18N[lang][0]
                    );
                  }}
                  className={`flex-1 text-xs font-medium px-2 py-2 rounded-md border transition-colors ${
                    reportType === rt
                      ? rt === "injury"
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : rt === "improvement"
                          ? "bg-status-resolved text-white border-status-resolved"
                          : "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-accent"
                  }`}
                >
                  {rt === "injury" && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                  {rt === "observation" ? t("form.observation") : rt === "injury" ? t("form.injury") : t("form.improvement")}
                </button>
              ))}
            </div>

            {/* Main description field */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {lang === "sv" ? "Beskriv händelsen" : "Describe the incident"}
              </label>
              <Textarea
                placeholder={lang === "sv"
                  ? "Beskriv så detaljerat som möjligt vad som hände eller vilken risk du observerat. Ju mer detaljer desto bättre bedömning får du."
                  : "Describe in as much detail as possible what happened or what risk you observed. The more details, the better the assessment."
                }
                rows={expanded ? 8 : 4}
                value={description}
                onChange={(e) => { setDescription(e.target.value); setSpellChecked(false); }}
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">{t("form.aiNote")}</p>
            </div>

            {/* Category as quick-select chips */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("form.category")}</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                      category === c
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-card text-muted-foreground border-border hover:border-accent/50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Where */}
        {step === 1 && (
          <div className="space-y-3">
            {availableProjects.length > 1 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("form.project")}</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  value={selectedProjectId || activeProjectId || ""}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  {availableProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />{t("form.specificLocation")}
              </label>
              <Input
                placeholder={t("form.specificLocationPlaceholder")}
                value={specificLocation}
                onChange={(e) => setSpecificLocation(e.target.value)}
                autoFocus
              />
            </div>

            {/* Map placement - quick button */}
            <Button
              type="button"
              variant={planLocation ? "default" : "outline"}
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowPlanPicker(true)}
            >
              <MapPin className="h-3.5 w-3.5 mr-1" />
              {planLocation ? `✓ ${t("apd.placeOnPlan")}` : t("apd.placeOnPlan")}
            </Button>

            {/* Photo - compact */}
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground hover:border-accent hover:text-accent transition-colors w-full justify-center"
              >
                <Camera className="h-3.5 w-3.5" />{imagePreview ? t("form.changeImage") : t("form.uploadImage")}
              </button>
              {imagePreview && (
                <div className="mt-1.5 rounded-md overflow-hidden border border-border">
                  <img src={imagePreview} alt="" className="w-full h-24 object-cover" />
                </div>
              )}
            </div>

            <Dialog open={showPlanPicker} onOpenChange={setShowPlanPicker}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent" />
                    {t("apd.placeOnPlan")}
                  </DialogTitle>
                </DialogHeader>
                <SitePlanViewer
                  reports={[]}
                  selectionMode={true}
                  onSelectLocation={(planId, x, y) => {
                    setPlanLocation({ planId, x, y });
                    setShowPlanPicker(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* STEP 2: Injury details (only for injury type) */}
        {step === 2 && reportType === "injury" && (
          <div className="space-y-3 rounded-md border border-destructive/20 bg-destructive/5 p-3">
            <h3 className="text-xs font-semibold text-destructive">{t("detail.injuryDetails")}</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("injury.bodyPart")}</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs" value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}>
                  <option value="">--</option>
                  {bodyParts.map((bp) => <option key={bp} value={bp}>{bp}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("injury.type")}</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs" value={injuryType} onChange={(e) => setInjuryType(e.target.value)}>
                  <option value="">--</option>
                  {injuryTypes.map((it) => <option key={it} value={it}>{it}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={medicalCare} onChange={(e) => setMedicalCare(e.target.checked)} className="rounded border-border" />
                {t("injury.medicalCare")}
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={absenceRequired} onChange={(e) => setAbsenceRequired(e.target.checked)} className="rounded border-border" />
                {t("injury.absence")}
              </label>
            </div>
            {absenceRequired && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground">{t("injury.absenceDays")}:</label>
                <Input type="number" min={1} value={absenceDays} onChange={(e) => setAbsenceDays(Number(e.target.value))} className="w-16 h-8 text-xs" />
                <span className="text-xs text-muted-foreground">{t("common.days")}</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-2 mt-4">
          {step > 0 && (
            <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
              {lang === "sv" ? "Tillbaka" : "Back"}
            </Button>
          )}
          <div className="flex-1" />
          {step < totalSteps - 1 ? (
            <Button
              type="button"
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
              disabled={!canGoNext()}
              onClick={() => setStep(s => s + 1)}
            >
              {lang === "sv" ? "Nästa" : "Next"}
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
              disabled={submitting || !canGoNext()}
              onClick={handleSubmit}
            >
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  {t("form.assessing")}
                </span>
              ) : (
                <><Send className="h-3.5 w-3.5 mr-1" />{t("form.submitReport")}</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Spell check review dialog */}
      <Dialog open={showSpellReview} onOpenChange={setShowSpellReview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SpellCheck className="h-5 w-5 text-accent" />
              {t("spellcheck.reviewTitle")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("spellcheck.reviewDesc")}</p>

          {spellDiff && (
            <div className="space-y-4 mt-2">
              {spellDiff.originalTitle !== spellDiff.correctedTitle && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{t("form.title")}</p>
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm line-through text-muted-foreground">
                    {spellDiff.originalTitle}
                  </div>
                  <div className="rounded-md border border-green-500/30 bg-green-500/5 p-2 text-sm text-foreground">
                    {spellDiff.correctedTitle}
                  </div>
                </div>
              )}
              {spellDiff.originalDescription !== spellDiff.correctedDescription && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{t("form.description")}</p>
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm line-through text-muted-foreground">
                    {spellDiff.originalDescription}
                  </div>
                  <div className="rounded-md border border-green-500/30 bg-green-500/5 p-2 text-sm text-foreground">
                    {spellDiff.correctedDescription}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleRejectSpellCheck}>
              {t("spellcheck.reject")}
            </Button>
            <Button onClick={handleAcceptSpellCheck} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {t("spellcheck.accept")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Draft save dialog */}
      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("draft.saveTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("draft.saveMessage")}</p>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={discardDraft}>
              {t("draft.discard")}
            </Button>
            <Button onClick={saveDraft} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {t("draft.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

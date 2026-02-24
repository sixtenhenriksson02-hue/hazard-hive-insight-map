import { useState, useRef } from "react";
import { Camera, Send, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES_I18N, BODY_PARTS_I18N, INJURY_TYPES_I18N } from "@/lib/translations";
import { ReportType } from "@/hooks/useReports";

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
  }) => void;
}

export default function ReportForm({ onSubmit }: ReportFormProps) {
  const { toast } = useToast();
  const { lang, t } = useLanguage();
  const { projectName } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reportType, setReportType] = useState<ReportType>("observation");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specificLocation, setSpecificLocation] = useState("");
  const [category, setCategory] = useState(CATEGORIES_I18N[lang][0]);
  const [severityRating, setSeverityRating] = useState(1);
  const [bodyPart, setBodyPart] = useState("");
  const [injuryType, setInjuryType] = useState("");
  const [medicalCare, setMedicalCare] = useState(false);
  const [absenceRequired, setAbsenceRequired] = useState(false);
  const [absenceDays, setAbsenceDays] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const categories = CATEGORIES_I18N[lang];
  const bodyParts = BODY_PARTS_I18N[lang];
  const injuryTypes = INJURY_TYPES_I18N[lang];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !specificLocation) {
      toast({ title: t("form.fillAllFields"), variant: "destructive" });
      return;
    }
    onSubmit({
      title,
      description,
      location: `${projectName ?? ""} - ${specificLocation}`,
      category,
      imageFile: imageFile ?? undefined,
      report_type: reportType,
      building: projectName ?? "",
      specific_location: specificLocation,
      body_part: reportType === "injury" ? bodyPart : undefined,
      injury_type: reportType === "injury" ? injuryType : undefined,
      medical_care_required: reportType === "injury" ? medicalCare : false,
      absence_required: reportType === "injury" ? absenceRequired : false,
      absence_days: reportType === "injury" ? absenceDays : 0,
      severity_rating: severityRating,
    });
    // Reset
    setTitle("");
    setDescription("");
    setSpecificLocation("");
    setCategory(categories[0]);
    setSeverityRating(1);
    setBodyPart("");
    setInjuryType("");
    setMedicalCare(false);
    setAbsenceRequired(false);
    setAbsenceDays(0);
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4 md:p-6 animate-fade-in">
      <h2 className="text-lg font-bold text-card-foreground mb-4">{t("dashboard.newReport")}</h2>

      {/* Report type toggle */}
      <div className="flex gap-2 mb-4">
        {(["observation", "injury"] as const).map((rt) => (
          <button
            key={rt}
            type="button"
            onClick={() => setReportType(rt)}
            className={`flex-1 text-sm font-medium px-3 py-2.5 rounded-md border transition-colors ${
              reportType === rt
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-accent"
            }`}
          >
            {rt === "observation" ? t("form.observation") : t("form.injury")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {/* Title */}
        <div>
          <label className="text-sm font-medium text-card-foreground mb-1 block">{t("form.title")}</label>
          <Input placeholder={t("form.titlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {/* Building (auto-filled) + Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />{t("form.building")}
            </label>
            <Input value={projectName ?? "-"} disabled className="bg-muted" />
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />{t("form.specificLocation")}
            </label>
            <Input placeholder={t("form.specificLocationPlaceholder")} value={specificLocation} onChange={(e) => setSpecificLocation(e.target.value)} />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-card-foreground mb-1 block">{t("form.category")}</label>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Severity rating */}
        <div>
          <label className="text-sm font-medium text-card-foreground mb-1 block">
            {t("form.severity")} <span className="text-xs text-muted-foreground ml-1">({t("form.severityLabels")})</span>
          </label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSeverityRating(n)}
                className={`flex-1 py-2 text-sm font-bold rounded-md border transition-colors ${
                  severityRating >= n
                    ? n <= 2 ? "bg-risk-low/20 text-risk-low border-risk-low/30"
                      : n <= 3 ? "bg-risk-medium/20 text-risk-medium border-risk-medium/30"
                      : n <= 4 ? "bg-risk-high/20 text-risk-high border-risk-high/30"
                      : "bg-risk-critical/20 text-risk-critical border-risk-critical/30"
                    : "bg-card text-muted-foreground border-border"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Description (shorter for simplicity) */}
        <div>
          <label className="text-sm font-medium text-card-foreground mb-1 block">{t("form.description")}</label>
          <Textarea placeholder={t("form.descriptionPlaceholder")} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">{t("form.aiNote")}</p>
        </div>

        {/* Injury-specific fields */}
        {reportType === "injury" && (
          <div className="space-y-3 rounded-md border border-destructive/20 bg-destructive/5 p-3">
            <h3 className="text-sm font-semibold text-destructive">{t("detail.injuryDetails")}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-card-foreground mb-1 block">{t("injury.bodyPart")}</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}>
                  <option value="">--</option>
                  {bodyParts.map((bp) => <option key={bp} value={bp}>{bp}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-card-foreground mb-1 block">{t("injury.type")}</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={injuryType} onChange={(e) => setInjuryType(e.target.value)}>
                  <option value="">--</option>
                  {injuryTypes.map((it) => <option key={it} value={it}>{it}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={medicalCare} onChange={(e) => setMedicalCare(e.target.checked)} className="rounded border-border" />
                {t("injury.medicalCare")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={absenceRequired} onChange={(e) => setAbsenceRequired(e.target.checked)} className="rounded border-border" />
                {t("injury.absence")}
              </label>
            </div>

            {absenceRequired && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-card-foreground">{t("injury.absenceDays")}:</label>
                <Input type="number" min={1} value={absenceDays} onChange={(e) => setAbsenceDays(Number(e.target.value))} className="w-20" />
                <span className="text-sm text-muted-foreground">{t("common.days")}</span>
              </div>
            )}
          </div>
        )}

        {/* Image */}
        <div>
          <label className="text-sm font-medium text-card-foreground mb-1 block">{t("form.image")}</label>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-accent hover:text-accent transition-colors w-full justify-center">
            <Camera className="h-4 w-4" />{imagePreview ? t("form.changeImage") : t("form.uploadImage")}
          </button>
          {imagePreview && (
            <div className="mt-2 rounded-md overflow-hidden border border-border">
              <img src={imagePreview} alt="" className="w-full h-32 object-cover" />
            </div>
          )}
        </div>

        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Send className="h-4 w-4 mr-2" />{t("form.submitReport")}
        </Button>
      </div>
    </form>
  );
}

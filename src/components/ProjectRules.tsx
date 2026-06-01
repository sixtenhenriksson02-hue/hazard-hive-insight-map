import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useProjectDeadline } from "@/hooks/useProjectDeadline";
import { Plus, Pencil, Trash2, BookOpen, ChevronDown, ChevronUp, Upload, FileText, ExternalLink, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ProjectRule {
  id: string;
  project_id: string;
  title: string;
  content: string;
  file_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectRules() {
  const { activeProjectId, viewAs, user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = viewAs === "admin";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { deadlineDays, setDeadlineDays } = useProjectDeadline();
  const [deadlineInput, setDeadlineInput] = useState<string>("");

  useEffect(() => {
    setDeadlineInput(deadlineDays != null ? String(deadlineDays) : "");
  }, [deadlineDays]);

  const [rules, setRules] = useState<ProjectRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ProjectRule | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const loadRules = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    const { data } = await supabase
      .from("project_rules")
      .select("*")
      .eq("project_id", activeProjectId)
      .order("created_at", { ascending: true });
    setRules((data as ProjectRule[]) ?? []);
    setLoading(false);
  }, [activeProjectId]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${activeProjectId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("rule-files").upload(path, file);
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data } = supabase.storage.from("rule-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!activeProjectId || !user || !title.trim()) return;
    setUploading(true);

    let fileUrl: string | null = editingRule?.file_url ?? null;
    if (selectedFile) {
      fileUrl = await uploadFile(selectedFile);
    }

    if (editingRule) {
      await supabase
        .from("project_rules")
        .update({ title: title.trim(), content: content.trim(), file_url: fileUrl })
        .eq("id", editingRule.id);
    } else {
      await supabase.from("project_rules").insert({
        project_id: activeProjectId,
        title: title.trim(),
        content: content.trim(),
        file_url: fileUrl,
        created_by: user.id,
      });
    }

    toast.success(t("rules.saved"));
    setTitle("");
    setContent("");
    setSelectedFile(null);
    setShowForm(false);
    setEditingRule(null);
    setUploading(false);
    loadRules();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("rules.deleteConfirm"))) return;
    await supabase.from("project_rules").delete().eq("id", id);
    toast.success(t("rules.deleted"));
    loadRules();
  };

  const startEdit = (rule: ProjectRule) => {
    setEditingRule(rule);
    setTitle(rule.title);
    setContent(rule.content);
    setSelectedFile(null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingRule(null);
    setTitle("");
    setContent("");
    setSelectedFile(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (!activeProjectId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">{t("rules.noProject")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent" />
          {t("rules.title")}
        </h3>
        {isAdmin && (
          <Button size="sm" onClick={() => (showForm ? cancelForm() : setShowForm(true))} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-1.5" />
            {t("rules.addRule")}
          </Button>
        )}
      </div>

      {/* Standard-deadline (admin only) */}
      {isAdmin && (
        <div className="border border-border rounded-xl p-4 bg-card space-y-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-accent" />
            <h4 className="text-sm font-semibold text-foreground">Standard-deadline för risker</h4>
            <span className="text-[10px] uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Endast admin</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Antal dagar efter att en risk rapporterats som den ska vara åtgärdad. Risker som inte är lösta i tid markeras röda som prio. Gäller alla risker i projektet.
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={365}
              placeholder="t.ex. 7"
              value={deadlineInput}
              onChange={(e) => setDeadlineInput(e.target.value)}
              className="w-32 h-9"
            />
            <span className="text-xs text-muted-foreground">dagar</span>
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => {
                const n = parseInt(deadlineInput, 10);
                if (!deadlineInput.trim()) {
                  setDeadlineDays(null);
                } else if (!isNaN(n) && n > 0 && n <= 365) {
                  setDeadlineDays(n);
                } else {
                  toast.error("Ange ett tal mellan 1 och 365.");
                }
              }}
            >
              Spara
            </Button>
            {deadlineDays != null && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDeadlineInput("");
                  setDeadlineDays(null);
                }}
              >
                Ta bort
              </Button>
            )}
          </div>
          {deadlineDays != null && (
            <p className="text-[11px] text-muted-foreground">
              Aktiv: <span className="font-medium text-foreground">{deadlineDays} dagar</span> efter rapportdatum.
            </p>
          )}
        </div>
      )}


      {/* Add/Edit form */}
      {showForm && isAdmin && (
        <div className="border border-border rounded-xl p-4 bg-card space-y-3">
          <p className="text-sm font-medium text-foreground">{editingRule ? t("rules.editRule") : t("rules.addRule")}</p>
          <Input
            placeholder={t("rules.titleLabel")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* File upload area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground hover:border-accent hover:text-accent transition-colors w-full justify-center"
            >
              <Upload className="h-4 w-4" />
              {selectedFile ? selectedFile.name : t("rules.uploadFile")}
            </button>
            {(editingRule?.file_url && !selectedFile) && (
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {t("rules.fileUploaded")}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-x-0 top-0 flex items-center justify-center">
              <span className="bg-card px-2 text-[10px] text-muted-foreground -translate-y-1/2">{t("rules.orWriteManually")}</span>
            </div>
            <div className="border-t border-border pt-3 mt-1">
              <Textarea
                placeholder={t("rules.contentLabel")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={!title.trim() || uploading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {uploading ? t("common.loading") : t("common.save")}
            </Button>
            <Button size="sm" variant="outline" onClick={cancelForm}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">{t("common.loading")}</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t("rules.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => {
            const isExpanded = expandedRules.has(rule.id);
            return (
              <div key={rule.id} className="border border-border rounded-xl bg-card overflow-hidden">
                <button
                  onClick={() => toggleExpand(rule.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-accent shrink-0" />
                    <span className="font-medium text-sm text-foreground truncate">{rule.title}</span>
                    {rule.file_url && <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                      {t("rules.updatedAt")} {new Date(rule.updated_at).toLocaleDateString()}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border">
                    {rule.file_url && (
                      <a
                        href={rule.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs text-accent hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t("rules.viewFile")}
                      </a>
                    )}
                    {rule.content && (
                      <div className="pt-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {rule.content}
                      </div>
                    )}
                    {!rule.content && !rule.file_url && (
                      <div className="pt-3 text-sm text-muted-foreground italic opacity-50">—</div>
                    )}
                    {isAdmin && (
                      <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => startEdit(rule)}>
                          <Pencil className="h-3 w-3 mr-1" />
                          {t("rules.editRule")}
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs text-destructive hover:bg-destructive/10" onClick={() => handleDelete(rule.id)}>
                          <Trash2 className="h-3 w-3 mr-1" />
                          {t("rules.deleteRule")}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

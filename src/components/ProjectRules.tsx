import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Plus, Pencil, Trash2, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ProjectRule {
  id: string;
  project_id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectRules() {
  const { activeProjectId, viewAs, user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = viewAs === "admin";

  const [rules, setRules] = useState<ProjectRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ProjectRule | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
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

  const handleSave = async () => {
    if (!activeProjectId || !user || !title.trim()) return;

    if (editingRule) {
      await supabase
        .from("project_rules")
        .update({ title: title.trim(), content: content.trim() })
        .eq("id", editingRule.id);
    } else {
      await supabase.from("project_rules").insert({
        project_id: activeProjectId,
        title: title.trim(),
        content: content.trim(),
        created_by: user.id,
      });
    }

    toast.success(t("rules.saved"));
    setTitle("");
    setContent("");
    setShowForm(false);
    setEditingRule(null);
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
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingRule(null);
    setTitle("");
    setContent("");
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

      {/* Add/Edit form */}
      {showForm && isAdmin && (
        <div className="border border-border rounded-xl p-4 bg-card space-y-3">
          <p className="text-sm font-medium text-foreground">{editingRule ? t("rules.editRule") : t("rules.addRule")}</p>
          <Input
            placeholder={t("rules.titleLabel")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder={t("rules.contentLabel")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={!title.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {t("common.save")}
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
                    <div className="pt-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {rule.content || <span className="italic opacity-50">—</span>}
                    </div>
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

import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderPlus, Calendar, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function ProjectManager({ open, onClose }: ProjectManagerProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { projects, createProject } = useProjects();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setCreating(true);
    await createProject(name.trim(), user.id);
    setName("");
    setCreating(false);
  };

  const copyCode = (code: string, projectId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(projectId);
    toast({ title: t("project.codeCopied") });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" /> {t("project.manage")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t("project.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={creating || !name.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
              {t("project.create")}
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t("project.noProjects")}</p>
            )}
            {projects.map((p) => (
              <div key={p.id} className="rounded-md border border-border bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-card-foreground">{p.name}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />{new Date(p.created_at).toLocaleDateString("sv-SE")}
                  </span>
                </div>
                {p.invite_code && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t("project.inviteCode")}:</span>
                    <code className="text-xs font-mono font-bold bg-accent/10 text-accent px-2 py-0.5 rounded">
                      {p.invite_code}
                    </code>
                    <button
                      onClick={() => copyCode(p.invite_code!, p.id)}
                      className="text-muted-foreground hover:text-accent transition-colors"
                    >
                      {copiedId === p.id ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

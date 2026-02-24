import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderPlus, Calendar } from "lucide-react";

interface ProjectManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function ProjectManager({ open, onClose }: ProjectManagerProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { projects, createProject } = useProjects();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setCreating(true);
    await createProject(name.trim(), user.id);
    setName("");
    setCreating(false);
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
              <div key={p.id} className="rounded-md border border-border bg-muted/50 p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-card-foreground">{p.name}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />{new Date(p.created_at).toLocaleDateString("sv-SE")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

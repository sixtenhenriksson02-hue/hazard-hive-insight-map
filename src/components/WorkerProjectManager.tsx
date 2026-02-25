import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Plus, Trash2 } from "lucide-react";

interface WorkerProjectManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function WorkerProjectManager({ open, onClose }: WorkerProjectManagerProps) {
  const { userProjects, addUserProject, removeUserProject, activeProjectId, setActiveProjectId } = useAuth();
  const { projects } = useProjects();
  const { t } = useLanguage();
  const [adding, setAdding] = useState(false);

  const enrolledIds = new Set(userProjects.map(p => p.project_id));
  const availableToAdd = projects.filter(p => !enrolledIds.has(p.id));

  const handleAdd = async (projectId: string) => {
    await addUserProject(projectId);
  };

  const handleRemove = async (projectId: string) => {
    await removeUserProject(projectId);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("project.myProjects")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {userProjects.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">{t("project.noEnrolled")}</p>
          )}
          {userProjects.map((up) => (
            <div key={up.project_id} className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="flex items-center gap-2">
                {activeProjectId === up.project_id && <Check className="h-4 w-4 text-accent" />}
                <span className="text-sm font-medium">{up.project_name}</span>
              </div>
              <div className="flex items-center gap-1">
                {activeProjectId !== up.project_id && (
                  <Button variant="ghost" size="sm" onClick={() => setActiveProjectId(up.project_id)} className="text-xs">
                    {t("project.setActive")}
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(up.project_id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {!adding && availableToAdd.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="w-full mt-2">
            <Plus className="h-4 w-4 mr-1" /> {t("project.addProject")}
          </Button>
        )}

        {adding && (
          <div className="space-y-2 mt-2 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">{t("project.selectToAdd")}</p>
            {availableToAdd.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAdd(p.id)}
                className="w-full text-left text-sm px-3 py-2 rounded-md border border-border hover:border-accent transition-colors"
              >
                {p.name}
              </button>
            ))}
            {availableToAdd.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("project.allEnrolled")}</p>
            )}
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)} className="text-xs">
              {t("common.cancel")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

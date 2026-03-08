import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Trash2, KeyRound } from "lucide-react";

interface WorkerProjectManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function WorkerProjectManager({ open, onClose }: WorkerProjectManagerProps) {
  const { user, userProjects, removeUserProject, activeProjectId, setActiveProjectId, refreshUserProjects } = useAuth();
  const { joinByCode } = useProjects();
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!code.trim() || !user) return;
    setJoining(true);
    const success = await joinByCode(code.trim(), user.id);
    if (success) {
      setCode("");
      await refreshUserProjects();
    }
    setJoining(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("project.myProjects")}</DialogTitle>
        </DialogHeader>

        {/* Join by code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-card-foreground flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" /> {t("project.joinWithCode")}
          </label>
          <div className="flex gap-2">
            <Input
              placeholder={t("project.enterCode")}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={6}
              className="font-mono text-center tracking-widest"
            />
            <Button onClick={handleJoin} disabled={joining || !code.trim()} className="bg-accent text-accent-foreground shrink-0">
              {t("project.join")}
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-2">
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
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeUserProject(up.project_id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

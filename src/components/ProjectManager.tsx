import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderPlus, Calendar, Copy, Check, Archive, RotateCcw, QrCode, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { projectInvitePath } from "@/lib/projectInvite";

interface ProjectManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function ProjectManager({ open, onClose }: ProjectManagerProps) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { projects, createProject, archiveProject } = useProjects();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [qrProjectId, setQrProjectId] = useState<string | null>(null);
  const qrProject = projects.find(p => p.id === qrProjectId && !p.archived);
  const L = (sv: string, en: string) => lang === "sv" ? sv : en;
  const downloadQr = () => {
    const svg = document.getElementById("project-qr");
    if (!svg || !qrProject) return;
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${qrProject.name.replace(/[^a-zA-Z0-9åäöÅÄÖ_-]/g, "_")}-QR.svg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

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

  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
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
            {activeProjects.length === 0 && !showArchived && (
              <p className="text-sm text-muted-foreground text-center py-4">{t("project.noProjects")}</p>
            )}
            {activeProjects.map((p) => (
              <div key={p.id} className="rounded-md border border-border bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-card-foreground">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{new Date(p.created_at).toLocaleDateString("sv-SE")}
                    </span>
                    <button
                      onClick={() => archiveProject(p.id, true)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title={t("project.archive")}
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {p.invite_code && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t("project.inviteCode")}:</span>
                    <code className="text-xs font-mono font-bold bg-accent/10 text-accent px-2 py-0.5 rounded">
                      {p.invite_code}
                    </code>
                    <Button variant="ghost" size="icon" title={t("project.codeCopied")} onClick={() => { if (p.invite_code) copyCode(p.invite_code, p.id); }}>
                      {copiedId === p.id ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQrProjectId(qrProjectId === p.id ? null : p.id)}><QrCode />QR</Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {qrProject?.invite_code && <section className="border-t border-border pt-4 space-y-3 text-center">
            <h3 className="font-semibold break-words">{qrProject.name}</h3>
            <QRCodeSVG id="project-qr" value={`${window.location.origin}${projectInvitePath(qrProject.invite_code)}`} size={224} marginSize={4} level="M" className="mx-auto max-w-full h-auto" />
            <div className="flex justify-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={downloadQr}><Download />{L("Spara QR-kod", "Save QR code")}</Button>
              <Button variant="outline" size="sm" onClick={async () => {
                if (!qrProject.invite_code) return;
                try {
                  await navigator.clipboard.writeText(`${window.location.origin}${projectInvitePath(qrProject.invite_code)}`);
                  toast({ title: L("Projektlänk kopierad", "Project link copied") });
                } catch { toast({ title: L("Kunde inte kopiera länken", "Could not copy link"), variant: "destructive" }); }
              }}><Copy />{L("Kopiera länk", "Copy link")}</Button>
            </div>
          </section>}

          {archivedProjects.length > 0 && (
            <div>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="text-xs text-muted-foreground hover:text-accent transition-colors"
              >
                {showArchived ? t("project.hideArchived") : t("project.showArchived")} ({archivedProjects.length})
              </button>
              {showArchived && (
                <div className="space-y-2 mt-2">
                  {archivedProjects.map((p) => (
                    <div key={p.id} className="rounded-md border border-border bg-muted/30 p-3 opacity-60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-card-foreground">{p.name}</span>
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t("project.archived")}</span>
                        </div>
                        <button
                          onClick={() => archiveProject(p.id, false)}
                          className="text-muted-foreground hover:text-accent transition-colors"
                          title={t("project.activate")}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

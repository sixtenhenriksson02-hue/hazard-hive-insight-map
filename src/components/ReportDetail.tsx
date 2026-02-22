import { useState } from "react";
import { RiskReport, ReportComment, useComments } from "@/hooks/useReports";
import { RISK_LABELS, STATUS_LABELS, CATEGORIES } from "@/types/risk";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Calendar, User, MessageSquare, Pencil, Send } from "lucide-react";

interface ReportDetailProps {
  report: RiskReport | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: any) => void;
}

const riskBadgeClass: Record<string, string> = {
  low: "bg-risk-low/15 text-risk-low",
  medium: "bg-risk-medium/15 text-risk-medium",
  high: "bg-risk-high/15 text-risk-high",
  critical: "bg-risk-critical/15 text-risk-critical",
};

export default function ReportDetail({ report, open, onClose, onUpdate }: ReportDetailProps) {
  const { viewAs, role, user } = useAuth();
  const isAdmin = viewAs === "admin";
  const { comments, addComment } = useComments(report?.id ?? null);
  const [newComment, setNewComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", location: "", category: "" });

  if (!report) return null;

  const canEdit = isAdmin || report.reported_by === user?.id;

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

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(newComment.trim());
    setNewComment("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskBadgeClass[report.risk_level]}`}>
              {RISK_LABELS[report.risk_level as keyof typeof RISK_LABELS]}
            </span>
            {editing ? (
              <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
            ) : (
              report.title
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {report.image_url && (
            <img src={report.image_url} alt="Rapport" className="w-full h-48 object-cover rounded-md" />
          )}

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Beskrivning</label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Plats</label>
                <Input value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Kategori</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEdit} size="sm" className="bg-accent text-accent-foreground">Spara</Button>
                <Button onClick={() => setEditing(false)} size="sm" variant="outline">Avbryt</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{report.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{report.location}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(report.created_at).toLocaleDateString("sv-SE")}</span>
                {isAdmin && (
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{report.reporter_name ?? "Okänd"}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">{STATUS_LABELS[report.status as keyof typeof STATUS_LABELS]}</span>
                <span className="text-muted-foreground">•</span>
                <span>{report.category}</span>
              </div>
              {canEdit && (
                <Button onClick={startEdit} size="sm" variant="outline">
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Redigera
                </Button>
              )}
            </>
          )}

          {/* Comments */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
              <MessageSquare className="h-4 w-4" /> Kommentarer ({comments.length})
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
              {comments.length === 0 && <p className="text-xs text-muted-foreground">Inga kommentarer ännu.</p>}
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Skriv en kommentar..."
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

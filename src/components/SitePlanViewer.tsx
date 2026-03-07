import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { RiskReport } from "@/hooks/useReports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, MapPin, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SitePlan {
  id: string;
  project_id: string;
  name: string;
  image_url: string;
  created_at: string;
}

interface SitePlanViewerProps {
  reports: RiskReport[];
  onSelectLocation?: (planId: string, x: number, y: number) => void;
  selectionMode?: boolean;
}

const riskDotColor: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

export default function SitePlanViewer({ reports, onSelectLocation, selectionMode = false }: SitePlanViewerProps) {
  const { viewAs, activeProjectId, user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const isAdmin = viewAs === "admin";
  const [plans, setPlans] = useState<SitePlan[]>([]);
  const [activePlan, setActivePlan] = useState<SitePlan | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isPdf = (url: string) => url.toLowerCase().endsWith(".pdf");

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (selectionMode && onSelectLocation && activePlan) {
      setSelectedPoint({ x, y });
      onSelectLocation(activePlan.id, x, y);
    }
  };

  const fetchPlans = useCallback(async () => {
    if (!activeProjectId) return;
    const { data } = await supabase
      .from("site_plans")
      .select("*")
      .eq("project_id", activeProjectId)
      .order("created_at", { ascending: false });
    const typed = (data as SitePlan[]) ?? [];
    setPlans(typed);
    if (typed.length > 0 && !activePlan) {
      setActivePlan(typed[0]);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (plans.length > 0 && !activePlan) {
      setActivePlan(plans[0]);
    }
    if (plans.length === 0) setActivePlan(null);
  }, [plans]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProjectId || !user) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${activeProjectId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("site-plans").upload(path, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("site-plans").getPublicUrl(path);

    const { error } = await supabase.from("site_plans").insert({
      project_id: activeProjectId,
      name: uploadName || file.name,
      image_url: urlData.publicUrl,
      created_by: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("apd.uploaded") });
      setShowUpload(false);
      setUploadName("");
      await fetchPlans();
    }
    setUploading(false);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (selectionMode && onSelectLocation && activePlan) {
      setSelectedPoint({ x, y });
      onSelectLocation(activePlan.id, x, y);
    }
  };

  // Filter reports that have coordinates on the active plan (exclude resolved)
  const planReports = activePlan
    ? reports.filter(r => r.site_plan_id === activePlan.id && r.plan_x != null && r.plan_y != null && r.status !== "resolved")
    : [];

  // Calculate high-risk zones (cluster areas)
  const getRiskZones = () => {
    if (planReports.length < 2) return [];
    const zones: { x: number; y: number; count: number; maxRisk: string }[] = [];
    const ZONE_RADIUS = 10; // percentage

    planReports.forEach(r => {
      const existing = zones.find(z =>
        Math.abs(z.x - (r.plan_x ?? 0)) < ZONE_RADIUS && Math.abs(z.y - (r.plan_y ?? 0)) < ZONE_RADIUS
      );
      if (existing) {
        existing.count++;
        const riskOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        if ((riskOrder[r.risk_level as keyof typeof riskOrder] ?? 0) > (riskOrder[existing.maxRisk as keyof typeof riskOrder] ?? 0)) {
          existing.maxRisk = r.risk_level;
        }
      } else {
        zones.push({ x: r.plan_x ?? 0, y: r.plan_y ?? 0, count: 1, maxRisk: r.risk_level });
      }
    });

    return zones.filter(z => z.count >= 2);
  };

  const riskZones = getRiskZones();

  if (!activeProjectId) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground text-sm">
        {t("apd.selectProject")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-card-foreground flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-accent" /> {t("apd.title")}
        </h2>
        <div className="flex items-center gap-2">
          {plans.length > 1 && (
            <select
              className="text-xs border border-border rounded-md px-2 py-1 bg-card text-card-foreground"
              value={activePlan?.id ?? ""}
              onChange={(e) => setActivePlan(plans.find(p => p.id === e.target.value) ?? null)}
            >
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setShowUpload(true)}>
                <Upload className="h-3 w-3 mr-1" /> {t("apd.upload")}
              </Button>
              {activePlan && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={async () => {
                    if (!activePlan) return;
                    const confirmed = window.confirm(t("apd.confirmDelete"));
                    if (!confirmed) return;
                    // Delete from storage
                    const storagePath = activePlan.image_url.split("/site-plans/")[1];
                    if (storagePath) {
                      await supabase.storage.from("site-plans").remove([storagePath]);
                    }
                    // Delete from DB
                    await supabase.from("site_plans").delete().eq("id", activePlan.id);
                    setActivePlan(null);
                    await fetchPlans();
                    toast({ title: t("apd.deleted") });
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {activePlan ? (
        <div ref={containerRef} className="relative rounded-md overflow-hidden border border-border">
          {isPdf(activePlan.image_url) ? (
            <div className="relative" style={{ minHeight: selectionMode ? 500 : 400 }}>
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(activePlan.image_url)}&embedded=true`}
                title={activePlan.name}
                className="w-full border-0 bg-muted"
                style={{ height: selectionMode ? 500 : 400 }}
                sandbox="allow-scripts allow-same-origin"
              />
              {/* Transparent overlay for click detection on PDF */}
              <div
                ref={overlayRef}
                className={`absolute inset-0 ${selectionMode ? "cursor-crosshair" : "pointer-events-none"}`}
                onClick={selectionMode ? handleOverlayClick : undefined}
              />
              {/* Markers on PDF overlay */}
              {planReports.map(r => (
                <div
                  key={r.id}
                  className="absolute w-4 h-4 rounded-full border-2 border-card shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${r.plan_x}%`,
                    top: `${r.plan_y}%`,
                    backgroundColor: riskDotColor[r.risk_level] ?? "#888",
                  }}
                  title={`${r.title} (${r.risk_level})`}
                />
              ))}
              {riskZones.map((zone, i) => (
                <div
                  key={`zone-${i}`}
                  className="absolute rounded-full pointer-events-none animate-pulse"
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: "60px",
                    height: "60px",
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle, ${riskDotColor[zone.maxRisk]}33 0%, transparent 70%)`,
                    border: `2px solid ${riskDotColor[zone.maxRisk]}66`,
                  }}
                />
              ))}
              {selectionMode && selectedPoint && (
                <div
                  className="absolute w-5 h-5 rounded-full border-2 border-accent bg-accent/50 transform -translate-x-1/2 -translate-y-1/2 animate-pulse pointer-events-none"
                  style={{ left: `${selectedPoint.x}%`, top: `${selectedPoint.y}%` }}
                />
              )}
            </div>
          ) : (
            <>
              <img
                ref={imgRef}
                src={activePlan.image_url}
                alt={activePlan.name}
                className={`w-full h-auto object-contain bg-muted ${selectionMode ? "cursor-crosshair max-h-[600px]" : "max-h-[400px]"}`}
                onClick={handleImageClick}
              />

              {/* Risk zone highlights */}
              {riskZones.map((zone, i) => (
                <div
                  key={`zone-${i}`}
                  className="absolute rounded-full pointer-events-none animate-pulse"
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: "60px",
                    height: "60px",
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle, ${riskDotColor[zone.maxRisk]}33 0%, transparent 70%)`,
                    border: `2px solid ${riskDotColor[zone.maxRisk]}66`,
                  }}
                />
              ))}

              {/* Report markers */}
              {planReports.map(r => (
                <div
                  key={r.id}
                  className="absolute w-4 h-4 rounded-full border-2 border-card shadow-md transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-150"
                  style={{
                    left: `${r.plan_x}%`,
                    top: `${r.plan_y}%`,
                    backgroundColor: riskDotColor[r.risk_level] ?? "#888",
                  }}
                  title={`${r.title} (${r.risk_level})`}
                />
              ))}

              {/* Selection mode point */}
              {selectionMode && selectedPoint && (
                <div
                  className="absolute w-5 h-5 rounded-full border-2 border-accent bg-accent/50 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                  style={{ left: `${selectedPoint.x}%`, top: `${selectedPoint.y}%` }}
                />
              )}
            </>
          )}

          {/* Legend */}
          {planReports.length > 0 && (
            <div className="absolute bottom-2 right-2 bg-card/90 border border-border rounded-md px-2 py-1.5 flex gap-2 text-[10px] z-10">
              {(["low", "medium", "high", "critical"] as const).map(level => (
                <span key={level} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: riskDotColor[level] }} />
                  {t(`risk.${level}`)}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-2">
          <MapPin className="h-8 w-8 opacity-30" />
          <p>{t("apd.noPlan")}</p>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
              <Upload className="h-3.5 w-3.5 mr-1" /> {t("apd.uploadFirst")}
            </Button>
          )}
        </div>
      )}

      {selectionMode && activePlan && (
        <p className="text-xs text-accent mt-2 text-center">{t("apd.clickToPlace")}</p>
      )}

      {/* Upload dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("apd.uploadTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={t("apd.planName")}
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
            />
            <label className="flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-accent hover:text-accent transition-colors cursor-pointer justify-center">
              <Upload className="h-4 w-4" />
              {uploading ? t("common.loading") : t("apd.selectFile")}
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

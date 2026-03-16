import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { RiskReport } from "@/hooks/useReports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, MapPin, AlertTriangle, X, Cross, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SitePlan {
  id: string;
  project_id: string;
  name: string;
  image_url: string;
  created_at: string;
}

interface SafetyMarker {
  id: string;
  project_id: string;
  site_plan_id: string;
  marker_type: "first_aid" | "fire_extinguisher";
  plan_x: number;
  plan_y: number;
  description: string;
  created_by: string;
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

type SafetyPlacingMode = "first_aid" | "fire_extinguisher" | null;

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
  const [hoveredReport, setHoveredReport] = useState<string | null>(null);
  const [safetyMarkers, setSafetyMarkers] = useState<SafetyMarker[]>([]);
  const [safetyPlacingMode, setSafetyPlacingMode] = useState<SafetyPlacingMode>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isPdf = (url: string) => url.toLowerCase().endsWith(".pdf");

  const handleOverlayClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (safetyPlacingMode && activePlan && user) {
      await placeSafetyMarker(safetyPlacingMode, x, y);
      return;
    }

    if (selectionMode && onSelectLocation && activePlan) {
      setSelectedPoint({ x, y });
      onSelectLocation(activePlan.id, x, y);
    }
  };

  const handleImageClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (safetyPlacingMode && activePlan && user) {
      await placeSafetyMarker(safetyPlacingMode, x, y);
      return;
    }

    if (selectionMode && onSelectLocation && activePlan) {
      setSelectedPoint({ x, y });
      onSelectLocation(activePlan.id, x, y);
    }
  };

  const placeSafetyMarker = async (type: "first_aid" | "fire_extinguisher", x: number, y: number) => {
    if (!activePlan || !user || !activeProjectId) return;
    const { error } = await supabase.from("safety_markers" as any).insert({
      project_id: activeProjectId,
      site_plan_id: activePlan.id,
      marker_type: type,
      plan_x: x,
      plan_y: y,
      created_by: user.id,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("safety.markerPlaced") });
      setSafetyPlacingMode(null);
      await fetchSafetyMarkers();
    }
  };

  const deleteSafetyMarker = async (markerId: string) => {
    const { error } = await supabase.from("safety_markers" as any).delete().eq("id", markerId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("safety.markerDeleted") });
      await fetchSafetyMarkers();
    }
  };

  const fetchSafetyMarkers = useCallback(async () => {
    if (!activeProjectId) return;
    const { data } = await supabase
      .from("safety_markers" as any)
      .select("*")
      .eq("project_id", activeProjectId);
    setSafetyMarkers((data as unknown as SafetyMarker[]) ?? []);
  }, [activeProjectId]);

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
    fetchSafetyMarkers();
  }, [fetchPlans, fetchSafetyMarkers]);

  useEffect(() => {
    if (plans.length > 0 && !activePlan) {
      setActivePlan(plans[0]);
    }
    if (plans.length === 0) setActivePlan(null);
  }, [plans]);

  // Auto-crop drawing frame from image using canvas analysis
  const autoCropImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = imageData;

        const isDark = (x: number, y: number) => {
          const i = (y * width + x) * 4;
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          return avg < 80;
        };

        const scanStep = Math.max(1, Math.floor(Math.min(width, height) / 200));

        let top = 0;
        for (let y = 0; y < Math.floor(height * 0.2); y += scanStep) {
          let darkCount = 0;
          for (let x = 0; x < width; x += scanStep) { if (isDark(x, y)) darkCount++; }
          if (darkCount > (width / scanStep) * 0.4) top = y + 2;
        }

        let bottom = height;
        for (let y = height - 1; y > Math.floor(height * 0.7); y -= scanStep) {
          let darkCount = 0;
          for (let x = 0; x < width; x += scanStep) { if (isDark(x, y)) darkCount++; }
          if (darkCount > (width / scanStep) * 0.4) bottom = y - 2;
        }

        let left = 0;
        for (let x = 0; x < Math.floor(width * 0.2); x += scanStep) {
          let darkCount = 0;
          for (let y = 0; y < height; y += scanStep) { if (isDark(x, y)) darkCount++; }
          if (darkCount > (height / scanStep) * 0.4) left = x + 2;
        }

        let right = width;
        for (let x = width - 1; x > Math.floor(width * 0.7); x -= scanStep) {
          let darkCount = 0;
          for (let y = 0; y < height; y += scanStep) { if (isDark(x, y)) darkCount++; }
          if (darkCount > (height / scanStep) * 0.4) right = x - 2;
        }

        const bottomAreaStart = Math.floor(height * 0.82);
        let bottomDensity = 0;
        for (let y = bottomAreaStart; y < height; y += scanStep) {
          for (let x = 0; x < width; x += scanStep) { if (isDark(x, y)) bottomDensity++; }
        }
        const bottomAreaPixels = ((height - bottomAreaStart) / scanStep) * (width / scanStep);
        if (bottomDensity > bottomAreaPixels * 0.15) {
          bottom = Math.min(bottom, bottomAreaStart);
        }

        const cropW = Math.max(right - left, Math.floor(width * 0.5));
        const cropH = Math.max(bottom - top, Math.floor(height * 0.5));
        const finalLeft = Math.max(0, left);
        const finalTop = Math.max(0, top);

        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = cropW;
        croppedCanvas.height = cropH;
        const croppedCtx = croppedCanvas.getContext("2d")!;
        croppedCtx.drawImage(canvas, finalLeft, finalTop, cropW, cropH, 0, 0, cropW, cropH);

        croppedCanvas.toBlob((blob) => {
          resolve(blob || file);
        }, "image/png", 0.95);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProjectId || !user) return;
    setUploading(true);

    let uploadFile: Blob | File = file;
    const isImage = file.type.startsWith("image/");
    if (isImage) {
      try { uploadFile = await autoCropImage(file); } catch { uploadFile = file; }
    }

    const ext = isImage ? "png" : file.name.split(".").pop();
    const path = `${activeProjectId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("site-plans").upload(path, uploadFile);
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

  const planReports = activePlan
    ? reports.filter(r => r.site_plan_id === activePlan.id && r.plan_x != null && r.plan_y != null && r.status !== "resolved")
    : [];

  const planSafetyMarkers = activePlan
    ? safetyMarkers.filter(m => m.site_plan_id === activePlan.id)
    : [];

  const getRiskZones = () => {
    if (planReports.length < 2) return [];
    const zones: { x: number; y: number; count: number; maxRisk: string }[] = [];
    const ZONE_RADIUS = 10;
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

  const SafetyMarkerIcon = ({ marker, showDelete }: { marker: SafetyMarker; showDelete: boolean }) => {
    const isFirstAid = marker.marker_type === "first_aid";
    return (
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group"
        style={{ left: `${marker.plan_x}%`, top: `${marker.plan_y}%` }}
      >
        <div
          className={`w-7 h-7 rounded-md flex items-center justify-center shadow-lg border-2 border-white ${
            isFirstAid ? "bg-green-600" : "bg-red-600"
          }`}
          title={isFirstAid ? t("safety.firstAid") : t("safety.fireExtinguisher")}
        >
          {isFirstAid ? (
            <Cross className="h-4 w-4 text-white" strokeWidth={3} />
          ) : (
            <Flame className="h-4 w-4 text-white" strokeWidth={2.5} />
          )}
        </div>
        {showDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); deleteSafetyMarker(marker.id); }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        )}
      </div>
    );
  };

  const cursorClass = safetyPlacingMode ? "cursor-crosshair" : selectionMode ? "cursor-crosshair" : "";

  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-sm font-bold text-card-foreground flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-accent" /> {t("apd.title")}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
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
              {/* Safety marker buttons */}
              <Button
                variant={safetyPlacingMode === "first_aid" ? "default" : "outline"}
                size="sm"
                className={`text-xs h-7 ${safetyPlacingMode === "first_aid" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                onClick={() => setSafetyPlacingMode(safetyPlacingMode === "first_aid" ? null : "first_aid")}
              >
                <Cross className="h-3 w-3 mr-1" strokeWidth={3} /> {t("safety.placeFirstAid")}
              </Button>
              <Button
                variant={safetyPlacingMode === "fire_extinguisher" ? "default" : "outline"}
                size="sm"
                className={`text-xs h-7 ${safetyPlacingMode === "fire_extinguisher" ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                onClick={() => setSafetyPlacingMode(safetyPlacingMode === "fire_extinguisher" ? null : "fire_extinguisher")}
              >
                <Flame className="h-3 w-3 mr-1" strokeWidth={2.5} /> {t("safety.placeFireExtinguisher")}
              </Button>

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
                    const storagePath = activePlan.image_url.split("/site-plans/")[1];
                    if (storagePath) {
                      await supabase.storage.from("site-plans").remove([storagePath]);
                    }
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

      {/* Safety placing mode banner */}
      {safetyPlacingMode && (
        <div className={`mb-3 text-xs text-center py-2 rounded-md font-medium ${
          safetyPlacingMode === "first_aid" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
        }`}>
          {t("safety.placingMode")} – {safetyPlacingMode === "first_aid" ? t("safety.firstAid") : t("safety.fireExtinguisher")}
        </div>
      )}

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
              <div
                ref={overlayRef}
                className={`absolute inset-0 ${(selectionMode || safetyPlacingMode) ? "cursor-crosshair" : "pointer-events-none"}`}
                onClick={(selectionMode || safetyPlacingMode) ? handleOverlayClick : undefined}
              />
              {/* Safety markers on PDF */}
              {planSafetyMarkers.map(m => (
                <SafetyMarkerIcon key={m.id} marker={m} showDelete={isAdmin} />
              ))}
              {planReports.map((r, idx) => (
                <div
                  key={r.id}
                  className="absolute w-5 h-5 rounded-full border-2 border-card shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                  style={{
                    left: `${r.plan_x}%`,
                    top: `${r.plan_y}%`,
                    backgroundColor: riskDotColor[r.risk_level] ?? "#888",
                  }}
                  title={`#${idx + 1} ${r.title} (${r.risk_level})`}
                >
                  <span className="text-[8px] font-bold text-white leading-none">{idx + 1}</span>
                </div>
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
            <div className="relative">
              <img
                ref={imgRef}
                src={activePlan.image_url}
                alt={activePlan.name}
                className={`w-full h-auto block bg-white ${cursorClass}`}
                style={{
                  filter: "contrast(1.35) brightness(1.08) saturate(0.15)",
                }}
                onClick={handleImageClick}
                draggable={false}
              />

              {/* Risk zone highlights */}
              {riskZones.map((zone, i) => (
                <div
                  key={`zone-${i}`}
                  className="absolute rounded-full pointer-events-none animate-pulse"
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: "80px",
                    height: "80px",
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle, ${riskDotColor[zone.maxRisk]}44 0%, transparent 70%)`,
                    border: `2px dashed ${riskDotColor[zone.maxRisk]}88`,
                  }}
                />
              ))}

              {/* Safety markers on image */}
              {planSafetyMarkers.map(m => (
                <SafetyMarkerIcon key={m.id} marker={m} showDelete={isAdmin} />
              ))}

              {/* Report markers */}
              {planReports.map((r, idx) => (
                <div
                  key={r.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                  style={{ left: `${r.plan_x}%`, top: `${r.plan_y}%` }}
                  onMouseEnter={() => setHoveredReport(r.id)}
                  onMouseLeave={() => setHoveredReport(null)}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-150 flex items-center justify-center"
                    style={{ backgroundColor: riskDotColor[r.risk_level] ?? "#888" }}
                  >
                    <span className="text-[9px] font-bold text-white leading-none">{idx + 1}</span>
                  </div>
                  {hoveredReport === r.id && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 whitespace-nowrap bg-card border border-border rounded-md px-2 py-1 shadow-lg z-20 text-[11px]">
                      <p className="font-semibold text-card-foreground">{r.title}</p>
                      <p className="text-muted-foreground">{r.category} • {r.location}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: riskDotColor[r.risk_level] }} />
                        <span className="font-medium" style={{ color: riskDotColor[r.risk_level] }}>{t(`risk.${r.risk_level}`)}</span>
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
                    </div>
                  )}
                </div>
              ))}

              {/* Selection mode point */}
              {selectionMode && selectedPoint && (
                <div
                  className="absolute w-6 h-6 rounded-full border-2 border-accent bg-accent/50 transform -translate-x-1/2 -translate-y-1/2 animate-pulse pointer-events-none"
                  style={{ left: `${selectedPoint.x}%`, top: `${selectedPoint.y}%` }}
                />
              )}
            </div>
          )}

          {/* Legend overlay */}
          {(planReports.length > 0 || planSafetyMarkers.length > 0) && (
            <div className="absolute bottom-2 left-2 bg-card/95 backdrop-blur-sm border border-border rounded-md px-2.5 py-2 text-[10px] z-10 max-w-[200px]">
              <p className="font-semibold text-card-foreground mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-accent" />
                {t("apd.legendTitle")}
              </p>
              {(["critical", "high", "medium", "low"] as const).map(level => {
                const count = planReports.filter(r => r.risk_level === level).length;
                if (count === 0) return null;
                return (
                  <div key={level} className="flex items-center gap-1.5 py-0.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-card" style={{ backgroundColor: riskDotColor[level] }} />
                    <span className="text-card-foreground font-medium">{t(`risk.${level}`)}</span>
                    <span className="text-muted-foreground ml-auto">({count})</span>
                  </div>
                );
              })}
              {/* Safety legend */}
              {planSafetyMarkers.some(m => m.marker_type === "first_aid") && (
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0 bg-green-600 flex items-center justify-center">
                    <Cross className="h-1.5 w-1.5 text-white" strokeWidth={4} />
                  </span>
                  <span className="text-card-foreground font-medium">{t("safety.firstAid")}</span>
                </div>
              )}
              {planSafetyMarkers.some(m => m.marker_type === "fire_extinguisher") && (
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0 bg-red-600 flex items-center justify-center">
                    <Flame className="h-1.5 w-1.5 text-white" strokeWidth={3} />
                  </span>
                  <span className="text-card-foreground font-medium">{t("safety.fireExtinguisher")}</span>
                </div>
              )}
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

      {/* Risk summary panel below map */}
      {!selectionMode && planReports.length > 0 && (
        <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
          <h3 className="text-xs font-semibold text-card-foreground mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-accent" />
            {t("apd.activeRisks")}
          </h3>
          <div className="space-y-2">
            {(["critical", "high", "medium", "low"] as const).map(level => {
              const levelReports = planReports.filter(r => r.risk_level === level);
              if (levelReports.length === 0) return null;
              return (
                <div key={level} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: riskDotColor[level] }} />
                    <span className="text-xs font-semibold" style={{ color: riskDotColor[level] }}>
                      {t(`risk.${level}`)} ({levelReports.length})
                    </span>
                  </div>
                  <div className="ml-4 space-y-0.5">
                    {levelReports.map(r => {
                      const globalIdx = planReports.indexOf(r) + 1;
                      return (
                        <div key={r.id} className="flex items-start gap-1.5 text-[11px]">
                          <span
                            className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white mt-0.5"
                            style={{ backgroundColor: riskDotColor[r.risk_level] }}
                          >
                            {globalIdx}
                          </span>
                          <div>
                            <span className="text-card-foreground font-medium">{r.title}</span>
                            <span className="text-muted-foreground ml-1">– {r.category}, {r.location}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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

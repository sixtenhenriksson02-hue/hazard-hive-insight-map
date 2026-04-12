import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { RiskReport } from "@/hooks/useReports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, MapPin, AlertTriangle, X, Cross, Flame, Heart, Layers } from "lucide-react";
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
  marker_type: "first_aid" | "fire_extinguisher" | "defibrillator";
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

type SafetyPlacingMode = "first_aid" | "fire_extinguisher" | "defibrillator" | null;

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
  const [pendingSafetyPoint, setPendingSafetyPoint] = useState<{ type: SafetyPlacingMode; x: number; y: number } | null>(null);
  const [safetyDescription, setSafetyDescription] = useState("");
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);
  const [selectedSafetyMarker, setSelectedSafetyMarker] = useState<SafetyMarker | null>(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [isEditingMarker, setIsEditingMarker] = useState(false);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

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
      setPendingSafetyPoint({ type: safetyPlacingMode, x, y });
      setSafetyDescription("");
      setShowSafetyDialog(true);
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
      setPendingSafetyPoint({ type: safetyPlacingMode, x, y });
      setSafetyDescription("");
      setShowSafetyDialog(true);
      return;
    }

    if (selectionMode && onSelectLocation && activePlan) {
      setSelectedPoint({ x, y });
      onSelectLocation(activePlan.id, x, y);
    }
  };

  const placeSafetyMarker = async (type: "first_aid" | "fire_extinguisher" | "defibrillator", x: number, y: number, desc: string) => {
    if (!activePlan || !user || !activeProjectId) return;
    const { error } = await supabase.from("safety_markers").insert({
      project_id: activeProjectId,
      site_plan_id: activePlan.id,
      marker_type: type,
      plan_x: x,
      plan_y: y,
      description: desc,
      created_by: user.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("safety.markerPlaced") });
      setSafetyPlacingMode(null);
      await fetchSafetyMarkers();
    }
  };

  const updateSafetyMarkerDescription = async (markerId: string, desc: string) => {
    const { error } = await supabase.from("safety_markers").update({ description: desc }).eq("id", markerId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("safety.markerUpdated") });
      await fetchSafetyMarkers();
    }
  };

  const deleteSafetyMarker = async (markerId: string) => {
    const { error } = await supabase.from("safety_markers").delete().eq("id", markerId);
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
      .from("safety_markers")
      .select("*")
      .eq("project_id", activeProjectId);
    setSafetyMarkers((data as SafetyMarker[]) ?? []);
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

  // Clustering logic
  interface Cluster {
    id: string;
    cx: number;
    cy: number;
    reports: (RiskReport & { originalIndex: number })[];
    maxRisk: string;
  }

  const CLUSTER_RADIUS = 8; // % distance to merge

  const clusteredReports = useMemo((): Cluster[] => {
    if (!clusteringEnabled || planReports.length <= 5) {
      // No clustering needed, each report is its own "cluster"
      return planReports.map((r, idx) => ({
        id: r.id,
        cx: r.plan_x ?? 0,
        cy: r.plan_y ?? 0,
        reports: [{ ...r, originalIndex: idx }],
        maxRisk: r.risk_level,
      }));
    }

    const riskOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
    const clusters: Cluster[] = [];
    const indexed = planReports.map((r, idx) => ({ ...r, originalIndex: idx }));

    for (const r of indexed) {
      const rx = r.plan_x ?? 0;
      const ry = r.plan_y ?? 0;
      let merged = false;
      for (const c of clusters) {
        const dist = Math.sqrt((c.cx - rx) ** 2 + (c.cy - ry) ** 2);
        if (dist < CLUSTER_RADIUS) {
          c.reports.push(r);
          // Recalculate center
          c.cx = c.reports.reduce((s, rr) => s + (rr.plan_x ?? 0), 0) / c.reports.length;
          c.cy = c.reports.reduce((s, rr) => s + (rr.plan_y ?? 0), 0) / c.reports.length;
          if ((riskOrder[r.risk_level] ?? 0) > (riskOrder[c.maxRisk] ?? 0)) {
            c.maxRisk = r.risk_level;
          }
          merged = true;
          break;
        }
      }
      if (!merged) {
        clusters.push({
          id: `cluster-${r.id}`,
          cx: rx,
          cy: ry,
          reports: [r],
          maxRisk: r.risk_level,
        });
      }
    }
    return clusters;
  }, [planReports, clusteringEnabled]);

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

  const getMarkerLabel = (type: string) => {
    if (type === "first_aid") return t("safety.firstAid");
    if (type === "fire_extinguisher") return t("safety.fireExtinguisher");
    return t("safety.defibrillator");
  };

  const getMarkerColor = (type: string) => {
    if (type === "first_aid") return "bg-green-600";
    if (type === "fire_extinguisher") return "bg-red-600";
    return "bg-blue-600";
  };

  const getMarkerIcon = (type: string, size: string = "h-2.5 w-2.5") => {
    if (type === "first_aid") return <Cross className={`${size} text-white`} strokeWidth={3} />;
    if (type === "fire_extinguisher") return <Flame className={`${size} text-white`} strokeWidth={2.5} />;
    return <Heart className={`${size} text-white`} strokeWidth={2.5} />;
  };

  const SafetyMarkerIcon = ({ marker, showDelete }: { marker: SafetyMarker; showDelete: boolean }) => {
    const isSelected = selectedSafetyMarker?.id === marker.id;
    return (
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group"
        style={{ left: `${marker.plan_x}%`, top: `${marker.plan_y}%` }}
      >
        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center shadow-md border border-white/80 cursor-pointer transition-transform hover:scale-125 ${getMarkerColor(marker.marker_type)}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSafetyMarker(isSelected ? null : marker);
            setEditingDescription(marker.description);
            setIsEditingMarker(false);
          }}
        >
          {getMarkerIcon(marker.marker_type, "h-2.5 w-2.5")}
        </div>
        {isSelected && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-card border border-border rounded-lg px-3 py-2 shadow-xl z-30 text-[11px]" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-card-foreground mb-1">
              {getMarkerLabel(marker.marker_type)}
            </p>
            {isEditingMarker && isAdmin ? (
              <div className="space-y-1.5">
                <textarea
                  className="w-full text-xs border border-border rounded px-2 py-1 bg-background text-foreground resize-none"
                  rows={2}
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  placeholder={t("safety.descriptionPlaceholder")}
                />
                <div className="flex gap-1">
                  <Button size="sm" className="text-[10px] h-5 px-2" onClick={async () => {
                    await updateSafetyMarkerDescription(marker.id, editingDescription);
                    setIsEditingMarker(false);
                    setSelectedSafetyMarker({ ...marker, description: editingDescription });
                  }}>
                    {t("common.save")}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-[10px] h-5 px-2" onClick={() => setIsEditingMarker(false)}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground">
                  {marker.description || <span className="italic">{t("safety.noDescription")}</span>}
                </p>
                {isAdmin && (
                  <button
                    className="mt-1 text-accent text-[10px] font-medium hover:underline"
                    onClick={() => { setIsEditingMarker(true); setEditingDescription(marker.description); }}
                  >
                    {t("common.edit")}
                  </button>
                )}
              </>
            )}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
          </div>
        )}
        {showDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); deleteSafetyMarker(marker.id); }}
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
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
        <div className="flex items-center gap-1.5 flex-wrap">
          {planReports.length > 5 && (
            <Button
              variant={clusteringEnabled ? "default" : "outline"}
              size="sm"
              className="text-[10px] h-6 px-2"
              onClick={() => { setClusteringEnabled(e => !e); setExpandedClusterId(null); }}
            >
              <Layers className="h-2.5 w-2.5 mr-0.5" /> {t("apd.clusterToggle")}
            </Button>
          )}
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
              <Button
                variant={safetyPlacingMode === "first_aid" ? "default" : "outline"}
                size="sm"
                className={`text-[10px] h-6 px-2 ${safetyPlacingMode === "first_aid" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                onClick={() => setSafetyPlacingMode(safetyPlacingMode === "first_aid" ? null : "first_aid")}
              >
                <Cross className="h-2.5 w-2.5 mr-0.5" strokeWidth={3} /> {t("safety.placeFirstAid")}
              </Button>
              <Button
                variant={safetyPlacingMode === "fire_extinguisher" ? "default" : "outline"}
                size="sm"
                className={`text-[10px] h-6 px-2 ${safetyPlacingMode === "fire_extinguisher" ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                onClick={() => setSafetyPlacingMode(safetyPlacingMode === "fire_extinguisher" ? null : "fire_extinguisher")}
              >
                <Flame className="h-2.5 w-2.5 mr-0.5" strokeWidth={2.5} /> {t("safety.placeFireExtinguisher")}
              </Button>
              <Button
                variant={safetyPlacingMode === "defibrillator" ? "default" : "outline"}
                size="sm"
                className={`text-[10px] h-6 px-2 ${safetyPlacingMode === "defibrillator" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                onClick={() => setSafetyPlacingMode(safetyPlacingMode === "defibrillator" ? null : "defibrillator")}
              >
                <Heart className="h-2.5 w-2.5 mr-0.5" strokeWidth={2.5} /> {t("safety.placeDefibrillator")}
              </Button>

              <Button variant="outline" size="sm" className="text-[10px] h-6 px-2" onClick={() => setShowUpload(true)}>
                <Upload className="h-2.5 w-2.5 mr-0.5" /> {t("apd.upload")}
              </Button>
              {activePlan && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                  <X className="h-2.5 w-2.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {safetyPlacingMode && (
        <div className={`mb-3 text-xs text-center py-2 rounded-md font-medium ${
          safetyPlacingMode === "first_aid" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
          safetyPlacingMode === "fire_extinguisher" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
        }`}>
          {t("safety.placingMode")} – {getMarkerLabel(safetyPlacingMode)}
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
              {planSafetyMarkers.map(m => (
                <SafetyMarkerIcon key={m.id} marker={m} showDelete={isAdmin} />
              ))}
              {planReports.map((r, idx) => (
                <div
                  key={r.id}
                  className="absolute w-5 h-5 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
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
                    width: "50px",
                    height: "50px",
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle, ${riskDotColor[zone.maxRisk]}33 0%, transparent 70%)`,
                    border: `2px solid ${riskDotColor[zone.maxRisk]}66`,
                  }}
                />
              ))}
              {selectionMode && selectedPoint && (
                <div
                  className="absolute w-4 h-4 rounded-full border-2 border-accent bg-accent/50 transform -translate-x-1/2 -translate-y-1/2 animate-pulse pointer-events-none"
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
                    background: `radial-gradient(circle, ${riskDotColor[zone.maxRisk]}44 0%, transparent 70%)`,
                    border: `2px dashed ${riskDotColor[zone.maxRisk]}88`,
                  }}
                />
              ))}

              {planSafetyMarkers.map(m => (
                <SafetyMarkerIcon key={m.id} marker={m} showDelete={isAdmin} />
              ))}

              {planReports.map((r, idx) => (
                <div
                  key={r.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                  style={{ left: `${r.plan_x}%`, top: `${r.plan_y}%` }}
                  onMouseEnter={() => setHoveredReport(r.id)}
                  onMouseLeave={() => setHoveredReport(null)}
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-150 flex items-center justify-center"
                    style={{ backgroundColor: riskDotColor[r.risk_level] ?? "#888" }}
                  >
                    <span className="text-[8px] font-bold text-white leading-none">{idx + 1}</span>
                  </div>
                  {hoveredReport === r.id && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 whitespace-nowrap bg-card border border-border rounded-md px-2 py-1 shadow-lg z-20 text-[11px]">
                      <p className="font-semibold text-card-foreground">#{idx + 1} – {r.title}</p>
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

              {selectionMode && selectedPoint && (
                <div
                  className="absolute w-4 h-4 rounded-full border-2 border-accent bg-accent/50 transform -translate-x-1/2 -translate-y-1/2 animate-pulse pointer-events-none"
                  style={{ left: `${selectedPoint.x}%`, top: `${selectedPoint.y}%` }}
                />
              )}
            </div>
          )}

          {(planReports.length > 0 || planSafetyMarkers.length > 0) && (
            <div className="absolute bottom-2 left-2 bg-card/95 backdrop-blur-sm border border-border rounded-md px-2 py-1.5 text-[9px] z-10 max-w-[180px]">
              <p className="font-semibold text-card-foreground mb-0.5 flex items-center gap-1">
                <AlertTriangle className="h-2.5 w-2.5 text-accent" />
                {t("apd.legendTitle")}
              </p>
              {(["critical", "high", "medium", "low"] as const).map(level => {
                const count = planReports.filter(r => r.risk_level === level).length;
                if (count === 0) return null;
                return (
                  <div key={level} className="flex items-center gap-1 py-0.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0 border border-card" style={{ backgroundColor: riskDotColor[level] }} />
                    <span className="text-card-foreground font-medium">{t(`risk.${level}`)}</span>
                    <span className="text-muted-foreground ml-auto">({count})</span>
                  </div>
                );
              })}
              {(["first_aid", "fire_extinguisher", "defibrillator"] as const).map(type => {
                if (!planSafetyMarkers.some(m => m.marker_type === type)) return null;
                return (
                  <div key={type} className="flex items-center gap-1 py-0.5">
                    <span className={`w-2 h-2 rounded-sm flex-shrink-0 ${getMarkerColor(type)} flex items-center justify-center`}>
                      {getMarkerIcon(type, "h-1 w-1")}
                    </span>
                    <span className="text-card-foreground font-medium">{getMarkerLabel(type)}</span>
                  </div>
                );
              })}
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

      {!selectionMode && planReports.length > 0 && (
        <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
          <h3 className="text-xs font-semibold text-card-foreground mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-accent" />
            {t("apd.activeRisks")} ({planReports.length})
          </h3>
          <div className="space-y-1">
            {planReports.map((r, idx) => (
              <div key={r.id} className="flex items-center gap-2 text-[11px] py-1 border-b border-border/50 last:border-0">
                <span
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border border-white shadow-sm"
                  style={{ backgroundColor: riskDotColor[r.risk_level] ?? "#888" }}
                >
                  <span className="text-[8px] font-bold text-white">{idx + 1}</span>
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-card-foreground font-medium">{r.title}</span>
                  <span className="text-muted-foreground ml-1.5">{r.category} · {r.location}</span>
                </div>
                <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: riskDotColor[r.risk_level] }}>
                  {t(`risk.${r.risk_level}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      <Dialog open={showSafetyDialog} onOpenChange={(open) => { if (!open) { setShowSafetyDialog(false); setPendingSafetyPoint(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {pendingSafetyPoint?.type ? getMarkerLabel(pendingSafetyPoint.type) : ""} – {t("safety.addDescription")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground resize-none"
              rows={3}
              value={safetyDescription}
              onChange={(e) => setSafetyDescription(e.target.value)}
              placeholder={t("safety.descriptionPlaceholder")}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowSafetyDialog(false); setPendingSafetyPoint(null); }}>
                {t("common.cancel")}
              </Button>
              <Button size="sm" onClick={async () => {
                if (pendingSafetyPoint) {
                  await placeSafetyMarker(pendingSafetyPoint.type as "first_aid" | "fire_extinguisher" | "defibrillator", pendingSafetyPoint.x, pendingSafetyPoint.y, safetyDescription);
                  setShowSafetyDialog(false);
                  setPendingSafetyPoint(null);
                  setSafetyDescription("");
                }
              }}>
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

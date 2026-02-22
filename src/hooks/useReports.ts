import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ReportStatus = "open" | "in-progress" | "resolved";
export type SortOption = "newest" | "severity" | "oldest-open";

export interface RiskReport {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  risk_level: RiskLevel;
  status: ReportStatus;
  reported_by: string | null;
  reporter_name?: string;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface ReportComment {
  id: string;
  report_id: string;
  user_id: string | null;
  commenter_name?: string;
  content: string;
  created_at: string;
}

const RISK_ORDER: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function assessRisk(description: string, category: string): RiskLevel {
  const text = `${description} ${category}`.toLowerCase();
  if (text.includes("brand") || text.includes("explosion") || text.includes("skyddsutrustning") || text.includes("kemikalie"))
    return "critical";
  if (text.includes("hal") || text.includes("fall") || text.includes("tung") || text.includes("utgången"))
    return "high";
  if (text.includes("belysning") || text.includes("kabel") || text.includes("snubbel") || text.includes("buller"))
    return "medium";
  return "low";
}

export function useReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<RiskReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from("risk_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      return;
    }
    setReports((data as RiskReport[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel("risk_reports_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "risk_reports" }, () => {
        fetchReports();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchReports]);

  const addReport = async (report: { title: string; description: string; location: string; category: string; imageFile?: File }) => {
    if (!user) return;

    let image_url: string | null = null;
    if (report.imageFile) {
      const ext = report.imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("report-images").upload(path, report.imageFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("report-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }
    }

    const risk_level = assessRisk(report.description, report.category);

    const { error } = await supabase.from("risk_reports").insert({
      title: report.title,
      description: report.description,
      location: report.location,
      category: report.category,
      risk_level,
      status: "open",
      reported_by: user.id,
      image_url,
    });

    if (error) {
      toast({ title: "Kunde inte skapa rapport", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rapport skapad!", description: "Risken har bedömts automatiskt." });
    }
  };

  const updateReport = async (id: string, updates: Partial<Pick<RiskReport, "title" | "description" | "location" | "category" | "status">>) => {
    const finalUpdates: any = { ...updates };
    if (updates.status === "resolved") {
      finalUpdates.resolved_at = new Date().toISOString();
    }
    if (updates.description || updates.category) {
      const existing = reports.find((r) => r.id === id);
      finalUpdates.risk_level = assessRisk(
        updates.description ?? existing?.description ?? "",
        updates.category ?? existing?.category ?? ""
      );
    }

    const { error } = await supabase.from("risk_reports").update(finalUpdates).eq("id", id);
    if (error) {
      toast({ title: "Kunde inte uppdatera", description: error.message, variant: "destructive" });
    }
  };

  const sortReports = (list: RiskReport[], sort: SortOption): RiskReport[] => {
    const sorted = [...list];
    switch (sort) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "severity":
        return sorted.sort((a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level]);
      case "oldest-open":
        return sorted
          .filter((r) => r.status !== "resolved")
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .concat(sorted.filter((r) => r.status === "resolved"));
    }
  };

  return { reports, loading, addReport, updateReport, sortReports };
}

export function useComments(reportId: string | null) {
  const [comments, setComments] = useState<ReportComment[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComments = useCallback(async () => {
    if (!reportId) return;
    const { data } = await supabase
      .from("report_comments")
      .select("*")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });
    setComments((data as ReportComment[]) ?? []);
  }, [reportId]);

  useEffect(() => {
    fetchComments();
    if (!reportId) return;

    const channel = supabase
      .channel(`comments_${reportId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "report_comments", filter: `report_id=eq.${reportId}` }, () => {
        fetchComments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [reportId, fetchComments]);

  const addComment = async (content: string) => {
    if (!reportId || !user) return;
    const { error } = await supabase.from("report_comments").insert({
      report_id: reportId,
      user_id: user.id,
      content,
    });
    if (error) {
      toast({ title: "Kunde inte lägga till kommentar", description: error.message, variant: "destructive" });
    }
  };

  return { comments, addComment };
}

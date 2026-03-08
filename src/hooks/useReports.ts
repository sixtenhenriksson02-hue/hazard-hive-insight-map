import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ReportStatus = "open" | "in-progress" | "resolved";
export type ReportType = "observation" | "injury";
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
  project_id?: string | null;
  report_type: ReportType;
  building?: string | null;
  specific_location?: string | null;
  body_part?: string | null;
  injury_type?: string | null;
  medical_care_required?: boolean;
  absence_required?: boolean;
  absence_days?: number;
  severity_rating?: number;
  ai_explanation?: string | null;
  site_plan_id?: string | null;
  plan_x?: number | null;
  plan_y?: number | null;
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

async function assessRiskWithAI(report: {
  title: string;
  description: string;
  category: string;
  report_type: ReportType;
  building?: string;
  specific_location?: string;
  body_part?: string;
  injury_type?: string;
  medical_care_required?: boolean;
  absence_required?: boolean;
  absence_days?: number;
  comments?: string[];
}): Promise<{ risk_level: RiskLevel; explanation: string; severity_rating: number; should_resolve?: boolean }> {
  try {
    const { data, error } = await supabase.functions.invoke("assess-risk", {
      body: report,
    });
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("AI assessment failed, using fallback:", e);
    return { risk_level: "medium", explanation: "Automatisk bedömning misslyckades.", severity_rating: 3 };
  }
}

export function useReports() {
  const { user, activeProjectId, role, viewAs } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<RiskReport[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === "admin" && viewAs === "admin";

  const fetchReports = useCallback(async (projectIdFilter?: string | null) => {
    let query = supabase
      .from("risk_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (projectIdFilter) {
      query = query.eq("project_id", projectIdFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching reports:", error);
      return;
    }

    // Fetch reporter names
    const reportsData = (data as RiskReport[]) ?? [];
    const userIds = [...new Set(reportsData.map(r => r.reported_by).filter(Boolean))] as string[];
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      
      const nameMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) ?? []);
      reportsData.forEach(r => {
        if (r.reported_by) {
          r.reporter_name = nameMap.get(r.reported_by) ?? undefined;
        }
      });
    }

    setReports(reportsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReports(activeProjectId);

    const channel = supabase
      .channel("risk_reports_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "risk_reports" }, () => {
        fetchReports(activeProjectId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchReports, activeProjectId]);

  const addReport = async (report: {
    title: string;
    description: string;
    location: string;
    category: string;
    imageFile?: File;
    report_type: ReportType;
    building?: string;
    specific_location?: string;
    body_part?: string;
    injury_type?: string;
    medical_care_required?: boolean;
    absence_required?: boolean;
    absence_days?: number;
    severity_rating?: number;
    project_id?: string;
    site_plan_id?: string;
    plan_x?: number;
    plan_y?: number;
  }) => {
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

    // AI assessment
    const assessment = await assessRiskWithAI({
      title: report.title,
      description: report.description,
      category: report.category,
      report_type: report.report_type,
      building: report.building,
      specific_location: report.specific_location,
      body_part: report.body_part,
      injury_type: report.injury_type,
      medical_care_required: report.medical_care_required,
      absence_required: report.absence_required,
      absence_days: report.absence_days,
    });

    const targetProjectId = report.project_id || activeProjectId;

    const { error } = await supabase.from("risk_reports").insert({
      title: report.title,
      description: report.description,
      location: report.location,
      category: report.category,
      risk_level: assessment.risk_level,
      status: "open" as const,
      reported_by: user.id,
      image_url,
      project_id: targetProjectId,
      report_type: report.report_type,
      building: report.building,
      specific_location: report.specific_location,
      body_part: report.body_part,
      injury_type: report.injury_type,
      medical_care_required: report.medical_care_required ?? false,
      absence_required: report.absence_required ?? false,
      absence_days: report.absence_days ?? 0,
      severity_rating: assessment.severity_rating,
      ai_explanation: assessment.explanation,
      site_plan_id: report.site_plan_id ?? null,
      plan_x: report.plan_x ?? null,
      plan_y: report.plan_y ?? null,
    });

    if (error) {
      toast({ title: "Kunde inte skapa rapport", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rapport skapad!", description: assessment.explanation });
    }
  };

  const updateReport = async (id: string, updates: Partial<Pick<RiskReport, "title" | "description" | "location" | "category" | "status" | "risk_level" | "ai_explanation">>) => {
    const finalUpdates: any = { ...updates };
    if (updates.status === "resolved") {
      finalUpdates.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase.from("risk_reports").update(finalUpdates).eq("id", id);
    if (error) {
      toast({ title: "Kunde inte uppdatera", description: error.message, variant: "destructive" });
    }
  };

  const reassessReport = async (id: string) => {
    const report = reports.find(r => r.id === id);
    if (!report) return;

    // Fetch comments for this report to give AI context
    const { data: commentData } = await supabase
      .from("report_comments")
      .select("content")
      .eq("report_id", id)
      .order("created_at", { ascending: true });

    const comments = commentData?.map(c => c.content) ?? [];

    const assessment = await assessRiskWithAI({
      title: report.title,
      description: report.description,
      category: report.category,
      report_type: report.report_type,
      building: report.building ?? undefined,
      specific_location: report.specific_location ?? undefined,
      body_part: report.body_part ?? undefined,
      injury_type: report.injury_type ?? undefined,
      medical_care_required: report.medical_care_required,
      absence_required: report.absence_required,
      absence_days: report.absence_days,
      comments,
    });

    const updates: any = {
      risk_level: assessment.risk_level as RiskLevel,
      ai_explanation: assessment.explanation,
    };

    // If AI suggests resolving, auto-resolve
    if (assessment.should_resolve && report.status !== "resolved") {
      updates.status = "resolved";
      updates.resolved_at = new Date().toISOString();
    }

    await updateReport(id, updates);
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

  return { reports, loading, addReport, updateReport, reassessReport, sortReports };
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

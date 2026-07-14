import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ReportStatus = "open" | "in-progress" | "resolved";
export type ReportType = "observation" | "injury" | "improvement";
export type SortOption = "newest" | "oldest" | "severity-high" | "severity-low";

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
  suggested_actions?: string[] | null;
  risk_locked?: boolean;
  site_plan_id?: string | null;
  plan_x?: number | null;
  plan_y?: number | null;
  due_date?: string | null;
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
}): Promise<{ risk_level: RiskLevel; explanation: string; severity_rating: number; should_resolve?: boolean; suggested_actions?: string[]; generated_title?: string }> {
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
    setLoading(true);
    try {
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
        toast({ title: "Kunde inte hämta rapporter", description: error.message, variant: "destructive" });
        setReports([]);
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
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      toast({ title: "Kunde inte hämta rapporter", description: "Kontrollera anslutningen och försök igen.", variant: "destructive" });
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReports(activeProjectId);

    const changeFilter = activeProjectId ? { filter: `project_id=eq.${activeProjectId}` } : {};
    const channel = supabase
      .channel(activeProjectId ? `risk_reports_changes_${activeProjectId}` : "risk_reports_changes_all")
      .on("postgres_changes", { event: "*", schema: "public", table: "risk_reports", ...changeFilter }, () => {
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

    // AI assessment — skip heavy risk assessment for improvement suggestions
    let assessment: { risk_level: RiskLevel; explanation: string; severity_rating: number; should_resolve?: boolean; suggested_actions?: string[]; generated_title?: string };
    if (report.report_type === "improvement") {
      assessment = {
        risk_level: "low",
        explanation: "Förbättringsförslag – ingen direkt risk identifierad.",
        severity_rating: 1,
        generated_title: undefined,
      };
      // Still call AI for a good title
      try {
        const { data } = await supabase.functions.invoke("assess-risk", {
          body: { ...report, title: report.title, description: report.description, category: report.category, report_type: "improvement" },
        });
        if (data?.generated_title) assessment.generated_title = data.generated_title;
        if (data?.explanation) assessment.explanation = data.explanation;
        if (data?.suggested_actions) assessment.suggested_actions = data.suggested_actions;
      } catch {}
    } else {
      assessment = await assessRiskWithAI({
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
    }

    const targetProjectId = report.project_id || activeProjectId;

    // Use AI-generated title if available, otherwise fall back to user title
    const finalTitle = assessment.generated_title || report.title;

    const { error } = await supabase.from("risk_reports").insert({
      title: finalTitle,
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
      severity_rating: Math.round(assessment.severity_rating),
      ai_explanation: assessment.explanation,
      suggested_actions: assessment.suggested_actions ?? [],
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

  const updateReport = async (id: string, updates: Partial<Pick<RiskReport, "title" | "description" | "location" | "category" | "status" | "risk_level" | "ai_explanation" | "risk_locked" | "due_date">>) => {
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
    // Always fetch fresh data from DB so latest edits are included
    const { data: freshReport, error: fetchError } = await supabase
      .from("risk_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !freshReport) {
      toast({ title: "Kunde inte hämta rapport", variant: "destructive" });
      return;
    }
    const report = freshReport as RiskReport;

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

    const previousLevel = report.risk_level;
    const newLevel = assessment.risk_level as RiskLevel;
    const isLocked = report.risk_locked === true;

    const updates: any = {
      ai_explanation: assessment.explanation,
      suggested_actions: assessment.suggested_actions ?? [],
    };

    // Respect admin manual override: only update risk_level if not locked
    if (!isLocked) {
      updates.risk_level = newLevel;
    }

    // If AI suggests resolving, auto-resolve
    if (assessment.should_resolve && report.status !== "resolved") {
      updates.status = "resolved";
      updates.resolved_at = new Date().toISOString();
    }

    await updateReport(id, updates);

    // Clear toast feedback
    const RISK_LABELS: Record<RiskLevel, string> = { low: "Låg", medium: "Medel", high: "Hög", critical: "Kritisk" };
    if (isLocked) {
      toast({ title: "Bedömning uppdaterad", description: "Risknivån är låst av admin — endast förklaring och åtgärder uppdaterades." });
    } else if (previousLevel !== newLevel) {
      toast({ title: "Ny risknivå", description: `Ändrad från ${RISK_LABELS[previousLevel]} till ${RISK_LABELS[newLevel]}.` });
    } else {
      toast({ title: "Bedömning uppdaterad", description: `Risknivå kvar på ${RISK_LABELS[newLevel]}. Förklaring och åtgärder uppdaterade.` });
    }
  };

  const sortReports = (list: RiskReport[], sort: SortOption): RiskReport[] => {
    const sorted = [...list];
    switch (sort) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "oldest":
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "severity-high":
        return sorted.sort((a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level]);
      case "severity-low":
        return sorted.sort((a, b) => RISK_ORDER[b.risk_level] - RISK_ORDER[a.risk_level]);
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

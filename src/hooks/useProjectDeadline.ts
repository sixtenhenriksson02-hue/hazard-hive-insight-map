import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function useProjectDeadline() {
  const { activeProjectId } = useAuth();
  const { toast } = useToast();
  const [deadlineDays, setDeadlineDaysState] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!activeProjectId) {
      setDeadlineDaysState(null);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("default_deadline_days")
      .eq("id", activeProjectId)
      .maybeSingle();
    setDeadlineDaysState(((data as any)?.default_deadline_days as number | null) ?? null);
    setLoading(false);
  }, [activeProjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const setDeadlineDays = async (days: number | null) => {
    if (!activeProjectId) return;
    const { error } = await supabase
      .from("projects")
      .update({ default_deadline_days: days } as any)
      .eq("id", activeProjectId);
    if (error) {
      toast({ title: "Kunde inte spara deadline", description: error.message, variant: "destructive" });
      return;
    }
    setDeadlineDaysState(days);
    toast({ title: "Sparat", description: days ? `Standard-deadline satt till ${days} dagar.` : "Standard-deadline borttagen." });
  };

  return { deadlineDays, setDeadlineDays, loading };
}

export function computeDueDate(createdAt: string, days: number | null | undefined): Date | null {
  if (!days || days <= 0) return null;
  const d = new Date(createdAt);
  d.setDate(d.getDate() + days);
  return d;
}

export function isReportOverdue(createdAt: string, status: string, days: number | null | undefined): boolean {
  if (status === "resolved") return false;
  const due = computeDueDate(createdAt, days);
  return !!due && due.getTime() < Date.now();
}

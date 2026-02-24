import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Project {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setProjects(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string, userId: string) => {
    const { error } = await supabase.from("projects").insert({ name, created_by: userId });
    if (error) {
      toast({ title: "Kunde inte skapa projekt", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchProjects();
    return true;
  };

  return { projects, loading, createProject, refetch: fetchProjects };
}

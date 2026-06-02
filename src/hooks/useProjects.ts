import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Project {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  invite_code?: string;
  archived?: boolean;
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
    if (!error) setProjects((data as Project[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
    const handler = () => fetchProjects();
    window.addEventListener("lovable:projects-changed", handler);
    return () => window.removeEventListener("lovable:projects-changed", handler);
  }, [fetchProjects]);

  const notifyChange = () => window.dispatchEvent(new Event("lovable:projects-changed"));

  const createProject = async (name: string, userId: string) => {
    const { error } = await supabase.from("projects").insert({ name, created_by: userId });
    if (error) {
      toast({ title: "Kunde inte skapa projekt", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchProjects();
    notifyChange();
    return true;
  };

  const joinByCode = async (code: string, userId: string): Promise<boolean> => {
    // Find project by invite code
    const { data: projectData, error: findError } = await supabase
      .from("projects")
      .select("id, name")
      .eq("invite_code", code.toUpperCase().trim())
      .maybeSingle();

    if (findError || !projectData) {
      toast({ title: "Ogiltig kod", description: "Ingen projekt hittades med den koden.", variant: "destructive" });
      return false;
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from("user_projects")
      .select("id")
      .eq("user_id", userId)
      .eq("project_id", projectData.id)
      .maybeSingle();

    if (existing) {
      toast({ title: "Redan tillagd", description: `Du är redan med i ${projectData.name}.` });
      return true;
    }

    const { error: joinError } = await supabase
      .from("user_projects")
      .insert({ user_id: userId, project_id: projectData.id });

    if (joinError) {
      toast({ title: "Kunde inte gå med", description: joinError.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Tillagd!", description: `Du har gått med i ${projectData.name}.` });
    return true;
  };

  const archiveProject = async (projectId: string, archived: boolean) => {
    const { error } = await supabase
      .from("projects")
      .update({ archived } as any)
      .eq("id", projectId);
    if (error) {
      toast({ title: "Kunde inte uppdatera projekt", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchProjects();
    notifyChange();
    return true;
  };

  return { projects, loading, createProject, joinByCode, archiveProject, refetch: fetchProjects };
}

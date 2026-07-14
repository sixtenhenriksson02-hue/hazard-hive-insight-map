import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProjectLocation {
  id: string;
  project_id: string;
  label: string;
  address: string;
  location_type: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useProjectLocations(projectId: string | null) {
  const [locations, setLocations] = useState<ProjectLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    if (!projectId) {
      setLocations([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("project_locations" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) {
        toast({ title: "Kunde inte hämta platser", description: error.message, variant: "destructive" });
        setLocations([]);
        return;
      }
      setLocations((data as unknown as ProjectLocation[]) ?? []);
    } catch (error) {
      toast({ title: "Kunde inte hämta platser", description: "Kontrollera anslutningen och försök igen.", variant: "destructive" });
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addLocation = async (input: Omit<ProjectLocation, "id" | "created_at" | "updated_at" | "created_by"> & { created_by: string }) => {
    const { error } = await supabase.from("project_locations" as any).insert(input as any);
    if (error) {
      toast({ title: "Kunde inte lägga till plats", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  const removeLocation = async (id: string) => {
    const { error } = await supabase.from("project_locations" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Kunde inte ta bort", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  return { locations, loading, addLocation, removeLocation, refetch: fetch };
}

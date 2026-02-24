import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "admin" | "worker";

interface AuthContextType {
  user: User | null;
  role: AppRole;
  displayName: string;
  projectId: string | null;
  projectName: string | null;
  isLoading: boolean;
  viewAs: AppRole;
  setViewAs: (role: AppRole) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>("worker");
  const [displayName, setDisplayName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewAs, setViewAs] = useState<AppRole>("admin");

  const loadUserData = async (u: User) => {
    try {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", u.id),
        supabase.from("profiles").select("display_name, project_id").eq("user_id", u.id).single(),
      ]);
      const userRole = (roles?.[0]?.role as AppRole) ?? "worker";
      setRole(userRole);
      setViewAs(userRole);
      setDisplayName(profile?.display_name ?? "Anonym");

      const pid = profile?.project_id ?? u.user_metadata?.project_id ?? null;
      setProjectId(pid);

      if (!profile?.project_id && u.user_metadata?.project_id) {
        supabase.from("profiles").update({ project_id: u.user_metadata.project_id }).eq("user_id", u.id);
      }

      if (pid) {
        const { data: proj } = await supabase.from("projects").select("name").eq("id", pid).single();
        setProjectName(proj?.name ?? null);
      }
    } catch (e) {
      console.error("Error loading user data:", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadUserData(u).finally(() => mounted && setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadUserData(u);
      } else {
        setRole("worker");
        setDisplayName("");
        setProjectId(null);
        setProjectName(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, displayName, projectId, projectName, isLoading, viewAs, setViewAs, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

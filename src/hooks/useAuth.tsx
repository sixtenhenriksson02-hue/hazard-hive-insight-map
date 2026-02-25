import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "admin" | "worker";

interface UserProject {
  id: string;
  project_id: string;
  project_name: string;
}

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
  // Multi-project support
  userProjects: UserProject[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  addUserProject: (projectId: string) => Promise<void>;
  removeUserProject: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
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
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);

  const setActiveProjectId = useCallback((id: string | null) => {
    setActiveProjectIdState(id);
    // Update project name from userProjects
    if (id) {
      const proj = userProjects.find(p => p.project_id === id);
      setProjectName(proj?.project_name ?? null);
    } else {
      setProjectName(null);
    }
  }, [userProjects]);

  const loadUserProjects = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_projects")
      .select("id, project_id")
      .eq("user_id", userId);

    if (!data || data.length === 0) {
      setUserProjects([]);
      return [];
    }

    // Fetch project names
    const projectIds = data.map(d => d.project_id);
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", projectIds);

    const result: UserProject[] = data.map(d => ({
      id: d.id,
      project_id: d.project_id,
      project_name: projects?.find(p => p.id === d.project_id)?.name ?? "",
    }));

    setUserProjects(result);
    return result;
  }, []);

  const refreshProjects = useCallback(async () => {
    if (user) await loadUserProjects(user.id);
  }, [user, loadUserProjects]);

  const addUserProject = useCallback(async (projectId: string) => {
    if (!user) return;
    await supabase.from("user_projects").insert({ user_id: user.id, project_id: projectId });
    await loadUserProjects(user.id);
  }, [user, loadUserProjects]);

  const removeUserProject = useCallback(async (projectId: string) => {
    if (!user) return;
    await supabase.from("user_projects").delete().eq("user_id", user.id).eq("project_id", projectId);
    const remaining = await loadUserProjects(user.id);
    if (activeProjectId === projectId) {
      setActiveProjectIdState(remaining[0]?.project_id ?? null);
    }
  }, [user, loadUserProjects, activeProjectId]);

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

      // Load user projects
      const projects = await loadUserProjects(u.id);

      // Auto-add initial project if user has profile project but no user_projects entry
      if (pid && projects.length === 0) {
        await supabase.from("user_projects").upsert({ user_id: u.id, project_id: pid }, { onConflict: "user_id,project_id" });
        const updatedProjects = await loadUserProjects(u.id);
        setActiveProjectIdState(pid);
        if (updatedProjects.length > 0) {
          setProjectName(updatedProjects.find(p => p.project_id === pid)?.project_name ?? null);
        }
      } else if (projects.length > 0) {
        // For admin, default to first project; for workers use their profile project or first
        const defaultPid = pid && projects.some(p => p.project_id === pid) ? pid : projects[0].project_id;
        setActiveProjectIdState(defaultPid);
        setProjectName(projects.find(p => p.project_id === defaultPid)?.project_name ?? null);
      } else if (pid) {
        setActiveProjectIdState(pid);
        const { data: proj } = await supabase.from("projects").select("name").eq("id", pid).single();
        setProjectName(proj?.name ?? null);
      }
    } catch (e) {
      console.error("Error loading user data:", e);
    }
  };

  useEffect(() => {
    let mounted = true;

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
        setUserProjects([]);
        setActiveProjectIdState(null);
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
    <AuthContext.Provider value={{
      user, role, displayName, projectId, projectName, isLoading, viewAs, setViewAs, signOut,
      userProjects, activeProjectId, setActiveProjectId, addUserProject, removeUserProject, refreshProjects,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

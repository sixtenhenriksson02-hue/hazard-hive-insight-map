import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

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
  refreshUserProjects: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = /^sb-.+-auth-token$/;

const clearStoredAuthSession = () => {
  try {
    [window.localStorage, window.sessionStorage].forEach((storage) => {
      Object.keys(storage)
        .filter((key) => AUTH_STORAGE_KEY.test(key))
        .forEach((key) => storage.removeItem(key));
    });
  } catch (error) {
    console.warn("Could not clear stored auth session", error);
  }
};

const isInvalidSessionError = (error: unknown) => {
  const message = String((error as { message?: string } | null)?.message ?? error ?? "").toLowerCase();
  return (
    message.includes("refresh token") ||
    message.includes("invalid jwt") ||
    message.includes("jwt expired") ||
    message.includes("session") ||
    message.includes("not found")
  );
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = 8000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Auth check timed out")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

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
  const currentUserIdRef = useRef<string | null>(null);

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
      .select("id, name, archived")
      .in("id", projectIds);

    // Filter out archived projects for workers
    const activeProjects = projects?.filter((p: any) => !p.archived) ?? [];

    const result: UserProject[] = data.map(d => ({
      id: d.id,
      project_id: d.project_id,
      project_name: activeProjects.find(p => p.id === d.project_id)?.name ?? "",
    })).filter(d => activeProjects.some(p => p.id === d.project_id));

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

  const clearUserState = useCallback(() => {
    setRole("worker");
    setDisplayName("");
    setProjectId(null);
    setProjectName(null);
    setUserProjects([]);
    setActiveProjectIdState(null);
  }, []);

  const loadUserData = useCallback(async (u: User) => {
    try {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", u.id),
        supabase.from("profiles").select("display_name, project_id").eq("user_id", u.id).maybeSingle(),
      ]);

      const userRole = (roles?.[0]?.role as AppRole) ?? "worker";
      setRole(userRole);
      setViewAs(userRole);
      setDisplayName(profile?.display_name ?? u.user_metadata?.display_name ?? "Anonym");

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
  }, [loadUserProjects]);

  useEffect(() => {
    let mounted = true;

    const applySession = (session: Session | null, showLoader = false) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      currentUserIdRef.current = nextUser?.id ?? null;

      if (!nextUser) {
        clearUserState();
        setIsLoading(false);
        return;
      }

      if (showLoader) {
        setIsLoading(true);
      }

      void loadUserData(nextUser).finally(() => {
        if (mounted) setIsLoading(false);
      });
    };

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error } = await withTimeout(supabase.auth.getSession());

        if (!mounted) return;

        if (error) {
          if (isInvalidSessionError(error)) {
            clearStoredAuthSession();
            await supabase.auth.signOut({ scope: "local" });
          }
          applySession(null, false);
          return;
        }

        if (!session) {
          applySession(null, false);
          return;
        }

        const { data: { user: verifiedUser }, error: userError } = await withTimeout(supabase.auth.getUser());

        if (!mounted) return;

        if (userError || !verifiedUser) {
          if (isInvalidSessionError(userError)) {
            clearStoredAuthSession();
            await supabase.auth.signOut({ scope: "local" });
            applySession(null, false);
          } else {
            applySession(session, true);
          }
          return;
        }

        applySession({ ...session, user: verifiedUser } as Session, true);
      } catch (error) {
        console.error("Auth initialization failed:", error);
        if (mounted) {
          if (isInvalidSessionError(error)) clearStoredAuthSession();
          applySession(null, false);
        }
      }
    };

    void initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setTimeout(() => {
        if (!mounted) return;
        if (event === "SIGNED_OUT") {
          clearStoredAuthSession();
        }
        applySession(session, false);
      }, 0);
    });

    const projectsChanged = () => {
      if (currentUserIdRef.current) {
        void loadUserProjects(currentUserIdRef.current);
      }
    };
    window.addEventListener("lovable:projects-changed", projectsChanged);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("lovable:projects-changed", projectsChanged);
    };
  }, [clearUserState, loadUserData, loadUserProjects]);

  const signOut = async () => {
    await supabase.auth.signOut({ scope: "local" });
    clearStoredAuthSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, role, displayName, projectId, projectName, isLoading, viewAs, setViewAs, signOut,
      userProjects, activeProjectId, setActiveProjectId, addUserProject, removeUserProject, refreshProjects, refreshUserProjects: refreshProjects,
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

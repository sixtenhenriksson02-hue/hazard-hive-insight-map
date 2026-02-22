import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "admin" | "worker";

interface AuthContextType {
  user: User | null;
  role: AppRole;
  displayName: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [viewAs, setViewAs] = useState<AppRole>("admin");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // Fetch role and profile
        const [{ data: roles }, { data: profile }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", u.id),
          supabase.from("profiles").select("display_name").eq("user_id", u.id).single(),
        ]);
        const userRole = (roles?.[0]?.role as AppRole) ?? "worker";
        setRole(userRole);
        setViewAs(userRole);
        setDisplayName(profile?.display_name ?? "Anonym");
      } else {
        setRole("worker");
        setDisplayName("");
      }
      setIsLoading(false);
    });

    supabase.auth.getSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, displayName, isLoading, viewAs, setViewAs, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

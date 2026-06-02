import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useProjects, Project } from "@/hooks/useProjects";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"admin" | "worker">("worker");
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { lang, setLang, t } = useLanguage();
  const { projects, loading: loadingProjects } = useProjects();

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.resetSent"), description: t("auth.resetSentDesc") });
      setIsForgot(false);
    }
  };

  // Försöker en async-operation upp till N gånger om det blir nätverksfel ("Load failed" / "Failed to fetch")
  const withRetry = async <T,>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastErr = err;
        const msg = (err?.message || "").toLowerCase();
        const isNetwork = msg.includes("load failed") || msg.includes("failed to fetch") || msg.includes("networkerror");
        if (!isNetwork || i === attempts - 1) throw err;
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
      }
    }
    throw lastErr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (!navigator.onLine) {
        throw new Error(lang === "sv" ? "Ingen internetanslutning. Kontrollera ditt nätverk och försök igen." : "No internet connection. Check your network and try again.");
      }
      if (isLogin) {
        const { error } = await withRetry(() => supabase.auth.signInWithPassword({ email, password }));
        if (error) throw error;
      } else {
        const { error } = await withRetry(() => supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, role, project_id: selectedProject || null },
          },
        }));
        if (error) throw error;
        toast({ title: t("auth.accountCreated"), description: t("auth.loggedIn") });
      }
    } catch (err: any) {
      const raw = err?.message || "";
      const friendly = /load failed|failed to fetch|networkerror/i.test(raw)
        ? (lang === "sv" ? "Nätverksfel – kontrollera anslutningen och försök igen." : "Network error – check your connection and try again.")
        : raw;
      toast({ title: "Fel", description: friendly, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-accent mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground">{t("app.name")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("app.tagline")}</p>
          <button
            onClick={() => setLang(lang === "sv" ? "en" : "sv")}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "sv" ? "English" : "Svenska"}
          </button>
        </div>

        {isForgot ? (
          <form onSubmit={handleForgotPassword} className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-card-foreground">{t("auth.forgotPassword")}</h2>
            <div>
              <label className="text-sm font-medium text-card-foreground mb-1 block">{t("auth.email")}</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="din@email.se" required />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
              {loading ? t("common.loading") : t("auth.sendResetLink")}
            </Button>
            <p className="text-center text-sm">
              <button type="button" onClick={() => setIsForgot(false)} className="text-accent font-medium hover:underline">
                {t("auth.backToLogin")}
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-card-foreground">
              {isLogin ? t("auth.login") : t("auth.signup")}
            </h2>

            {!isLogin && (
              <>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1 block">{t("auth.name")}</label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("auth.name")} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1 block">{t("auth.role")}</label>
                  <div className="flex gap-2">
                    {(["worker", "admin"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex-1 text-sm font-medium px-3 py-2 rounded-md border transition-colors ${
                          role === r
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border hover:border-accent"
                        }`}
                      >
                        {t(`auth.${r}`)}
                      </button>
                    ))}
                  </div>
                </div>
                {projects.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-card-foreground mb-1 block">{t("auth.selectProject")}</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="text-sm font-medium text-card-foreground mb-1 block">{t("auth.email")}</label>
              <Input id="auth-email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="din@email.se" required />
            </div>

            <div>
              <label htmlFor="auth-password" className="text-sm font-medium text-card-foreground mb-1 block">{t("auth.password")}</label>
              <Input id="auth-password" name="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>

            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
              {loading ? t("common.loading") : isLogin ? t("auth.login") : t("auth.signup")}
            </Button>

            {isLogin && (
              <p className="text-center text-sm">
                <button type="button" onClick={() => setIsForgot(true)} className="text-muted-foreground hover:text-accent transition-colors">
                  {t("auth.forgotPassword")}
                </button>
              </p>
            )}

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-accent font-medium hover:underline">
                {isLogin ? t("auth.signup") : t("auth.login")}
              </button>
            </p>
          </form>
        )}

        <Link to="/privacy" className="block text-center text-xs text-muted-foreground/60 hover:text-accent transition-colors mt-4">
          {lang === "sv" ? "Integritetspolicy" : "Privacy Policy"}
        </Link>
      </div>
    </div>
  );
}

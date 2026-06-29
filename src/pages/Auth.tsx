import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useProjects } from "@/hooks/useProjects";

const LAST_EMAIL_KEY = "lovable:last-login-email";
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

const isNetworkError = (message: string) => /load failed|failed to fetch|networkerror|timeout/i.test(message);

const getFriendlyAuthError = (raw: string, lang: "sv" | "en") => {
  if (isNetworkError(raw)) {
    return lang === "sv"
      ? "Nätverksfel – kontrollera anslutningen och försök igen."
      : "Network error – check your connection and try again.";
  }

  if (/invalid login credentials|invalid_credentials/i.test(raw)) {
    return lang === "sv"
      ? "Fel e-post eller lösenord. Klicka på Glömt lösenord om du vill skapa ett nytt."
      : "Wrong email or password. Use Forgot password to create a new one.";
  }

  if (/refresh token|session|jwt/i.test(raw)) {
    return lang === "sv"
      ? "Din gamla inloggning hade gått ut. Försök logga in igen."
      : "Your old login had expired. Please log in again.";
  }

  return raw || (lang === "sv" ? "Något gick fel. Försök igen." : "Something went wrong. Please try again.");
};

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
  const activeProjects = projects.filter((p) => !p.archived);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(LAST_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  useEffect(() => {
    if (activeProjects.length > 0 && !activeProjects.some((p) => p.id === selectedProject)) {
      setSelectedProject(activeProjects[0].id);
    }
  }, [activeProjects, selectedProject]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast({ title: "Fel", description: lang === "sv" ? "Skriv in din e-post först." : "Enter your email first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (!navigator.onLine) {
        throw new Error(lang === "sv" ? "Ingen internetanslutning. Kontrollera ditt nätverk och försök igen." : "No internet connection. Check your network and try again.");
      }
      window.localStorage.setItem(LAST_EMAIL_KEY, cleanEmail);
      const { error } = await withRetry(() => supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      }));
      if (error) throw error;
      toast({ title: t("auth.resetSent"), description: t("auth.resetSentDesc") });
      setIsForgot(false);
    } catch (err: any) {
      toast({ title: "Fel", description: getFriendlyAuthError(err?.message || String(err), lang), variant: "destructive" });
    } finally {
      setLoading(false);
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
        const cleanEmail = email.trim().toLowerCase();
        clearStoredAuthSession();
        await supabase.auth.signOut({ scope: "local" });
        const { error } = await withRetry(() => supabase.auth.signInWithPassword({ email: cleanEmail, password }));
        if (error) throw error;
        window.localStorage.setItem(LAST_EMAIL_KEY, cleanEmail);
      } else {
        const cleanEmail = email.trim().toLowerCase();
        clearStoredAuthSession();
        const { error } = await withRetry(() => supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { display_name: displayName, role, project_id: selectedProject || null },
          },
        }));
        if (error) throw error;
        window.localStorage.setItem(LAST_EMAIL_KEY, cleanEmail);
        toast({ title: t("auth.accountCreated"), description: t("auth.loggedIn") });
      }
    } catch (err: any) {
      const friendly = getFriendlyAuthError(err?.message || String(err), lang);
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
              <Input id="forgot-email" name="email" type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="din@email.se" required />
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
                  <Input id="signup-name" name="name" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("auth.name")} required />
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
                {activeProjects.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-card-foreground mb-1 block">{t("auth.selectProject")}</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                    >
                      {activeProjects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {!loadingProjects && activeProjects.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {lang === "sv" ? "Inga aktiva projekt finns just nu. Du kan ändå skapa konto." : "There are no active projects right now. You can still create an account."}
                  </p>
                )}
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="text-sm font-medium text-card-foreground mb-1 block">{t("auth.email")}</label>
              <Input id="auth-email" name="email" type="email" autoComplete={isLogin ? "username" : "email"} autoCapitalize="none" autoCorrect="off" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="din@email.se" required />
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

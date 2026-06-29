import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";

const isNetworkError = (message: string) => /load failed|failed to fetch|networkerror|timeout/i.test(message);

const getFriendlyResetError = (raw: string) => {
  if (isNetworkError(raw)) return "Nätverksfel – kontrollera anslutningen och försök igen.";
  if (/same as the old password/i.test(raw)) return "Välj ett nytt lösenord som inte är samma som det gamla.";
  if (/weak|pwned|password/i.test(raw)) return "Lösenordet är för svagt eller har läckt tidigare. Välj ett längre och säkrare lösenord.";
  if (/session|jwt|refresh token|auth session missing/i.test(raw)) return "Länken har gått ut eller är redan använd. Be om en ny återställningslänk.";
  return raw || "Något gick fel. Försök igen.";
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = 10000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("timeout")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export default function ResetPassword() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);

  useEffect(() => {
    let mounted = true;
    const hash = window.location.hash;
    const query = window.location.search;
    const params = new URLSearchParams(query);
    const hasRecoveryParams = hash.includes("type=recovery") || hash.includes("access_token=") || hash.includes("refresh_token=") || params.get("type") === "recovery" || !!params.get("code");

    if (hasRecoveryParams) {
      setIsRecovery(true);
      setCheckingRecovery(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (!!session?.user && window.location.pathname === "/reset-password")) {
        setIsRecovery(true);
        setCheckingRecovery(false);
      }
    });

    const checkRecovery = async () => {
      try {
        const code = params.get("code");
        if (code) {
          const { error } = await withTimeout(supabase.auth.exchangeCodeForSession(code));
          if (!mounted) return;
          if (!error) {
            setIsRecovery(true);
          }
        }

        const { data: { session } } = await withTimeout(supabase.auth.getSession());
        if (!mounted) return;
        if (hasRecoveryParams || session?.user) {
          setIsRecovery(true);
        }
      } catch (error) {
        console.error("Password recovery check failed:", error);
      } finally {
        if (mounted) setCheckingRecovery(false);
      }
    };

    void checkRecovery();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Lösenorden matchar inte", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Minst 6 tecken", variant: "destructive" });
      return;
    }
    if (!navigator.onLine) {
      toast({ title: "Fel", description: "Ingen internetanslutning. Kontrollera ditt nätverk och försök igen.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession());
      if (!session?.user) {
        throw new Error("Auth session missing");
      }

      const { error } = await withTimeout(supabase.auth.updateUser({ password }));
      if (error) throw error;
      toast({ title: t("auth.updatePassword"), description: "Lösenordet är uppdaterat." });
      navigate("/", { replace: true });
    } catch (error: any) {
      toast({ title: "Fel", description: getFriendlyResetError(error?.message || String(error)), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (checkingRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="text-center space-y-2">
            <Shield className="h-12 w-12 text-accent mx-auto" />
            <h1 className="text-xl font-bold text-foreground">{t("auth.resetPassword")}</h1>
            <p className="text-sm text-muted-foreground">
              Länken är ogiltig eller har gått ut. Be om en ny återställningslänk och försök igen.
            </p>
          </div>
          <Button type="button" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/auth") }>
            {t("auth.backToLogin")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-accent mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground">{t("auth.resetPassword")}</h1>
        </div>
        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div>
            <label htmlFor="new-password" className="text-sm font-medium text-card-foreground mb-1 block">{t("auth.newPassword")}</label>
            <Input id="new-password" name="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label htmlFor="confirm-password" className="text-sm font-medium text-card-foreground mb-1 block">{t("auth.confirmPassword")}</label>
            <Input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
            {loading ? t("common.loading") : t("auth.updatePassword")}
          </Button>
        </form>
      </div>
    </div>
  );
}

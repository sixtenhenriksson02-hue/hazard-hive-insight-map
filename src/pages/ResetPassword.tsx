import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";

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
    const hash = window.location.hash;
    const hasRecoveryParams = hash.includes("type=recovery") || hash.includes("access_token=") || hash.includes("refresh_token=");

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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (hasRecoveryParams || session?.user) {
        setIsRecovery(true);
      }
      setCheckingRecovery(false);
    });

    return () => subscription.unsubscribe();
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
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.updatePassword"), description: "OK!" });
      navigate("/");
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
            <label className="text-sm font-medium text-card-foreground mb-1 block">{t("auth.newPassword")}</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">{t("auth.confirmPassword")}</label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
            {loading ? t("common.loading") : t("auth.updatePassword")}
          </Button>
        </form>
      </div>
    </div>
  );
}

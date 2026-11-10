import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Shield, Globe, Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";
import { emailCallbackUrl, normalizeInviteCode } from "@/lib/projectInvite";
import ProjectQrEntry from "@/components/ProjectQrEntry";

const LAST_EMAIL_KEY = "lovable:last-login-email";

export default function Auth() {
  const { lang, setLang, t } = useLanguage();
  const [params] = useSearchParams();
  const invite = normalizeInviteCode(params.get("invite"));
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem(LAST_EMAIL_KEY) ?? ""; } catch { return ""; }
  });
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"link" | "password" | "forgot">("link");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const L = (sv: string, en: string) => lang === "sv" ? sv : en;

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (params.get("error") || hash.get("error")) {
      setError(lang === "sv" ? "Länken har gått ut eller redan använts. Be om en ny mejllänk." : "This link expired or was already used. Request a new email link.");
    }
    const code = params.get("code");
    if (code) {
      void supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) setError(lang === "sv" ? "Länken kunde inte öppnas. Be om en ny mejllänk." : "Could not open this link. Request a new email link.");
      });
    }
  }, [params, lang]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (!navigator.onLine) throw new Error("network");
      const result = mode === "password"
        ? await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        : mode === "forgot"
          ? await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: `${window.location.origin}/reset-password` })
          : await supabase.auth.signInWithOtp({ email: cleanEmail, options: { emailRedirectTo: emailCallbackUrl(window.location.origin, invite), shouldCreateUser: true } });
      if (result.error) throw result.error;
      try { localStorage.setItem(LAST_EMAIL_KEY, cleanEmail); } catch { /* Storage may be restricted. */ }
      if (mode !== "password") setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(/rate|429|seconds/i.test(message)
        ? L("Vänta en minut innan du ber om en ny länk.", "Wait a minute before requesting another link.")
        : /network|fetch|load failed/i.test(message)
          ? L("Kontrollera internetanslutningen och försök igen.", "Check your internet connection and try again.")
          : mode === "password"
            ? L("Kunde inte logga in. Kontrollera uppgifterna eller välj mejllänk.", "Could not sign in. Check your details or use an email link.")
            : L("Mejlet kunde inte skickas. Försök igen om en stund.", "Could not send the email. Try again shortly."));
    } finally { setLoading(false); }
  };

  return <main className="min-h-screen bg-background flex items-center justify-center px-5 py-8">
    <div className="w-full max-w-sm space-y-6">
      <header className="text-center">
        <Shield className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-foreground">{t("app.name")}</h1>
        <Button variant="ghost" size="sm" className="mt-2 text-muted-foreground" onClick={() => setLang(lang === "sv" ? "en" : "sv")}><Globe />{lang === "sv" ? "English" : "Svenska"}</Button>
      </header>
      <ProjectQrEntry />
      {invite && <p role="status" className="text-sm text-center text-muted-foreground">{L("Projekt valt – logga in för att fortsätta", "Project selected – sign in to continue")}</p>}
      <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{L("eller logga in", "or sign in")}<span className="h-px flex-1 bg-border" /></div>
      <Button type="button" variant="outline" className="google-sign-in w-full h-12" disabled={loading} onClick={async () => {
        setLoading(true);
        setError("");
        try {
          const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: emailCallbackUrl(window.location.origin, invite) });
          if (result.error) throw result.error;
        } catch {
          setError(L("Google-inloggningen kunde inte slutföras. Försök igen.", "Google sign-in could not be completed. Try again."));
        } finally { setLoading(false); }
      }}>
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="!size-[18px]"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
        {L("Fortsätt med Google", "Continue with Google")}
      </Button>
      {sent && error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {sent ? <section className="space-y-4 text-center" aria-live="polite">
        <CheckCircle2 className="h-10 w-10 mx-auto text-accent" />
        <h2 className="text-xl font-semibold">{L("Kolla din mejl", "Check your email")}</h2>
        <p className="text-sm text-muted-foreground break-words">{L("En länk har skickats till", "A link has been sent to")} <strong className="text-foreground">{email.trim()}</strong></p>
        <Button variant="outline" className="w-full" onClick={() => setSent(false)}><ArrowLeft />{L("Tillbaka", "Back")}</Button>
      </section> : <form onSubmit={submit} className="space-y-4">
        <h2 className="text-xl font-semibold">{mode === "forgot" ? L("Återställ lösenord", "Reset password") : L("Logga in", "Sign in")}</h2>
        {invite && <p className="text-sm font-medium text-muted-foreground">{L("Projektinbjudan", "Project invitation")}</p>}
        <div className="space-y-2">
          <label htmlFor="auth-email" className="text-sm font-medium">{L("E-postadress", "Email address")}</label>
          <Input id="auth-email" type="email" name="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" value={email} onChange={e => setEmail(e.target.value)} required placeholder="namn@exempel.se" className="h-12 text-base" />
        </div>
        {mode === "password" && <div className="space-y-2"><label htmlFor="auth-password" className="text-sm font-medium">{L("Lösenord", "Password")}</label><Input id="auth-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 text-base" /></div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90">{mode !== "password" && <Mail />}{loading ? L("Vänta…", "Please wait…") : mode === "password" ? L("Logga in", "Sign in") : mode === "forgot" ? L("Skicka återställningslänk", "Send reset link") : L("Skicka inloggningslänk", "Send sign-in link")}</Button>
        <div className="flex flex-col items-center gap-1">
          <Button type="button" variant="link" className="text-muted-foreground" onClick={() => { setMode(mode === "link" ? "password" : "link"); setError(""); }}>{mode === "link" ? L("Använd lösenord i stället", "Use a password instead") : L("Logga in med mejllänk", "Sign in with email link")}</Button>
          {mode === "password" && <Button type="button" variant="link" onClick={() => { setMode("forgot"); setError(""); }}>{L("Glömt lösenord?", "Forgot password?")}</Button>}
        </div>
      </form>}
      <Link to="/privacy" className="block text-center text-xs text-muted-foreground">{L("Integritetspolicy", "Privacy policy")}</Link>
    </div>
  </main>;
}

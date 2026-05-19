import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Lock, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "@/hooks/use-toast";

export default function Profile() {
  const navigate = useNavigate();
  const { user, displayName, role } = useAuth();
  const { t, lang } = useLanguage();

  const [name, setName] = useState(displayName);
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const L = (sv: string, en: string) => (lang === "sv" ? sv : en);

  const saveName = async () => {
    if (!user || !name.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim() })
      .eq("user_id", user.id);
    setSavingName(false);
    if (error) {
      toast({ title: L("Kunde inte spara", "Could not save"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: L("Namn uppdaterat", "Name updated") });
    }
  };

  const saveEmail = async () => {
    if (!email.trim() || email === user?.email) return;
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setSavingEmail(false);
    if (error) {
      toast({ title: L("Kunde inte ändra e-post", "Could not change email"), description: error.message, variant: "destructive" });
    } else {
      toast({
        title: L("Bekräfta via e-post", "Confirm via email"),
        description: L(
          "Vi har skickat bekräftelselänkar till både din gamla och nya e-post. Klicka i båda för att slutföra.",
          "We sent confirmation links to both your old and new email. Click both to complete."
        ),
      });
    }
  };

  const savePassword = async () => {
    if (password.length < 6) {
      toast({ title: L("Lösenord för kort", "Password too short"), description: L("Minst 6 tecken.", "At least 6 characters."), variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: L("Lösenorden matchar inte", "Passwords don't match"), variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) {
      toast({ title: L("Kunde inte byta lösenord", "Could not change password"), description: error.message, variant: "destructive" });
    } else {
      setPassword("");
      setConfirmPassword("");
      toast({ title: L("Lösenord uppdaterat", "Password updated") });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-primary text-primary-foreground shadow-lg">
        <div className="container flex h-14 items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 hover:border-accent/50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {L("Tillbaka", "Back")}
          </button>
          <h1 className="text-base font-bold">{L("Mitt konto", "My account")}</h1>
        </div>
      </header>

      <main className="container max-w-2xl py-6 md:py-10 space-y-6">
        {/* Account info */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">{L("Roll", "Role")}</p>
          <p className="text-sm font-semibold text-foreground">{role === "admin" ? t("auth.admin") : t("auth.worker")}</p>
        </div>

        {/* Display name */}
        <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">{L("Visningsnamn", "Display name")}</h2>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:border-accent outline-none"
            placeholder={L("Ditt namn", "Your name")}
          />
          <button
            onClick={saveName}
            disabled={savingName || !name.trim() || name === displayName}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <Save className="h-3.5 w-3.5" />
            {savingName ? L("Sparar...", "Saving...") : L("Spara namn", "Save name")}
          </button>
        </section>

        {/* Email */}
        <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">{L("E-postadress", "Email address")}</h2>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:border-accent outline-none"
            placeholder="namn@exempel.se"
          />
          <p className="text-[11px] text-muted-foreground">
            {L(
              "Du behöver bekräfta ändringen via länkar som skickas till både din gamla och nya e-post.",
              "You need to confirm the change via links sent to both your old and new email."
            )}
          </p>
          <button
            onClick={saveEmail}
            disabled={savingEmail || !email.trim() || email === user?.email}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <Save className="h-3.5 w-3.5" />
            {savingEmail ? L("Skickar...", "Sending...") : L("Uppdatera e-post", "Update email")}
          </button>
        </section>

        {/* Password */}
        <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">{L("Byt lösenord", "Change password")}</h2>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:border-accent outline-none"
            placeholder={L("Nytt lösenord (minst 6 tecken)", "New password (min 6 chars)")}
            autoComplete="new-password"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:border-accent outline-none"
            placeholder={L("Bekräfta lösenord", "Confirm password")}
            autoComplete="new-password"
          />
          <button
            onClick={savePassword}
            disabled={savingPassword || !password || !confirmPassword}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <Save className="h-3.5 w-3.5" />
            {savingPassword ? L("Sparar...", "Saving...") : L("Uppdatera lösenord", "Update password")}
          </button>
        </section>
      </main>
    </div>
  );
}

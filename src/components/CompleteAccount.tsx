import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CompleteAccount() {
  const { user, refreshAccount } = useAuth();
  const { lang } = useLanguage();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const L = (sv: string, en: string) => lang === "sv" ? sv : en;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !name.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const { data, error: saveError } = await supabase.from("profiles")
        .update({ display_name: name.trim() }).eq("user_id", user.id).select("user_id").single();
      if (saveError || !data) throw new Error("Profile update failed");
      await refreshAccount();
    } catch {
      setError(L("Namnet kunde inte sparas. Försök igen.", "Could not save your name. Try again."));
    } finally { setSaving(false); }
  };

  return <main className="min-h-screen flex items-center justify-center bg-background p-6">
    <form onSubmit={save} className="w-full max-w-sm space-y-5">
      <h1 className="text-2xl font-semibold">{L("Ditt konto", "Your account")}</h1>
      <label htmlFor="account-name" className="block text-sm font-medium">{L("För- och efternamn", "Full name")}</label>
      <Input id="account-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required maxLength={100} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving || !name.trim()} className="w-full">{saving ? L("Sparar…", "Saving…") : L("Fortsätt", "Continue")}</Button>
    </form>
  </main>;
}
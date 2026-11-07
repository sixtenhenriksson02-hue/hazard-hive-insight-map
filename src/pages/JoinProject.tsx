import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { normalizeInviteCode } from "@/lib/projectInvite";
import CompleteAccount from "@/components/CompleteAccount";

export default function JoinProject() {
  const { code: rawCode } = useParams();
  const code = normalizeInviteCode(rawCode);
  const { user, isLoading, displayName, refreshUserProjects, setActiveProjectId } = useAuth();
  const { lang } = useLanguage();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const running = useRef(false);
  const actions = useRef({ refreshUserProjects, setActiveProjectId });
  actions.current = { refreshUserProjects, setActiveProjectId };
  const L = (sv: string, en: string) => lang === "sv" ? sv : en;
  const needsName = !displayName.trim() || displayName === "Anonym";

  useEffect(() => {
    if (isLoading || !user || !code || needsName || running.current) return;
    running.current = true;
    let cancelled = false;
    const join = async () => {
      setError("");
      try {
        const { data: project, error: findError } = await supabase.from("projects")
          .select("id, archived").eq("invite_code", code).maybeSingle();
        if (findError) throw new Error(L("Projektet kunde inte hämtas. Försök igen.", "Could not load the project. Try again."));
        if (!project || project.archived) throw new Error(L("Projektlänken är ogiltig eller projektet är arkiverat.", "This link is invalid or the project is archived."));
        const { error: joinError } = await supabase.from("user_projects")
          .upsert({ user_id: user.id, project_id: project.id }, { onConflict: "user_id,project_id", ignoreDuplicates: true });
        if (joinError) throw new Error(L("Kunde inte öppna projektet. Försök igen.", "Could not open the project. Try again."));
        await actions.current.refreshUserProjects();
        if (!cancelled) {
          actions.current.setActiveProjectId(project.id);
          setDone(true);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : L("Försök igen.", "Try again."));
      } finally { running.current = false; }
    };
    void join();
    return () => { cancelled = true; };
  }, [user, isLoading, code, needsName, attempt, lang]);

  if (!code) return <main className="p-6 text-center"><h1>{L("Ogiltig projektlänk", "Invalid project link")}</h1><Button asChild variant="link"><Link to="/">{L("Till startsidan", "Go home")}</Link></Button></main>;
  if (!isLoading && !user) return <Navigate to={`/auth?invite=${code}`} replace />;
  if (!isLoading && user && needsName) return <CompleteAccount />;
  if (done) return <Navigate to="/" replace />;
  return <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4 bg-background">
    {error ? <><p role="alert" className="text-sm text-destructive text-center">{error}</p><Button onClick={() => setAttempt(a => a + 1)}>{L("Försök igen", "Try again")}</Button><Button asChild variant="link"><Link to="/">{L("Mina projekt", "My projects")}</Link></Button></> : <p role="status">{L("Öppnar projektet…", "Opening project…")}</p>}
  </main>;
}
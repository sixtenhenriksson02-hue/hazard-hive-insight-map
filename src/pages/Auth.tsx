import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"admin" | "worker">("worker");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, role },
          },
        });
        if (error) throw error;
        toast({ title: "Konto skapat!", description: "Du är nu inloggad." });
      }
    } catch (err: any) {
      toast({ title: "Fel", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-accent mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground">RiskRadar</h1>
          <p className="text-muted-foreground text-sm mt-1">Riskhantering & Förebyggande</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {isLogin ? "Logga in" : "Skapa konto"}
          </h2>

          {!isLogin && (
            <>
              <div>
                <label className="text-sm font-medium text-card-foreground mb-1 block">Namn</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ditt namn"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-card-foreground mb-1 block">Roll</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("worker")}
                    className={`flex-1 text-sm font-medium px-3 py-2 rounded-md border transition-colors ${
                      role === "worker"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-accent"
                    }`}
                  >
                    Arbetare
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex-1 text-sm font-medium px-3 py-2 rounded-md border transition-colors ${
                      role === "admin"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-accent"
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">E-post</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@email.se"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">Lösenord</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
            {loading ? "Laddar..." : isLogin ? "Logga in" : "Skapa konto"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Har du inget konto?" : "Har du redan ett konto?"}{" "}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-accent font-medium hover:underline">
              {isLogin ? "Skapa konto" : "Logga in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

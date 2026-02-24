import { Shield, Bell, Menu, X, LogOut, Eye, Globe, FolderPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

interface AppLayoutProps {
  children: React.ReactNode;
  onManageProjects?: () => void;
}

export default function AppLayout({ children, onManageProjects }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { role, viewAs, setViewAs, displayName, projectName, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-accent" />
            <div>
              <h1 className="text-lg font-bold leading-tight">{t("app.name")}</h1>
              <p className="text-xs text-primary-foreground/70">{projectName ?? t("app.tagline")}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 text-sm">
            <button
              onClick={() => setLang(lang === "sv" ? "en" : "sv")}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border border-primary-foreground/20 hover:border-accent transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === "sv" ? "EN" : "SV"}
            </button>
            {role === "admin" && (
              <>
                <button
                  onClick={() => setViewAs(viewAs === "admin" ? "worker" : "admin")}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary-foreground/20 hover:border-accent transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {viewAs === "admin" ? t("header.viewAsWorker") : t("header.viewAsAdmin")}
                </button>
                {onManageProjects && (
                  <button
                    onClick={onManageProjects}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary-foreground/20 hover:border-accent transition-colors"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                    {t("project.manage")}
                  </button>
                )}
              </>
            )}
            <span className="text-primary-foreground/70 text-xs">
              {displayName} · <span className="font-semibold text-accent">{viewAs === "admin" ? t("auth.admin") : t("auth.worker")}</span>
            </span>
            <button onClick={signOut} className="text-primary-foreground/70 hover:text-accent transition-colors" title={t("auth.logout")}>
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-primary-foreground/10 p-4 space-y-3">
            <p className="text-sm text-primary-foreground/70">
              {displayName} · <span className="font-semibold text-accent">{viewAs === "admin" ? t("auth.admin") : t("auth.worker")}</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setLang(lang === "sv" ? "en" : "sv")} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-primary-foreground/20">
                <Globe className="h-3.5 w-3.5" />{lang === "sv" ? "English" : "Svenska"}
              </button>
              {role === "admin" && (
                <button onClick={() => setViewAs(viewAs === "admin" ? "worker" : "admin")} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary-foreground/20">
                  <Eye className="h-3.5 w-3.5" />{viewAs === "admin" ? t("header.viewAsWorker") : t("header.viewAsAdmin")}
                </button>
              )}
              {role === "admin" && onManageProjects && (
                <button onClick={onManageProjects} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary-foreground/20">
                  <FolderPlus className="h-3.5 w-3.5" />{t("project.manage")}
                </button>
              )}
            </div>
            <button onClick={signOut} className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <LogOut className="h-4 w-4" /> {t("auth.logout")}
            </button>
          </div>
        )}
      </header>

      <main className="container py-6 md:py-8">{children}</main>
    </div>
  );
}

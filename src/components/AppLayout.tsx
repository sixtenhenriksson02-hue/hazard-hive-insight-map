import { Shield, Menu, X, LogOut, Eye, Globe, FolderPlus, ChevronDown } from "lucide-react";
import EmergencyGuide from "@/components/EmergencyGuide";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useProjects } from "@/hooks/useProjects";
import NotificationBell from "@/components/NotificationBell";

interface AppLayoutProps {
  children: React.ReactNode;
  onManageProjects?: () => void;
  onJoinProject?: () => void;
  onSelectReport?: (reportId: string) => void;
}

export default function AppLayout({ children, onManageProjects, onJoinProject, onSelectReport }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { role, viewAs, setViewAs, displayName, projectName, signOut, activeProjectId, setActiveProjectId, userProjects } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { projects } = useProjects();
  const isActualAdmin = role === "admin";
  const showAdminUI = viewAs === "admin";

  // Admin sees all active projects; workers see their enrolled (non-archived) projects
  const availableProjects = isActualAdmin
    ? projects.filter(p => !(p as any).archived)
    : userProjects.map(up => ({ id: up.project_id, name: up.project_name }));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-primary text-primary-foreground shadow-lg">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-accent/15">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight">{t("app.name")}</h1>
              <p className="text-[11px] text-primary-foreground/50 leading-none">{projectName ?? t("app.tagline")}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm">
            {/* Project selector */}
            {availableProjects.length > 0 && (
              <div className="relative">
                <select
                  value={activeProjectId ?? ""}
                  onChange={(e) => setActiveProjectId(e.target.value || null)}
                  className="appearance-none text-xs px-3 py-1.5 pr-7 rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground hover:border-accent/50 transition-colors cursor-pointer font-medium"
                >
                  <option value="" disabled>{t("project.selectProject")}</option>
                  {availableProjects.map((p) => (
                    <option key={p.id} value={p.id} className="text-foreground bg-background">{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
              </div>
            )}

            <div className="h-4 w-px bg-primary-foreground/15 mx-1" />

            <button
              onClick={() => setLang(lang === "sv" ? "en" : "sv")}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 hover:border-accent/50 transition-colors"
            >
              {lang === "sv" ? "EN" : "SV"}
            </button>

            {isActualAdmin && (
              <button
                onClick={() => setViewAs(viewAs === "admin" ? "worker" : "admin")}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 hover:border-accent/50 transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                {viewAs === "admin" ? t("header.viewAsWorker") : t("header.viewAsAdmin")}
              </button>
            )}

            {showAdminUI && onManageProjects && (
              <button
                onClick={onManageProjects}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                {t("project.manage")}
              </button>
            )}

            {!showAdminUI && onJoinProject && (
              <button
                onClick={onJoinProject}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                {t("project.joinWithCode")}
              </button>
            )}

            <div className="h-4 w-px bg-primary-foreground/15 mx-1" />

            <span className="text-primary-foreground/60 text-xs">
              {displayName} · <span className="font-semibold text-accent">{showAdminUI ? t("auth.admin") : t("auth.worker")}</span>
            </span>
            {showAdminUI && <NotificationBell onSelectReport={onSelectReport} />}
            <button onClick={signOut} className="text-primary-foreground/40 hover:text-accent transition-colors" title={t("auth.logout")}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-primary-foreground/10 p-4 space-y-3">
            <p className="text-sm text-primary-foreground/70">
              {displayName} · <span className="font-semibold text-accent">{showAdminUI ? t("auth.admin") : t("auth.worker")}</span>
            </p>
            {availableProjects.length > 0 && (
              <select
                value={activeProjectId ?? ""}
                onChange={(e) => setActiveProjectId(e.target.value || null)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 text-primary-foreground"
              >
                <option value="" disabled>{t("project.selectProject")}</option>
                {availableProjects.map((p) => (
                  <option key={p.id} value={p.id} className="text-foreground bg-background">{p.name}</option>
                ))}
              </select>
            )}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setLang(lang === "sv" ? "en" : "sv")} className="text-xs px-3 py-1.5 rounded-lg border border-primary-foreground/15 bg-primary-foreground/5">
                {lang === "sv" ? "English" : "Svenska"}
              </button>
              {isActualAdmin && (
                <button onClick={() => setViewAs(viewAs === "admin" ? "worker" : "admin")} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary-foreground/15 bg-primary-foreground/5">
                  <Eye className="h-3.5 w-3.5" />{viewAs === "admin" ? t("header.viewAsWorker") : t("header.viewAsAdmin")}
                </button>
              )}
              {showAdminUI && onManageProjects && (
                <button onClick={onManageProjects} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-accent/30 bg-accent/10 text-accent">
                  <FolderPlus className="h-3.5 w-3.5" />{t("project.manage")}
                </button>
              )}
              {!showAdminUI && onJoinProject && (
                <button onClick={onJoinProject} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-accent/30 bg-accent/10 text-accent">
                  <FolderPlus className="h-3.5 w-3.5" />{t("project.joinWithCode")}
                </button>
              )}
            </div>
            <button onClick={signOut} className="flex items-center gap-2 text-sm text-primary-foreground/50">
              <LogOut className="h-4 w-4" /> {t("auth.logout")}
            </button>
          </div>
        )}
      </header>

      <main className="container py-6 md:py-8">{children}</main>
    </div>
  );
}

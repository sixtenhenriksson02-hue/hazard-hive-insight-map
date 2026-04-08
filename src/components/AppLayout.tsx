import { Shield, Menu, X, LogOut, Eye, Globe, FolderPlus, ChevronDown, User, FileText } from "lucide-react";
import EmergencyGuide from "@/components/EmergencyGuide";
import { useState, useRef, useEffect } from "react";
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, viewAs, setViewAs, displayName, projectName, signOut, activeProjectId, setActiveProjectId, userProjects } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { projects } = useProjects();
  const isActualAdmin = role === "admin";
  const showAdminUI = viewAs === "admin";

  // Admin sees all active projects; workers see their enrolled (non-archived) projects
  const availableProjects = isActualAdmin
    ? projects.filter(p => !(p as any).archived)
    : userProjects.map(up => ({ id: up.project_id, name: up.project_name }));

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

            <EmergencyGuide />

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

            {showAdminUI && <NotificationBell onSelectReport={onSelectReport} />}

            {/* User menu dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 hover:border-accent/50 transition-colors text-primary-foreground/70 hover:text-primary-foreground"
              >
                <User className="h-3.5 w-3.5" />
                {displayName}
                <ChevronDown className={`h-3 w-3 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card text-card-foreground shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/30">
                    <p className="text-sm font-semibold">{t("account.myAccount")}</p>
                  </div>
                  <div className="p-4 space-y-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">{t("account.username")}</span>
                      <p className="font-medium text-foreground">{displayName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("account.email")}</span>
                      <p className="font-medium text-foreground">{user?.email ?? "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("account.role")}</span>
                      <p className="font-medium text-foreground">{showAdminUI ? t("auth.admin") : t("auth.worker")}</p>
                    </div>
                  </div>
                  <div className="border-t border-border">
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate("/privacy"); }}
                      className="flex items-center gap-2 w-full px-4 py-3 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {t("account.privacyPolicy")}
                    </button>
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut(); }}
                      className="flex items-center gap-2 w-full px-4 py-3 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {t("auth.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-primary-foreground/10 p-4 space-y-3">
            {/* Account info in mobile */}
            <div className="bg-primary-foreground/5 rounded-lg p-3 space-y-1.5 text-xs">
              <p className="text-primary-foreground/50">{t("account.username")}: <span className="text-primary-foreground font-medium">{displayName}</span></p>
              <p className="text-primary-foreground/50">{t("account.email")}: <span className="text-primary-foreground font-medium">{user?.email ?? "—"}</span></p>
              <p className="text-primary-foreground/50">{t("account.role")}: <span className="font-semibold text-accent">{showAdminUI ? t("auth.admin") : t("auth.worker")}</span></p>
            </div>
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
            <div className="flex gap-2 flex-wrap items-center">
              <EmergencyGuide />
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
            <button onClick={() => navigate("/privacy")} className="flex items-center gap-2 text-xs text-primary-foreground/50">
              <FileText className="h-3.5 w-3.5" /> {t("account.privacyPolicy")}
            </button>
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

import { useState, useMemo, lazy, Suspense } from "react";
import AppLayout from "@/components/AppLayout";
import ReportForm from "@/components/ReportForm";
import ReportsList from "@/components/ReportsList";
import ReportDetail from "@/components/ReportDetail";
import HelpGuide from "@/components/HelpGuide";
import ProjectManager from "@/components/ProjectManager";
import WorkerProjectManager from "@/components/WorkerProjectManager";
import { useReports, RiskReport, ReportStatus, SortOption } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Plus, List, Grid3X3, BarChart3, FolderPlus, MapPin, FileText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy load heavy tab components
const RiskMatrix = lazy(() => import("@/components/RiskMatrix"));
const AdminStats = lazy(() => import("@/components/AdminStats"));
const SitePlanViewer = lazy(() => import("@/components/SitePlanViewer"));
const ReportGenerator = lazy(() => import("@/components/ReportGenerator"));
const DocumentsView = lazy(() => import("@/components/DocumentsView"));
const ProjectRules = lazy(() => import("@/components/ProjectRules"));

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground">Laddar...</p>
      </div>
    </div>
  );
}

const Index = () => {
  const { reports, loading, addReport, updateReport, reassessReport, sortReports } = useReports();
  const { viewAs, role, activeProjectId } = useAuth();
  const { t } = useLanguage();
  const isAdmin = viewAs === "admin";

  const [showForm, setShowForm] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showWorkerProjects, setShowWorkerProjects] = useState(false);
  const [activeTab, setActiveTab] = useState<"reports" | "matrix" | "stats" | "documents" | "rules">("reports");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedReport, setSelectedReport] = useState<RiskReport | null>(null);

  const visibleReports = useMemo(() => {
    let filtered = reports.filter((r) => r.status !== "resolved");
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    return sortReports(filtered, sortBy);
  }, [reports, statusFilter, sortBy, sortReports]);

  const handleUpdateStatus = (id: string, status: ReportStatus) => {
    updateReport(id, { status });
  };

  return (
    <AppLayout onManageProjects={() => setShowProjects(true)} onJoinProject={() => setShowWorkerProjects(true)} onSelectReport={(reportId) => {
        const report = reports.find(r => r.id === reportId);
        if (report) {
          setSelectedReport(report);
        }
      }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{t("dashboard.welcome")}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{t("dashboard.subtitle")}</p>
        </div>
        <HelpGuide isAdmin={isAdmin} />
      </div>

      {/* APD Plan on dashboard - only show when a project is selected */}
      {activeProjectId && (
        <div className="mt-6">
          <Suspense fallback={<TabLoader />}>
            <SitePlanViewer reports={reports} />
          </Suspense>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 mb-4">
        <div className="flex gap-2 flex-wrap">
          <Button variant={activeTab === "reports" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setActiveTab("reports")}>
            <List className="h-3.5 w-3.5 mr-1.5" />{t("dashboard.reports")}
          </Button>
          <Button variant={activeTab === "matrix" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setActiveTab("matrix")}>
            <Grid3X3 className="h-3.5 w-3.5 mr-1.5" />{t("dashboard.matrix")}
          </Button>
          {isAdmin && (
            <>
              <Button variant={activeTab === "stats" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setActiveTab("stats")}>
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />{t("dashboard.stats")}
              </Button>
              <Suspense fallback={null}>
                <ReportGenerator reports={reports} />
              </Suspense>
            </>
          )}
          <Button variant={activeTab === "documents" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setActiveTab("documents")}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />{t("nav.documents")}
          </Button>
          <Button variant={activeTab === "rules" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setActiveTab("rules")}>
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />{t("rules.title")}
          </Button>
        </div>

        <div className="flex gap-2">
          {activeTab === "reports" && (
            <select
              className="text-xs border border-border rounded-md px-2 py-1.5 bg-card text-card-foreground"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="newest">{t("sort.newest")}</option>
              <option value="oldest">{t("sort.oldest")}</option>
              <option value="severity-high">{t("sort.severityHigh")}</option>
              <option value="severity-low">{t("sort.severityLow")}</option>
            </select>
          )}
          <Button onClick={() => setShowForm(!showForm)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-1.5" />{t("dashboard.newReport")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {activeTab === "reports" && (
            <>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                        <div className="h-5 w-16 bg-muted rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ReportsList
                  reports={visibleReports}
                  isAdmin={isAdmin}
                  onUpdateStatus={isAdmin ? handleUpdateStatus : undefined}
                  onSelect={setSelectedReport}
                />
              )}
            </>
          )}
          <Suspense fallback={<TabLoader />}>
            {activeTab === "matrix" && <RiskMatrix />}
            {activeTab === "stats" && isAdmin && <AdminStats reports={reports} />}
            {activeTab === "documents" && <DocumentsView />}
            {activeTab === "rules" && <ProjectRules />}
          </Suspense>
        </div>

        {showForm && (
          <div className="lg:col-span-1">
            <ReportForm onSubmit={addReport} onClose={() => setShowForm(false)} />
          </div>
        )}
      </div>

      <ReportDetail
        report={selectedReport}
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onUpdate={updateReport}
        onReassess={reassessReport}
      />

      <ProjectManager open={showProjects} onClose={() => setShowProjects(false)} />
      <WorkerProjectManager open={showWorkerProjects} onClose={() => setShowWorkerProjects(false)} />
    </AppLayout>
  );
};

export default Index;

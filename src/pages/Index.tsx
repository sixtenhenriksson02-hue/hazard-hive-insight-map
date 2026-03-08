import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import ReportForm from "@/components/ReportForm";
import ReportsList from "@/components/ReportsList";
import ReportDetail from "@/components/ReportDetail";
import RiskMatrix from "@/components/RiskMatrix";
import AdminStats from "@/components/AdminStats";
import ProjectManager from "@/components/ProjectManager";
import WorkerProjectManager from "@/components/WorkerProjectManager";
import SitePlanViewer from "@/components/SitePlanViewer";
import ReportGenerator from "@/components/ReportGenerator";
import { useReports, RiskReport, ReportStatus, SortOption } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Plus, List, Grid3X3, BarChart3, FolderPlus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { reports, loading, addReport, updateReport, reassessReport, sortReports } = useReports();
  const { viewAs, role } = useAuth();
  const { t } = useLanguage();
  const isAdmin = viewAs === "admin";

  const [showForm, setShowForm] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showWorkerProjects, setShowWorkerProjects] = useState(false);
  const [activeTab, setActiveTab] = useState<"reports" | "matrix" | "stats">("reports");
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
    <AppLayout onManageProjects={() => setShowProjects(true)} onJoinProject={() => setShowWorkerProjects(true)}>
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{t("dashboard.welcome")}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">{t("dashboard.subtitle")}</p>
      </div>

      {/* Removed StatsCards */}

      {/* APD Plan on dashboard */}
      <div className="mt-6">
        <SitePlanViewer reports={reports} />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 mb-4">
        <div className="flex gap-2">
          <Button variant={activeTab === "reports" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("reports")}>
            <List className="h-4 w-4 mr-1.5" />{t("dashboard.reports")}
          </Button>
          <Button variant={activeTab === "matrix" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("matrix")}>
            <Grid3X3 className="h-4 w-4 mr-1.5" />{t("dashboard.matrix")}
          </Button>
          {isAdmin && (
            <>
              <Button variant={activeTab === "stats" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("stats")}>
                <BarChart3 className="h-4 w-4 mr-1.5" />{t("dashboard.stats")}
              </Button>
              <MonthlyReport reports={reports} />
            </>
          )}
        </div>

        <div className="flex gap-2">
          {activeTab === "reports" && (
            <select
              className="text-xs border border-border rounded-md px-2 py-1.5 bg-card text-card-foreground"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="newest">{t("sort.newest")}</option>
              <option value="severity">{t("sort.severity")}</option>
              <option value="oldest-open">{t("sort.oldestOpen")}</option>
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
                <div className="text-center py-12 text-muted-foreground">{t("dashboard.loadingReports")}</div>
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
          {activeTab === "matrix" && <RiskMatrix />}
          {activeTab === "stats" && isAdmin && <AdminStats reports={reports} />}
        </div>

        {showForm && (
          <div className="lg:col-span-1">
            <ReportForm onSubmit={addReport} />
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

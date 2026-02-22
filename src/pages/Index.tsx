import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import StatsCards from "@/components/StatsCards";
import ReportForm from "@/components/ReportForm";
import ReportsList from "@/components/ReportsList";
import ReportDetail from "@/components/ReportDetail";
import RiskMatrix from "@/components/RiskMatrix";
import { useReports, RiskReport, ReportStatus, SortOption } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { Plus, List, Grid3X3, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { reports, loading, addReport, updateReport, sortReports } = useReports();
  const { viewAs } = useAuth();
  const isAdmin = viewAs === "admin";

  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"reports" | "matrix">("reports");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedReport, setSelectedReport] = useState<RiskReport | null>(null);

  const visibleReports = useMemo(() => {
    let filtered = reports;

    // Workers don't see resolved reports
    if (!isAdmin) {
      filtered = filtered.filter((r) => r.status !== "resolved");
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    return sortReports(filtered, sortBy);
  }, [reports, isAdmin, statusFilter, sortBy, sortReports]);

  const handleUpdateStatus = (id: string, status: ReportStatus) => {
    updateReport(id, { status });
  };

  // For stats, admins see all, workers see non-resolved
  const statsReports = isAdmin ? reports : reports.filter((r) => r.status !== "resolved");

  return (
    <AppLayout>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Välkommen tillbaka 👋</h2>
        <p className="text-muted-foreground mt-1">Rapportera, spåra och åtgärda risker på arbetsplatsen.</p>
      </div>

      <StatsCards reports={statsReports} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8 mb-4">
        <div className="flex gap-2">
          <Button variant={activeTab === "reports" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("reports")}>
            <List className="h-4 w-4 mr-1.5" />Rapporter
          </Button>
          <Button variant={activeTab === "matrix" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("matrix")}>
            <Grid3X3 className="h-4 w-4 mr-1.5" />Riskmatris
          </Button>
        </div>

        <div className="flex gap-2">
          {activeTab === "reports" && (
            <select
              className="text-xs border border-border rounded-md px-2 py-1.5 bg-card text-card-foreground"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="newest">Nyast först</option>
              <option value="severity">Allvarligast</option>
              <option value="oldest-open">Längst kvar</option>
            </select>
          )}
          <Button onClick={() => setShowForm(!showForm)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-1.5" />Ny rapport
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {activeTab === "reports" && (
            <>
              <div className="flex gap-2 mb-4 flex-wrap">
                {(["all", "open", "in-progress", ...(isAdmin ? ["resolved" as const] : [])] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                      statusFilter === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-accent"
                    }`}
                  >
                    {s === "all" ? "Alla" : s === "open" ? "Öppna" : s === "in-progress" ? "Pågår" : "Åtgärdade"}
                  </button>
                ))}
              </div>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Laddar rapporter...</div>
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
      />
    </AppLayout>
  );
};

export default Index;

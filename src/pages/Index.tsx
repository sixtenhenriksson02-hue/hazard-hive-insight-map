import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import StatsCards from "@/components/StatsCards";
import ReportForm from "@/components/ReportForm";
import ReportsList from "@/components/ReportsList";
import RiskMatrix from "@/components/RiskMatrix";
import { useReports } from "@/hooks/useReports";
import { ReportStatus } from "@/types/risk";
import { Plus, List, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { reports, addReport, updateStatus, userRole } = useReports();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"reports" | "matrix">("reports");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");

  const filteredReports =
    statusFilter === "all" ? reports : reports.filter((r) => r.status === statusFilter);

  return (
    <AppLayout userRole={userRole}>
      {/* Hero section */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Välkommen tillbaka 👋
        </h2>
        <p className="text-muted-foreground mt-1">
          Rapportera, spåra och åtgärda risker på arbetsplatsen.
        </p>
      </div>

      {/* Stats */}
      <StatsCards reports={reports} />

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8 mb-4">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "reports" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("reports")}
          >
            <List className="h-4 w-4 mr-1.5" />
            Rapporter
          </Button>
          <Button
            variant={activeTab === "matrix" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("matrix")}
          >
            <Grid3X3 className="h-4 w-4 mr-1.5" />
            Riskmatris
          </Button>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Ny rapport
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {activeTab === "reports" && (
            <>
              {/* Filter pills */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {(["all", "open", "in-progress", "resolved"] as const).map((s) => (
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
              <ReportsList
                reports={filteredReports}
                isAdmin={userRole === "admin"}
                onUpdateStatus={userRole === "admin" ? updateStatus : undefined}
              />
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
    </AppLayout>
  );
};

export default Index;

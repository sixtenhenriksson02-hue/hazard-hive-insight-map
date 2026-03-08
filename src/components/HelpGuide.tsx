import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronRight, Shield, FileText, MapPin, Users, AlertTriangle, BarChart3, Languages, FolderPlus } from "lucide-react";

interface HelpGuideProps {
  isAdmin: boolean;
}

interface Step {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
}

export default function HelpGuide({ isAdmin }: HelpGuideProps) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const adminSteps: Step[] = [
    {
      icon: <FolderPlus className="h-5 w-5 text-accent" />,
      titleKey: "help.admin.createProject",
      descKey: "help.admin.createProjectDesc",
    },
    {
      icon: <Users className="h-5 w-5 text-accent" />,
      titleKey: "help.admin.inviteWorkers",
      descKey: "help.admin.inviteWorkersDesc",
    },
    {
      icon: <MapPin className="h-5 w-5 text-accent" />,
      titleKey: "help.admin.uploadPlan",
      descKey: "help.admin.uploadPlanDesc",
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-accent" />,
      titleKey: "help.admin.manageReports",
      descKey: "help.admin.manageReportsDesc",
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-accent" />,
      titleKey: "help.admin.statistics",
      descKey: "help.admin.statisticsDesc",
    },
    {
      icon: <FileText className="h-5 w-5 text-accent" />,
      titleKey: "help.admin.generateReports",
      descKey: "help.admin.generateReportsDesc",
    },
    {
      icon: <Languages className="h-5 w-5 text-accent" />,
      titleKey: "help.admin.translate",
      descKey: "help.admin.translateDesc",
    },
  ];

  const workerSteps: Step[] = [
    {
      icon: <FolderPlus className="h-5 w-5 text-accent" />,
      titleKey: "help.worker.joinProject",
      descKey: "help.worker.joinProjectDesc",
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-accent" />,
      titleKey: "help.worker.createReport",
      descKey: "help.worker.createReportDesc",
    },
    {
      icon: <MapPin className="h-5 w-5 text-accent" />,
      titleKey: "help.worker.markOnPlan",
      descKey: "help.worker.markOnPlanDesc",
    },
    {
      icon: <FileText className="h-5 w-5 text-accent" />,
      titleKey: "help.worker.viewReports",
      descKey: "help.worker.viewReportsDesc",
    },
    {
      icon: <Languages className="h-5 w-5 text-accent" />,
      titleKey: "help.worker.translate",
      descKey: "help.worker.translateDesc",
    },
  ];

  const steps = isAdmin ? adminSteps : workerSteps;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <HelpCircle className="h-4 w-4" />
        {t("help.button")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              {t(isAdmin ? "help.adminTitle" : "help.workerTitle")}
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground mb-4">
            {t(isAdmin ? "help.adminIntro" : "help.workerIntro")}
          </p>

          <div className="space-y-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-card-foreground">
                    <span className="text-accent mr-1.5">{i + 1}.</span>
                    {t(step.titleKey)}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t(step.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

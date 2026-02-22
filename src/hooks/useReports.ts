import { useState } from "react";
import { RiskReport, RiskLevel, ReportStatus } from "@/types/risk";

// Mock data for demo
const mockReports: RiskReport[] = [
  {
    id: "1",
    title: "Hal risk vid lastkajen",
    description: "Oljespill vid lastkajen som skapar halkrisk. Området är ofta trafikerat av truckar.",
    location: "Lastkajen - Sektion B",
    category: "Halkrisk",
    riskLevel: "high",
    status: "open",
    reportedBy: "Anna Svensson",
    createdAt: new Date("2026-02-20"),
    imageUrl: undefined,
  },
  {
    id: "2",
    title: "Bristfällig belysning i lager",
    description: "Flera lampor trasiga i lageravdelning C. Svårt att se pallställ och hinder.",
    location: "Lager C - Gång 4",
    category: "Belysning",
    riskLevel: "medium",
    status: "in-progress",
    reportedBy: "Erik Johansson",
    createdAt: new Date("2026-02-19"),
  },
  {
    id: "3",
    title: "Lösa kablar vid arbetsstation",
    description: "Elkablar ligger löst på golvet vid arbetsstation 7. Snubbelrisk.",
    location: "Produktion - Station 7",
    category: "Snubbelrisk",
    riskLevel: "medium",
    status: "open",
    reportedBy: "Maria Lindgren",
    createdAt: new Date("2026-02-18"),
  },
  {
    id: "4",
    title: "Skyddsutrustning saknas",
    description: "Hörselskydd saknas vid pressmaskin. Bullernivån överskrider gränsvärden.",
    location: "Produktion - Pressavdelningen",
    category: "Skyddsutrustning",
    riskLevel: "critical",
    status: "open",
    reportedBy: "Lars Nilsson",
    createdAt: new Date("2026-02-21"),
  },
  {
    id: "5",
    title: "Brandsläckare utgången",
    description: "Brandsläckare vid nödutgång 3 har passerat kontrolldatum.",
    location: "Korridor - Nödutgång 3",
    category: "Brandsäkerhet",
    riskLevel: "high",
    status: "resolved",
    reportedBy: "Sofia Berg",
    createdAt: new Date("2026-02-15"),
    resolvedAt: new Date("2026-02-17"),
  },
];

export function useReports() {
  const [reports, setReports] = useState<RiskReport[]>(mockReports);
  const [userRole] = useState<"admin" | "worker">("admin");

  const addReport = (report: Omit<RiskReport, "id" | "createdAt" | "riskLevel">) => {
    const newReport: RiskReport = {
      ...report,
      id: String(Date.now()),
      createdAt: new Date(),
      riskLevel: assessRisk(report.description, report.category),
    };
    setReports((prev) => [newReport, ...prev]);
    return newReport;
  };

  const updateStatus = (id: string, status: ReportStatus) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, resolvedAt: status === "resolved" ? new Date() : undefined }
          : r
      )
    );
  };

  return { reports, addReport, updateStatus, userRole };
}

function assessRisk(description: string, category: string): RiskLevel {
  const text = `${description} ${category}`.toLowerCase();
  if (text.includes("brand") || text.includes("explosion") || text.includes("skyddsutrustning") || text.includes("kemikalie"))
    return "critical";
  if (text.includes("hal") || text.includes("fall") || text.includes("tung") || text.includes("utgången"))
    return "high";
  if (text.includes("belysning") || text.includes("kabel") || text.includes("snubbel") || text.includes("buller"))
    return "medium";
  return "low";
}

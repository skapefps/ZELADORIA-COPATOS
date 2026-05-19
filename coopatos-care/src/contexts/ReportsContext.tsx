import React, { createContext, useContext, useState, ReactNode } from "react";
import { mockReports, Report, Status } from "@/data/mockData";

interface ReportsContextType {
  reports: Report[];
  addReport: (report: Omit<Report, "id" | "status" | "createdAt" | "updatedAt">) => void;
  updateStatus: (id: string, status: Status) => void;
}

const ReportsContext = createContext<ReportsContextType | null>(null);

export const useReports = () => {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error("useReports must be within ReportsProvider");
  return ctx;
};

export const ReportsProvider = ({ children }: { children: ReactNode }) => {
  const [reports, setReports] = useState<Report[]>(mockReports);

  const addReport = (data: Omit<Report, "id" | "status" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newReport: Report = {
      ...data,
      id: `RPT-${String(reports.length + 1).padStart(3, "0")}`,
      status: "Aberto",
      createdAt: now,
      updatedAt: now,
    };
    setReports((prev) => [newReport, ...prev]);
  };

  const updateStatus = (id: string, status: Status) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
      )
    );
  };

  return (
    <ReportsContext.Provider value={{ reports, addReport, updateStatus }}>
      {children}
    </ReportsContext.Provider>
  );
};

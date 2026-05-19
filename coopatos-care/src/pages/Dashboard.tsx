import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useReports } from "@/contexts/ReportsContext";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, STATUSES, CATEGORY_WEIGHTS, Category, Status, Report, getSortedReports } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Filter, MapPin, List, BarChart3, Droplets, Zap, Mountain, Shield,
  TreePine, HelpCircle, ChevronDown, X, Map as MapIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ReportDetail from "@/components/ReportDetail";
import DashboardMaps from "@/components/DashboardMaps";

const categoryIcons: Record<Category, React.ReactNode> = {
  "Hídrico": <Droplets className="w-4 h-4" />,
  "Elétrico": <Zap className="w-4 h-4" />,
  "Erosão": <Mountain className="w-4 h-4" />,
  "Segurança": <Shield className="w-4 h-4" />,
  "Vegetação": <TreePine className="w-4 h-4" />,
  "Outro": <HelpCircle className="w-4 h-4" />,
};

const statusColors: Record<Status, string> = {
  "Aberto": "bg-destructive/10 text-destructive border-destructive/20",
  "Em Andamento": "bg-warning/10 text-warning border-warning/20",
  "Aguardando Peça": "bg-info/10 text-info border-info/20",
  "Concluído": "bg-success/10 text-success border-success/20",
};

const priorityBarColor = (weight: number) => {
  if (weight >= 5) return "bg-destructive";
  if (weight >= 4) return "bg-warning";
  if (weight >= 3) return "bg-warning/70";
  if (weight >= 2) return "bg-info";
  return "bg-success";
};

const Dashboard = () => {
  const { logout } = useAuth();
  const { reports } = useReports();
  const navigate = useNavigate();

  const [view, setView] = useState<"list" | "maps">("list");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const filtered = useMemo(() => {
    let result = reports;
    if (filterCategory !== "all") result = result.filter((r) => r.category === filterCategory);
    if (filterStatus !== "all") result = result.filter((r) => r.status === filterStatus);
    if (filterLocation.trim()) result = result.filter((r) =>
      r.referencePoint.toLowerCase().includes(filterLocation.toLowerCase())
    );
    return getSortedReports(result);
  }, [reports, filterCategory, filterStatus, filterLocation]);

  const stats = useMemo(() => ({
    total: reports.length,
    open: reports.filter((r) => r.status === "Aberto").length,
    inProgress: reports.filter((r) => r.status === "Em Andamento").length,
    done: reports.filter((r) => r.status === "Concluído").length,
  }), [reports]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar / Header */}
      <header className="gradient-primary px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img src="/logo-coopatos.png" alt="Logo Coopatos" className="w-20 h-20 rounded-xl object-contain" />
          <div>
            <h1 className="text-primary-foreground font-bold text-lg">Zeladoria Digital</h1>
            <p className="text-primary-foreground/60 text-xs">Painel de Manutenção • Coopatos</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="text-primary-foreground/70 hover:text-primary-foreground flex items-center gap-1 text-sm"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </header>

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "bg-primary/10 text-primary" },
            { label: "Abertos", value: stats.open, color: "bg-destructive/10 text-destructive" },
            { label: "Em Andamento", value: stats.inProgress, color: "bg-warning/10 text-warning" },
            { label: "Concluídos", value: stats.done, color: "bg-success/10 text-success" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color.split(" ")[1]}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* View Toggle + Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="flex gap-2">
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("list")}
              className={view === "list" ? "bg-primary text-primary-foreground" : ""}
            >
              <List className="w-4 h-4 mr-1" /> Lista
            </Button>
            <Button
              variant={view === "maps" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("maps")}
              className={view === "maps" ? "bg-primary text-primary-foreground" : ""}
            >
              <MapIcon className="w-4 h-4 mr-1" /> Mapas
            </Button>
          </div>

          {view === "list" && (
            <div className="flex flex-wrap gap-2 flex-1">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      <span className="flex items-center gap-2">
                        {categoryIcons[c]}
                        {c}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                placeholder="Buscar local..."
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-[200px] h-9 text-sm"
              />
            </div>
          )}
        </div>

        {/* Content */}
        {view === "list" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-2">
              {filtered.length} ocorrências • Ordenadas por prioridade
            </p>
            {filtered.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedReport(report)}
                className="bg-card rounded-xl border border-border p-4 hover:shadow-md hover:border-secondary/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Priority Bar */}
                  <div className="flex flex-col items-center gap-1 w-8">
                    <div className={`w-2 h-8 rounded-full ${priorityBarColor(CATEGORY_WEIGHTS[report.category])}`} />
                    <span className="text-[10px] font-bold text-muted-foreground">P{CATEGORY_WEIGHTS[report.category]}</span>
                  </div>

                  {/* Image */}
                  <img
                    src={report.imageUrl}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 hidden sm:block"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-primary">{categoryIcons[report.category]}</span>
                      <span className="font-semibold text-sm">{report.category}</span>
                      <span className="text-xs text-muted-foreground">{report.id}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{report.description || report.referencePoint}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {report.referencePoint}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <span className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap ${statusColors[report.status]}`}>
                    {report.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <DashboardMaps reports={filtered} onSelectReport={setSelectedReport} />
        )}
      </div>

      {/* Report Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <ReportDetail report={selectedReport} onClose={() => setSelectedReport(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;

import React from "react";
import { motion } from "framer-motion";
import { X, MapPin, User, Calendar, Weight } from "lucide-react";
import { Report, CATEGORY_WEIGHTS, STATUSES, Status } from "@/data/mockData";
import { useReports } from "@/contexts/ReportsContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusColors: Record<Status, string> = {
  "Aberto": "bg-destructive/10 text-destructive",
  "Em Andamento": "bg-warning/10 text-warning",
  "Aguardando Peça": "bg-info/10 text-info",
  "Concluído": "bg-success/10 text-success",
};

const ReportDetail = ({ report, onClose }: { report: Report; onClose: () => void }) => {
  const { updateStatus } = useReports();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative">
          <img src={report.imageUrl} alt="" className="w-full h-56 object-cover rounded-t-2xl" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-foreground/60 text-background rounded-full w-8 h-8 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-3 flex gap-2">
            <span className={`text-xs px-3 py-1 rounded-full ${statusColors[report.status]} backdrop-blur-sm`}>
              {report.status}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-primary/90 text-primary-foreground">
              Peso {CATEGORY_WEIGHTS[report.category]}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{report.category}</h2>
              <span className="text-xs text-muted-foreground">{report.id}</span>
            </div>
            {report.description && (
              <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-secondary" />
              <span>{report.referencePoint}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 text-secondary" />
              <span>{new Date(report.createdAt).toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4 text-muted-foreground/50" />
              <span className="text-xs">Mat. {report.matricula}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              📍 {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
            </div>
          </div>

          {/* Status Update */}
          <div className="pt-3 border-t border-border">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Atualizar Status</label>
            <Select
              value={report.status}
              onValueChange={(v) => updateStatus(report.id, v as Status)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReportDetail;

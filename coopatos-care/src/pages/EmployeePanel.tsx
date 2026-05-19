import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  MapPin,
  Send,
  List,
  Plus,
  LogOut,
  AlertTriangle,
  Droplets,
  Zap,
  Mountain,
  Shield,
  TreePine,
  HelpCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// =========================
// Types
// =========================
type Category = {
  id: number;
  name: string;
  icon?: string | null;
};

type Report = {
  id: number;
  description?: string | null;
  referencePoint?: string | null;
  createdAt: string;
  category: {
    id: number;
    name: string;
  };
  status: {
    id: number;
    name: string;
    color?: string | null;
  };
};

const categoryIcons: Record<string, React.ReactNode> = {
  "Hídrico": <Droplets className="w-4 h-4 text-blue-500" />,
  "Elétrico": <Zap className="w-4 h-4 text-yellow-500" />,
  "Erosão": <Mountain className="w-4 h-4 text-amber-600" />,
  "Segurança": <Shield className="w-4 h-4 text-red-500" />,
  "Vegetação": <TreePine className="w-4 h-4 text-green-500" />,
  "Outros": <HelpCircle className="w-4 h-4 text-gray-500" />,
};

const statusColors: Record<string, string> = {
  ABERTO: "bg-red-100 text-red-700 border-red-200",
  EM_ANALISE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  EM_ANDAMENTO: "bg-blue-100 text-blue-700 border-blue-200",
  FINALIZADO: "bg-green-100 text-green-700 border-green-200",
};

const EmployeePanel = () => {
  const { matricula, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"new" | "history">("new");

  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [description, setDescription] = useState("");
  const [referencePoint, setReferencePoint] = useState("");

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [gettingLocation, setGettingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [myReports, setMyReports] = useState<Report[]>([]);

  // =========================
  // Load categories and reports
  // =========================
  useEffect(() => {
    async function loadData() {
      try {
        const employee = JSON.parse(localStorage.getItem("employee") || "{}");

        // Load categories
        const categoriesResponse = await fetch("http://localhost:3333/categories");
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Load employee reports
        if (employee.id) {
          const reportsResponse = await fetch(
            `http://localhost:3333/employees/${employee.id}/reports`
          );
          const reportsData = await reportsResponse.json();
          setMyReports(reportsData);
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Erro ao carregar dados",
          variant: "destructive",
        });
      }
    }

    loadData();
  }, [toast]);

  // =========================
  // Image Upload
  // =========================
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // =========================
  // GPS
  // =========================
  const getLocation = () => {
  setGettingLocation(true);

  if (!navigator.geolocation) {
    setGettingLocation(false);
    toast({
      title: "GPS não suportado",
      description: "Seu navegador não suporta geolocalização.",
      variant: "destructive",
    });
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;

      setCoords({
        lat: latitude,
        lng: longitude,
      });

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );

        const data = await response.json();

        const road = data.address?.road || "Rua não identificada";
        const suburb =
          data.address?.suburb ||
          data.address?.neighbourhood ||
          "";
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          "";
        const state = data.address?.state || "";

        const addressText = [road, suburb, city, state]
          .filter(Boolean)
          .join(", ");

        toast({
          title: "Localização capturada!",
          description:
            `${addressText}\n` +
            `Lat: ${latitude.toFixed(6)} | ` +
            `Lng: ${longitude.toFixed(6)}`,
        });
      } catch (error) {
        toast({
          title: "Localização capturada!",
          description:
            `Lat: ${latitude.toFixed(6)} | ` +
            `Lng: ${longitude.toFixed(6)}`,
        });
      }

      setGettingLocation(false);
    },
    (error) => {
      console.error("Erro ao obter localização:", error);

      setGettingLocation(false);

      toast({
        title: "Não foi possível obter localização",
        description:
          "Permita o acesso à localização no navegador.",
        variant: "destructive",
      });
    },
    {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 60000,
    }
  );
};

  // =========================
  // Submit report
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imagePreview) {
      toast({
        title: "Foto obrigatória",
        description: "Tire ou envie uma foto do problema.",
        variant: "destructive",
      });
      return;
    }

    if (!categoryId) {
      toast({
        title: "Categoria obrigatória",
        variant: "destructive",
      });
      return;
    }

    try {
      const employee = JSON.parse(localStorage.getItem("employee") || "{}");

      if (!employee.id) {
        toast({
          title: "Funcionário não encontrado",
          description: "Faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      const loc = coords || {
        lat: null,
        lng: null,
};

      const response = await fetch("http://localhost:3333/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employee.id,
          categoryId: Number(categoryId),
          description,
          referencePoint,
          latitude: loc.lat,
          longitude: loc.lng,
}),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao criar chamado",
          description: data.error || "Erro desconhecido",
          variant: "destructive",
        });
        return;
      }

      setMyReports((prev) => [data, ...prev]);

      toast({
        title: "Chamado enviado com sucesso!",
      });

      // Reset form
      setCategoryId("");
      setDescription("");
      setReferencePoint("");
      setImagePreview(null);
      setCoords(null);

      setTab("history");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    }
  };

  // =========================
  // Logout
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("employee");
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="gradient-primary px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <img
            src="/logo-coopatos.png"
            alt="Logo Coopatos"
            className="w-20 h-20 rounded-xl"
          />
          <div>
            <h1 className="text-primary-foreground font-bold text-lg">
              Zeladoria Coopatos
            </h1>
            <p className="text-primary-foreground/60 text-xs">
              Matrícula: {matricula}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-primary-foreground/70 hover:text-primary-foreground"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card">
        <button
          onClick={() => setTab("new")}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            tab === "new"
              ? "text-secondary border-b-2 border-secondary"
              : "text-muted-foreground"
          }`}
        >
          <Plus className="w-4 h-4" /> Novo Chamado
        </button>

        <button
          onClick={() => setTab("history")}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            tab === "history"
              ? "text-secondary border-b-2 border-secondary"
              : "text-muted-foreground"
          }`}
        >
          <List className="w-4 h-4" /> Meus Reportes ({myReports.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {tab === "new" ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Image Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />

                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-secondary hover:text-secondary transition-colors bg-muted/30"
                  >
                    <Camera className="w-10 h-10" />
                    <span className="text-sm font-medium">
                      Tirar Foto / Enviar Imagem
                    </span>
                    <span className="text-xs">Obrigatório</span>
                  </button>
                )}
              </div>

              {/* Categories */}
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria *" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={String(category.id)}
                    >
                      <span className="flex items-center gap-2">
                        {categoryIcons[category.name] ||
                          categoryIcons["Outros"]}
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* GPS */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-shrink-0"
                  onClick={getLocation}
                  disabled={gettingLocation}
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  {coords ? "✓ GPS" : gettingLocation ? "..." : "GPS"}
                </Button>

                <Input
                  placeholder="Ponto de referência (ex: Galpão B)"
                  value={referencePoint}
                  onChange={(e) => setReferencePoint(e.target.value)}
                />
              </div>

              {/* Description */}
              <Textarea
                placeholder="Descrição breve (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                <Send className="w-5 h-5 mr-2" />
                Reportar Problema
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {myReports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Nenhum reporte ainda</p>
                </div>
              ) : (
                myReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-card rounded-lg p-4 border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs text-muted-foreground">
                          #{report.id}
                        </span>
                        <h3 className="font-semibold text-sm">
                          {report.category.name}
                        </h3>
                      </div>

                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${
                          statusColors[report.status.name] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {report.status.name}
                      </span>
                    </div>

                    {report.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {report.description}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString("pt-BR")}
                      {report.referencePoint
                        ? ` • ${report.referencePoint}`
                        : ""}
                    </p>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmployeePanel;

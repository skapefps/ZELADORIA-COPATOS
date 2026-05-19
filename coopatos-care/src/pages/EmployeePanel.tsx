import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useReports } from "@/contexts/ReportsContext";
import { CATEGORIES, Category, getReportsByMatricula, CATEGORY_WEIGHTS } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, Send, List, Plus, LogOut, AlertTriangle, Droplets, Zap, Mountain, Shield, TreePine, HelpCircle } from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  "Hídrico": <Droplets className="w-4 h-4 text-blue-500" />,
  "Elétrico": <Zap className="w-4 h-4 text-yellow-500" />,
  "Erosão": <Mountain className="w-4 h-4 text-amber-600" />,
  "Segurança": <Shield className="w-4 h-4 text-red-500" />,
  "Vegetação": <TreePine className="w-4 h-4 text-green-500" />,
  "Outro": <HelpCircle className="w-4 h-4 text-gray-500" />,
};
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  "Aberto": "bg-destructive/10 text-destructive border-destructive/20",
  "Em Andamento": "bg-warning/10 text-warning border-warning/20",
  "Aguardando Peça": "bg-info/10 text-info border-info/20",
  "Concluído": "bg-success/10 text-success border-success/20",
};

const EmployeePanel = () => {
  const { matricula, logout } = useAuth();
  const { reports, addReport } = useReports();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"new" | "history">("new");
  const [category, setCategory] = useState<Category | "">("");
  const [description, setDescription] = useState("");
  const [referencePoint, setReferencePoint] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const myReports = reports.filter((r) => r.matricula === matricula);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGettingLocation(false);
          toast({ title: "Localização capturada!" });
        },
        () => {
          setCoords({ lat: -18.578 + Math.random() * 0.01, lng: -46.518 + Math.random() * 0.01 });
          setGettingLocation(false);
          toast({ title: "GPS indisponível", description: "Localização aproximada usada." });
        }
      );
    } else {
      setCoords({ lat: -18.578, lng: -46.518 });
      setGettingLocation(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) {
      toast({ title: "Foto obrigatória", description: "Tire ou envie uma foto do problema.", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Categoria obrigatória", variant: "destructive" });
      return;
    }
    const loc = coords || { lat: -18.578 + Math.random() * 0.01, lng: -46.518 + Math.random() * 0.01 };
    addReport({
      matricula: matricula!,
      category: category as Category,
      description,
      referencePoint,
      imageUrl: imagePreview,
      latitude: loc.lat,
      longitude: loc.lng,
    });
    toast({ title: "Chamado enviado!", description: `Categoria: ${category}` });
    setCategory("");
    setDescription("");
    setReferencePoint("");
    setImagePreview(null);
    setCoords(null);
    setTab("history");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="gradient-primary px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <img src="public/logo-coopatos.png" alt="Logo Coopatos" className="w-20 h-20 rounded-xl" />
          <div>
            <h1 className="text-primary-foreground font-bold text-lg">Zeladoria Coopatos</h1>
            <p className="text-primary-foreground/60 text-xs">Matrícula: {matricula}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-primary-foreground/70 hover:text-primary-foreground">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Tab Bar */}
      <div className="flex border-b border-border bg-card">
        <button
          onClick={() => setTab("new")}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            tab === "new" ? "text-secondary border-b-2 border-secondary" : "text-muted-foreground"
          }`}
        >
          <Plus className="w-4 h-4" /> Novo Chamado
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            tab === "history" ? "text-secondary border-b-2 border-secondary" : "text-muted-foreground"
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
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 bg-foreground/80 text-background rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-secondary hover:text-secondary transition-colors bg-muted/30"
                  >
                    <Camera className="w-10 h-10" />
                    <span className="text-sm font-medium">Tirar Foto / Enviar Imagem</span>
                    <span className="text-xs">Obrigatório</span>
                  </button>
                )}
              </div>

              {/* Category */}
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria *" />
                </SelectTrigger>
                <SelectContent>
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
                myReports.map((r) => (
                  <div key={r.id} className="bg-card rounded-lg p-4 border border-border animate-fade-in">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs text-muted-foreground">{r.id}</span>
                        <h3 className="font-semibold text-sm">{r.category}</h3>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[r.status]}`}>
                        {r.status}
                      </span>
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground mb-2">{r.description}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("pt-BR")} • {r.referencePoint}
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

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
  latitude?: number | null;
  longitude?: number | null;
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

  images?: {
    id: number;
    imageUrl: string;
  }[];
};

const categoryIcons: Record<string, React.ReactNode> = {
  "Hídrico": <Droplets className="w-4 h-4 text-blue-500" />,
  "Elétrico": <Zap className="w-4 h-4 text-yellow-500" />,
  "Erosão": <Mountain className="w-4 h-4 text-amber-600" />,
  "Segurança": <Shield className="w-4 h-4 text-red-500" />, "Vegetação": <TreePine className="w-4 h-4 text-green-500" />,
  "Outros": <HelpCircle className="w-4 h-4 text-gray-500" />,
};

const statusColors: Record<string, string> = {
  ABERTO: "bg-red-100 text-red-700 border-red-200",
  EM_ANALISE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  EM_ANDAMENTO: "bg-blue-100 text-blue-700 border-blue-200",
  FINALIZADO: "bg-green-100 text-green-700 border-green-200",
};

const EmployeePanel = () => {
  const employee = JSON.parse(localStorage.getItem("employee") || "{}");
const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3333"
    : import.meta.env.VITE_API_URL || "https://zeladoria-coopatos-api.onrender.com";
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { matricula, logout } = useAuth();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editReferencePoint, setEditReferencePoint] = useState("");
  const employeeName = employee.name || "";
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"new" | "history">("new");
  const [submitting, setSubmitting] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [description, setDescription] = useState("");
  const [referencePoint, setReferencePoint] = useState("");


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
        const categoriesResponse = await fetch(`${API_URL}/categories`);
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Load employee reports
        if (employee.id) {
          const reportsResponse = await fetch(
            `${API_URL}/employees/${employee.id}/reports`
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
  const files = Array.from(e.target.files || []);

  if (files.length === 0) return;

  setSelectedFiles(files);
  setCurrentImageIndex(0);

  const previews: string[] = [];

  files.forEach((file) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      previews.push(reader.result as string);

      if (previews.length === files.length) {
        setImagePreviews(previews);
      }
    };

    reader.readAsDataURL(file);
  });
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

const uploadImageToCloudinary = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append(
    "upload_preset",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  console.log("Cloudinary response:", data);

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Erro ao enviar imagem para o Cloudinary");
  }

  return data.secure_url;
};

  // =========================
  // Submit report
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0)  {
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
  setSubmitting(true);
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
let imageUrl = null;

console.log("URL da imagem enviada:", imageUrl);

const imageUrls = await Promise.all(
  selectedFiles.map((file) => uploadImageToCloudinary(file))
);

      const response = await fetch(`${API_URL}/reports`, {
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
    imageUrls,
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
      setImagePreviews([]);
      setSelectedFiles([]);
      setCurrentImageIndex(0);
      setCoords(null);

      setTab("history");
    } catch (error) {
  console.error(error);
  toast({
    title: "Erro ao conectar com o servidor",
    variant: "destructive",
  });
} finally {
  setSubmitting(false);
}};

  

  // =========================
  // Logout
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("employee");
    logout();
    navigate("/");
  };
  const openReportDetails = (report: Report) => {
  setSelectedReport(report);
  setDetailImageIndex(0);
  setIsEditing(false);
  setEditCategoryId(String(report.category.id));
  setEditDescription(report.description || "");
  setEditReferencePoint(report.referencePoint || "");
};

const handleUpdateReport = async () => {
  if (!selectedReport) return;

  try {
    const response = await fetch(`${API_URL}/reports/${selectedReport.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        categoryId: Number(editCategoryId),
        description: editDescription,
        referencePoint: editReferencePoint,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Erro ao atualizar chamado",
        description: data.error || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    setMyReports((prev) =>
      prev.map((report) => (report.id === data.id ? data : report))
    );

    setSelectedReport(data);
    setIsEditing(false);

    toast({
      title: "Chamado atualizado com sucesso!",
    });
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro ao conectar com o servidor",
      variant: "destructive",
    });
  }
  
};

const getStatusStyle = (status: string) => {
  return statusColors[status] || "bg-gray-100 text-gray-700 border-gray-200";
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
                  {employeeName}
            </p>

            <p className="text-primary-foreground/50 text-[11px]">
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
  multiple
  className="hidden"
  onChange={handleImageChange}
/>

                {imagePreviews.length > 0 ? (
  <div className="relative rounded-lg overflow-hidden">
    <img
      src={imagePreviews[currentImageIndex]}
      alt="Preview"
      className="w-full h-48 object-cover"
    />

    {imagePreviews.length > 1 && (
      <>
        <button
          type="button"
          onClick={() =>
            setCurrentImageIndex((prev) =>
              prev === 0 ? imagePreviews.length - 1 : prev - 1
            )
          }
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={() =>
            setCurrentImageIndex((prev) =>
              prev === imagePreviews.length - 1 ? 0 : prev + 1
            )
          }
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
        >
          ›
        </button>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {currentImageIndex + 1} / {imagePreviews.length}
        </div>
      </>
    )}

    <button
      type="button"
      onClick={() => {
        setImagePreviews([]);
        setSelectedFiles([]);
        setCurrentImageIndex(0);
      }}
      className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
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
    <span className="text-sm font-medium">Tirar Foto / Enviar Imagens</span>
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
  disabled={submitting}
  className="w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
>
  <Send className="w-5 h-5 mr-2" />
  {submitting ? "Enviando chamado..." : "Reportar Problema"}
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
                    {report.images?.[0]?.imageUrl && (
  <div className="mb-3 rounded-lg overflow-hidden border border-border">
    <img
  src={report.images[0].imageUrl.replace("/upload/", "/upload/w_500,q_auto,f_auto/")}
      alt="Preview do chamado"
      className="w-full h-32 object-cover"
    />
  </div>
)}
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
                     {report.referencePoint ? ` • ${report.referencePoint}` : ""}
                    </p>

<Button
  variant="outline"
  size="sm"
  className="mt-3 w-full"
  onClick={() => openReportDetails(report)}
>
  Ver detalhes
</Button>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {selectedReport && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-card rounded-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
     <div className="mb-5">
  <p className="text-xs text-muted-foreground">Detalhes do chamado</p>
  <h2 className="text-xl font-bold text-foreground">
    Chamado #{selectedReport.id}
  </h2>
</div>

      {selectedReport.images && selectedReport.images.length > 0 && (
  <>
    <div className="relative mb-4 rounded-lg overflow-hidden">
      <img
        src={selectedReport.images[detailImageIndex].imageUrl.replace(
  "/upload/",
  "/upload/w_900,q_auto,f_auto/"
)}
        alt="Imagem do chamado"
        className="w-full h-64 object-cover rounded-lg"
      />

      {selectedReport.images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setDetailImageIndex((prev) =>
                prev === 0
                  ? selectedReport.images!.length - 1
                  : prev - 1
              )
            }
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() =>
              setDetailImageIndex((prev) =>
                prev === selectedReport.images!.length - 1
                  ? 0
                  : prev + 1
              )
            }
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >
            ›
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {detailImageIndex + 1} / {selectedReport.images.length}
          </div>
        </>
      )}
    </div>

    {isEditing && selectedReport.images?.[detailImageIndex] && (
      <Button
        variant="destructive"
        size="sm"
        className="mb-4 w-full"
        onClick={async () => {
          const imageId =
            selectedReport.images![detailImageIndex].id;

          await fetch(
            `${API_URL}/report-images/${imageId}`,
            {
              method: "DELETE",
            }
          );

          const updatedImages =
            selectedReport.images!.filter(
              (img) => img.id !== imageId
            );

          const updatedReport = {
            ...selectedReport,
            images: updatedImages,
          };

          setSelectedReport(updatedReport);
          setMyReports((prev) =>
            prev.map((report) =>
              report.id === selectedReport.id
                ? updatedReport
                : report
            )
          );

          setDetailImageIndex(0);
        }}
      >
        Remover imagem atual
      </Button>
    )}
  </>
)}
      <div className="mb-4">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
  Categoria
</label>

        {isEditing ? (
          <Select
            value={editCategoryId}
            onValueChange={setEditCategoryId}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem
                  key={category.id}
                  value={String(category.id)}
                >
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p>{selectedReport.category.name}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium">Descrição</label>

        {isEditing ? (
          <Textarea
            value={editDescription}
            onChange={(e) =>
              setEditDescription(e.target.value)
            }
          />
        ) : (
          <p>{selectedReport.description || "Sem descrição"}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium">
          Ponto de referência
        </label>

        {isEditing ? (
          <Input
            value={editReferencePoint}
            onChange={(e) =>
              setEditReferencePoint(e.target.value)
            }
          />
        ) : (
          <p>
            {selectedReport.referencePoint || "Não informado"}
          </p>
        )}
      </div>

      <div className="mb-4">
  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
    Situação
  </label>

  <div className="mt-1">
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
        selectedReport.status.name
      )}`}
    >
      {selectedReport.status.name}
    </span>
  </div>
</div>

{isEditing && (
  <div className="mb-4">
    <Input
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      id="edit-images-input"
      onChange={async (e) => {
        const files = Array.from(e.target.files || []);

        if (files.length === 0 || !selectedReport) return;

        try {
          const imageUrls = await Promise.all(
            files.map((file) => uploadImageToCloudinary(file))
          );

          const response = await fetch(
            `${API_URL}/reports/${selectedReport.id}/images`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ imageUrls }),
            }
          );

          const updatedReport = await response.json();

          setSelectedReport(updatedReport);

          setMyReports((prev) =>
            prev.map((report) =>
              report.id === updatedReport.id
                ? updatedReport
                : report
            )
          );

          setDetailImageIndex(
            updatedReport.images.length - imageUrls.length
          );

          toast({
            title: "Imagens adicionadas com sucesso!",
          });
        } catch (error) {
          console.error(error);

          toast({
            title: "Erro ao adicionar imagens",
            variant: "destructive",
          });
        }
      }}
    />

    <label
      htmlFor="edit-images-input"
      className="w-full inline-flex items-center justify-center rounded-md bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium cursor-pointer transition-colors"
    >
      + Adicionar novas fotos
    </label>
  </div>
)}

<div className="flex gap-2 mt-6">
  {isEditing ? (
    <>
      <Button className="flex-1" onClick={handleUpdateReport}>
        Salvar
      </Button>

      <Button
        variant="outline"
        className="flex-1"
        onClick={() => setIsEditing(false)}
      >
        Cancelar
      </Button>
    </>
  ) : (
    <>
      <Button
        className="flex-1"
        onClick={() => setIsEditing(true)}
      >
        Editar
      </Button>

      <Button
        variant="outline"
        className="flex-1"
        onClick={() => setSelectedReport(null)}
      >
        Fechar
      </Button>
    </>
  )}
</div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default EmployeePanel;

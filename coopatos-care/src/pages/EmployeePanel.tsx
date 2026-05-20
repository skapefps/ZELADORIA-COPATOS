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
  Expand,
  Shield,
  TreePine,
  HelpCircle,
  X,
  Trash2,
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
  title?: string | null;
  referencePoint?: string | null;
  latitude?: number | null;
  _count?: {
  messages: number;
};
  longitude?: number | null;
  address?: string | null;
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
  publicId?: string | null;
  resourceType?: string | null;
}[];
};

type ReportMessage = {
  id: number;
  reportId: number;
  senderId?: number | null;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
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
  const [address, setAddress] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCoords, setEditCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [geocoding, setGeocoding] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { matricula, logout } = useAuth();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editReferencePoint, setEditReferencePoint] = useState("");
  const employeeName = employee.name || "";

  const [messages, setMessages] = useState<ReportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expandedMedia, setExpandedMedia] = useState<{
  url: string;
  type?: string | null;
  index: number;
} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"new" | "history" | "reports">("new");
  const [submitting, setSubmitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [referencePoint, setReferencePoint] = useState("");


  const [gettingLocation, setGettingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [myReports, setMyReports] = useState<Report[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // =========================
  // Load categories and reports
  // =========================

  useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "instant",
  });
}, []);

  useEffect(() => {
  const employee = JSON.parse(
    localStorage.getItem("employee") || "{}"
  );

  const welcomeShown = sessionStorage.getItem("welcomeShown");

  if (employee.name && !welcomeShown) {
    toast({
  title: `✓ Bem-vindo, ${employee.name}!`,
  description: "Login realizado com sucesso.",
  className:
    "bg-secondary text-secondary-foreground border-secondary",
});

    sessionStorage.setItem("welcomeShown", "true");
  }
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
          const allReportsResponse = await fetch(`${API_URL}/reports`);
          const allReportsData = await allReportsResponse.json();
          setAllReports(allReportsData);
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
  }, [toast,API_URL]);

  const filteredReports = myReports.filter((report) => {
  const search = searchTerm.toLowerCase();

  const matchesSearch =
    String(report.id).includes(search) ||
    report.description?.toLowerCase().includes(search) ||
    report.referencePoint?.toLowerCase().includes(search) ||
    report.address?.toLowerCase().includes(search) ||
    report.category.name.toLowerCase().includes(search) ||
    report.status.name.toLowerCase().includes(search);

  const matchesStatus =
    statusFilter === "all" || report.status.name === statusFilter;

  const matchesCategory =
    categoryFilter === "all" || String(report.category.id) === categoryFilter;

  return matchesSearch && matchesStatus && matchesCategory;
});

const loadMessages = async (reportId: number) => {
  setLoadingMessages(true);

  try {
    const response = await fetch(`${API_URL}/reports/${reportId}/messages`);
    const data = await response.json();

    setMessages(data);
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro ao carregar mensagens",
      variant: "destructive",
    });
  } finally {
    setLoadingMessages(false);
  }
};

const sendMessage = async () => {
  if (!selectedReport || !newMessage.trim()) return;

  setSendingMessage(true);

  try {
    const employee = JSON.parse(localStorage.getItem("employee") || "{}");

    const response = await fetch(
      `${API_URL}/reports/${selectedReport.id}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: employee.id,
          senderName: employee.name,
          senderRole: "EMPLOYEE",
          message: newMessage.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Erro ao enviar mensagem",
        description: data.error || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    setMessages((prev) => [...prev, data]);
    setMyReports((prev) =>
  prev.map((report) =>
    report.id === data.reportId
      ? {
          ...report,
          _count: {
            messages: (report._count?.messages || 0) + 1,
          },
        }
      : report
  )
);

setAllReports((prev) =>
  prev.map((report) =>
    report.id === data.reportId
      ? {
          ...report,
          _count: {
            messages: (report._count?.messages || 0) + 1,
          },
        }
      : report
  )
);
    setNewMessage("");
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro ao conectar com o servidor",
      variant: "destructive",
    });
  } finally {
    setSendingMessage(false);
  }
};

  // =========================
  // Image Upload
  // =========================

  const downloadMedia = async (url: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);

    const fileExtension = url.includes(".mp4")
      ? "mp4"
      : url.includes(".mov")
      ? "mov"
      : "jpg";

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `chamado-midia.${fileExtension}`;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro ao baixar mídia",
      variant: "destructive",
    });
  }
};
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
          setAddress(addressText);

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
    `https://api.cloudinary.com/v1_1/${
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    }/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error(
      data.error?.message || "Erro ao enviar arquivo para o Cloudinary"
    );
  }

  return {
    imageUrl: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type || "image",
  };
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

    if (!title.trim()) {
  toast({
    title: "Nome do chamado obrigatório",
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
let finalCoords = coords;
let finalAddress = address;

if (address) {
  const result = await geocodeAddress(address);

  if (result) {
    finalCoords = {
      lat: result.lat,
      lng: result.lng,
    };

    finalAddress = result.displayName;
    setAddress(result.displayName);
  }
}

      const loc = finalCoords || {
  lat: null,
  lng: null,
};
let imageUrl = null;

console.log("URL da imagem enviada:", imageUrl);

const mediaItems = await Promise.all(
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
  title,
  description,
  referencePoint,
  latitude: loc.lat,
  longitude: loc.lng,
  address: finalAddress,
  mediaItems,
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
      setTitle("");
      setDescription("");
      setReferencePoint("");
      setAddress("");
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

const getEditLocation = () => {
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

      setEditCoords({
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

        setEditAddress(addressText);

        toast({
          title: "Localização atualizada!",
          description:
            `${addressText}\n` +
            `Lat: ${latitude.toFixed(6)} | ` +
            `Lng: ${longitude.toFixed(6)}`,
        });
      } catch {
        toast({
          title: "Localização atualizada!",
          description:
            `Lat: ${latitude.toFixed(6)} | ` +
            `Lng: ${longitude.toFixed(6)}`,
        });
      }

      setGettingLocation(false);
    },
    () => {
      setGettingLocation(false);

      toast({
        title: "Não foi possível obter localização",
        description: "Permita o acesso à localização no navegador.",
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

const geocodeAddress = async (typedAddress: string) => {
  if (!typedAddress.trim()) return null;

  setGeocoding(true);

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        typedAddress
      )}&limit=1`
    );

    const data = await response.json();

    if (!data || data.length === 0) {
      toast({
        title: "Endereço não encontrado",
        description: "Tente informar rua, número, bairro e cidade.",
        variant: "destructive",
      });
      return null;
    }

    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      displayName: data[0].display_name,
    };
  } finally {
    setGeocoding(false);
  }
};
  

  // =========================
  // Logout
  // =========================
  const handleLogout = () => {
  sessionStorage.removeItem("welcomeShown");
  localStorage.removeItem("employee");
  logout();
  navigate("/");
};
  const openReportDetails = (report: Report) => {
  setEditTitle(report.title || "");
  setSelectedReport(report);
  setEditAddress(report.address || "");
  setEditCoords(
  report.latitude && report.longitude
    ? { lat: report.latitude, lng: report.longitude }
    : null
);
  setDetailImageIndex(0);
  setIsEditing(false);
  setEditCategoryId(String(report.category.id));
  setEditDescription(report.description || "");
  setEditReferencePoint(report.referencePoint || "");
  loadMessages(report.id);
};

const handleUpdateReport = async () => {
  if (!selectedReport) return;
  

  setSavingEdit(true);

  try {
    let finalEditCoords = editCoords;
    let finalEditAddress = editAddress;

    if (editAddress) {
      const result = await geocodeAddress(editAddress);

      if (result) {
        finalEditCoords = {
          lat: result.lat,
          lng: result.lng,
        };

        finalEditAddress = result.displayName;
      }
    }

    const response = await fetch(`${API_URL}/reports/${selectedReport.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        categoryId: Number(editCategoryId),
        description: editDescription,
        title: editTitle,
        referencePoint: editReferencePoint,
        latitude: finalEditCoords?.lat ?? selectedReport.latitude,
        longitude: finalEditCoords?.lng ?? selectedReport.longitude,
        address: finalEditAddress,
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
  } finally {
    setSavingEdit(false);
  }
};

const getStatusStyle = (status: string) => {
  return statusColors[status] || "bg-gray-100 text-gray-700 border-gray-200";
};

  return (
      <div className="min-h-screen bg-background">
  <div className="mx-auto w-full max-w-lg lg:max-w-6xl lg:px-8"></div>
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
  onClick={() => setShowLogoutConfirm(true)}
  className="text-red-400 hover:text-red-500 transition-colors"
  title="Sair"
>
  <LogOut className="w-5 h-5" />
</button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card">
        <button
          onClick={() => {
  setTab("new");
  window.scrollTo(0, 0);
}}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            tab === "new"
              ? "text-secondary border-b-2 border-secondary"
              : "text-muted-foreground"
          }`}
        >
          <Plus className="w-4 h-4" /> Novo Chamado
        </button>

        <button
          onClick={() => {
  setTab("history");
  window.scrollTo(0, 0);
}}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            tab === "history"
              ? "text-secondary border-b-2 border-secondary"
              : "text-muted-foreground"
          }`}
        >
          <List className="w-4 h-4" /> Meus Reportes ({myReports.length})
        </button>
        <button
  onClick={() => {
    setTab("reports");
    window.scrollTo(0, 0);
  }}
  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
    tab === "reports"
      ? "text-secondary border-b-2 border-secondary"
      : "text-muted-foreground"
  }`}
>
  <List className="w-4 h-4" />
  Reportes ({allReports.length})
</button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 lg:py-8">
        <AnimatePresence mode="wait">
          {tab === "new" ? (
           <motion.form
  key="form"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{
    duration: 0.15,
    ease: "easeOut",
  }}
  onSubmit={handleSubmit}
  className="space-y-4 lg:max-w-2xl lg:mx-auto">
              {/* Image Upload */}
              <div>
                <input
  ref={fileInputRef}
  type="file"
 accept="image/*,video/*"
  multiple
  className="hidden"
  onChange={handleImageChange}
/>

                {imagePreviews.length > 0 ? (
  <div className="relative rounded-lg overflow-hidden">
    {selectedFiles[currentImageIndex]?.type.startsWith("video/") ? (
  <video
    src={imagePreviews[currentImageIndex]}
    controls
    preload="metadata"
    className="w-full h-48 object-cover rounded-lg bg-black"
  />
) : (
  <img
    src={imagePreviews[currentImageIndex]}
    alt="Preview"
    loading="lazy"
    decoding="async"
    className="w-full h-48 object-cover rounded-lg"
  />
)}

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
  size="icon"
  onClick={getLocation}
  disabled={gettingLocation}
  title={
    gettingLocation
      ? "Obtendo localização..."
      : coords
      ? "Localização capturada"
      : "Capturar localização"
  }
  className={`shrink-0 transition-colors ${
    coords
      ? "border-green-500 text-green-600 hover:bg-green-50"
      : "border-red-300 text-red-500 hover:bg-red-50"
  }`}
>
  {gettingLocation ? (
    <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
  ) : (
    <MapPin className="w-4 h-4" />
  )}
</Button>

                <Input
                  placeholder="Ponto de referência (ex: Galpão B)"
                  value={referencePoint}
                  onChange={(e) => setReferencePoint(e.target.value)}
                />
              </div>
              {address && (
  <Input
    placeholder="Endereço"
    value={address}
    onChange={(e) => setAddress(e.target.value)}
  />
)}

<Input
  placeholder="Nome do chamado *"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
/>

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
  disabled={submitting || geocoding}
  className="w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
>
  <Send className="w-5 h-5 mr-2" />
  {submitting || geocoding ? (
    <span className="flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {geocoding ? "Buscando endereço..." : "Enviando chamado..."}
    </span>
  ) : (
    "Reportar Problema"
  )}
</Button>
            </motion.form>
                   ) : tab === "history" ? (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0"
            >
              <div className="lg:col-span-3 space-y-3 mb-2">
                <Input
                  placeholder="Buscar por número, descrição, endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Situação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas situações</SelectItem>
                      <SelectItem value="ABERTO">Aberto</SelectItem>
                      <SelectItem value="EM_ANALISE">Em análise</SelectItem>
                      <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                      <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          <span className="flex items-center gap-2">
                            {categoryIcons[category.name] || categoryIcons["Outros"]}
                            {category.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredReports.length === 0 ? (
                <div className="lg:col-span-3 text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>
                    {myReports.length === 0
                      ? "Nenhum reporte ainda"
                      : "Nenhum chamado encontrado com esses filtros"}
                  </p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-card rounded-lg p-4 border border-border"
                  >
                    <div className="mb-3 h-32 rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
                      {report.images?.[0]?.imageUrl ? (
                        report.images[0].resourceType === "video" ? (
                          <video
                            src={report.images[0].imageUrl}
                            controls
                            preload="metadata"
                            className="w-full h-32 object-cover bg-black"
                          />
                        ) : (
                          <img
                            src={report.images[0].imageUrl.replace(
                              "/upload/",
                              "/upload/w_500,q_auto,f_auto/"
                            )}
                            alt="Preview do chamado"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-32 object-cover"
                          />
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sem mídia
                        </span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 space-y-1.5">
                        <span className="text-xs text-muted-foreground">
                          #{report.id}
                        </span>

                        <h3 className="font-semibold text-sm uppercase line-clamp-2">
                          {report.title || "Sem nome"}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {categoryIcons[report.category.name] || categoryIcons["Outros"]}
                          <span>{report.category.name}</span>
                        </div>

                        <p className="text-xs text-muted-foreground">
  {new Date(report.createdAt).toLocaleDateString("pt-BR")}
  {report.referencePoint ? ` • ${report.referencePoint}` : ""}
</p>

{report._count?.messages ? (
  <p className="text-xs text-secondary font-medium">
    {report._count.messages} mensagem
    {report._count.messages > 1 ? "s" : ""}
  </p>
) : null}
                      </div>

                      <span
                        className={`shrink-0 text-xs px-2 py-1 rounded-full border ${
                          statusColors[report.status.name] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {report.status.name}
                      </span>
                    </div>

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
          ) : (
            <motion.div
              key="reports"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0"
            >
              {allReports.length === 0 ? (
                <div className="lg:col-span-3 text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Nenhum chamado encontrado</p>
                </div>
              ) : (
                allReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-card rounded-lg p-4 border border-border"
                  >
                    <div className="mb-3 h-32 rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
                      {report.images?.[0]?.imageUrl ? (
                        report.images[0].resourceType === "video" ? (
                          <video
                            src={report.images[0].imageUrl}
                            controls
                            preload="metadata"
                            className="w-full h-32 object-cover bg-black"
                          />
                        ) : (
                          <img
                            src={report.images[0].imageUrl.replace(
                              "/upload/",
                              "/upload/w_500,q_auto,f_auto/"
                            )}
                            alt="Preview do chamado"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-32 object-cover"
                          />
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sem mídia
                        </span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 space-y-1.5">
                        <span className="text-xs text-muted-foreground">
                          #{report.id}
                        </span>

                        <h3 className="font-semibold text-sm uppercase line-clamp-2">
  {report.title || "Sem nome"}
</h3>

{report.description && (
  <p className="text-xs text-muted-foreground line-clamp-2">
    {report.description}
  </p>
)}

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {categoryIcons[report.category.name] || categoryIcons["Outros"]}
                          <span>{report.category.name}</span>
                        </div>

                        <p className="text-xs text-muted-foreground">
  {new Date(report.createdAt).toLocaleDateString("pt-BR")}
  {report.referencePoint ? ` • ${report.referencePoint}` : ""}
</p>

{report._count?.messages ? (
  <p className="text-xs text-secondary font-medium">
    {report._count.messages} mensagen
    {report._count.messages > 1 ? "s" : ""}
  </p>
) : null}
                      </div>

                      <span
                        className={`shrink-0 text-xs px-2 py-1 rounded-full border ${
                          statusColors[report.status.name] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {report.status.name}
                      </span>
                    </div>

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
    <div className="relative bg-card rounded-2xl p-5 w-full max-w-lg lg:max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
      <button
  type="button"
  onClick={() => setSelectedReport(null)}
  className="sticky top-0 ml-auto z-20 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
>
  <X className="w-4 h-4" />
</button>
     <div className="mb-5">
  <p className="text-xs text-muted-foreground">Detalhes do chamado</p>
  <h2 className="text-xl font-bold text-foreground">
    Chamado #{selectedReport.id}
  </h2>
</div>

     {selectedReport.images && selectedReport.images.length > 0 && (
  <>
    <div className="relative mb-4 rounded-lg overflow-hidden">
      {selectedReport.images[detailImageIndex].resourceType === "video" ? (
        <video
          src={selectedReport.images[detailImageIndex].imageUrl}
          controls
          preload="metadata"
          className="w-full h-64 lg:h-96 object-cover rounded-lg bg-black"
        />
      ) : (
        <img
          src={selectedReport.images[detailImageIndex].imageUrl.replace(
            "/upload/",
            "/upload/w_900,q_auto,f_auto/"
          )}
          alt="Imagem do chamado"
          loading="lazy"
          decoding="async"
          className="w-full h-64 lg:h-96 object-cover rounded-lg"
        />
)}
<button
  type="button"
  onClick={() =>
  setExpandedMedia({
  url: selectedReport.images![detailImageIndex].imageUrl,
  type: selectedReport.images![detailImageIndex].resourceType,
  index: detailImageIndex,
})
}
  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
>
  <Expand className="w-4 h-4" />
</button>
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

    {isEditing && (
  <div className="mb-4 space-y-2">
    {selectedReport.images?.[detailImageIndex] && (
      <Button
        variant="outline"
        size="sm"
        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={async () => {
          const imageId =
            selectedReport.images![detailImageIndex].id;

          await fetch(`${API_URL}/report-images/${imageId}`, {
            method: "DELETE",
          });

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
        <span className="flex items-center justify-center gap-2">
          <Trash2 className="w-4 h-4" />
          Remover mídia
        </span>
      </Button>
    )}

    <label
      htmlFor="edit-images-input"
      className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 cursor-pointer transition-colors hover:bg-green-100"
    >
      <Plus className="w-4 h-4" />
      Adicionar mídia
    </label>
  </div>
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
  <SelectItem key={category.id} value={String(category.id)}>
    <span className="flex items-center gap-2">
      {categoryIcons[category.name] || categoryIcons["Outros"]}
      {category.name}
    </span>
  </SelectItem>
))}
            </SelectContent>
          </Select>
        ) : (
          <p>{selectedReport.category.name}</p>
        )}
      </div>

<div className="mb-4">
  <label className="text-sm font-medium">Nome do chamado</label>

  {isEditing ? (
    <Input
      value={editTitle}
      onChange={(e) => setEditTitle(e.target.value)}
    />
  ) : (
    <p>{selectedReport.title || "Sem nome"}</p>
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
  <label className="text-sm font-medium">Ponto de referência</label>

  {isEditing ? (
    <Input
      value={editReferencePoint}
      onChange={(e) => setEditReferencePoint(e.target.value)}
    />
  ) : (
    <p>{selectedReport.referencePoint || "Não informado"}</p>
  )}
</div>

<div className="mb-4">
  <label className="text-sm font-medium">Endereço</label>

  {isEditing ? (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
  <Button
    type="button"
    variant="outline"
    size="icon"
    onClick={getEditLocation}
    disabled={gettingLocation}
    title={
      gettingLocation
        ? "Obtendo localização..."
        : editCoords
        ? "Localização atualizada"
        : "Atualizar localização"
    }
    className={`shrink-0 transition-colors ${
      editCoords
        ? "border-green-500 text-green-600 hover:bg-green-50"
        : "border-red-300 text-red-500 hover:bg-red-50"
    }`}
  >
    {gettingLocation ? (
      <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
    ) : (
      <MapPin className="w-4 h-4" />
    )}
  </Button>

  <span className="text-sm text-muted-foreground">
    {editCoords
      ? "Localização capturada"
      : "Atualizar localização"}
  </span>
</div>

      <Input
        value={editAddress}
        onChange={(e) => setEditAddress(e.target.value)}
        placeholder="Endereço do chamado"
      />

      {editCoords && (
        <p className="text-xs text-muted-foreground">
          Lat: {editCoords.lat.toFixed(6)} | Lng:{" "}
          {editCoords.lng.toFixed(6)}
        </p>
      )}
    </div>
  ) : (
    <p>{selectedReport.address || "Não informado"}</p>
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
      accept="image/*,video/*"
      multiple
      className="hidden"
      id="edit-images-input"
      onChange={async (e) => {
        const files = Array.from(e.target.files || []);

        if (files.length === 0 || !selectedReport) return;

        try {
          const mediaItems = await Promise.all(
  files.map((file) => uploadImageToCloudinary(file))
);

          const response = await fetch(
            `${API_URL}/reports/${selectedReport.id}/images`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ mediaItems }),
            }
          );

          const updatedReport = await response.json();

          setSelectedReport(updatedReport);

          setMyReports((prev) =>
            prev.map((report) =>
              report.id === updatedReport.id ? updatedReport : report
            )
          );

          setDetailImageIndex(
            updatedReport.images.length - mediaItems.length
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

  </div>
)}

<div className="mt-6 border-t border-border pt-4">
  <h3 className="text-sm font-semibold mb-3">Mensagens</h3>

  <div className="space-y-3 max-h-56 overflow-y-auto rounded-lg bg-muted/20 p-3">
    {loadingMessages ? (
      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
        <span className="w-4 h-4 mr-2 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        Carregando mensagens...
      </div>
    ) : messages.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhuma mensagem ainda.
      </p>
    ) : (
      messages.map((msg) => {
        const isMine = msg.senderId === employee.id;

        return (
          <div
            key={msg.id}
            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                isMine
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-background border border-border"
              }`}
            >
              <div className="mb-1 text-[11px] opacity-70">
                {msg.senderName} •{" "}
                {new Date(msg.createdAt).toLocaleString("pt-BR")}
              </div>
              

              <p className="whitespace-pre-wrap">{msg.message}</p>
            </div>
          </div>
          
        );
        
      })
      
    )}
    
  </div>
  

  <div className="mt-3 flex gap-2">
    <Input
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      placeholder="Escreva uma mensagem."
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          sendMessage();
        }
      }}
    />

    <Button
      type="button"
      onClick={sendMessage}
      disabled={sendingMessage || !newMessage.trim()}
      className="shrink-0"
    >
      {sendingMessage ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        "Enviar"
      )}
    </Button>
  </div>
</div>

<div className="flex gap-2 mt-6">
  {isEditing ? (
    <>
     <Button
  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
  onClick={handleUpdateReport}
  disabled={savingEdit || geocoding}
>
  {savingEdit || geocoding ? (
    <span className="flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {geocoding ? "Buscando endereço..." : "Salvando..."}
    </span>
  ) : (
    "Salvar"
  )}
</Button>

      <Button
        variant="outline"
        className="flex-1 bg-red-600 hover:bg-red-500 text-white"
        onClick={() => setIsEditing(false)}
      >
        Cancelar
      </Button>
    </>
  ) : (
    <>
      <Button className="flex-1" onClick={() => setIsEditing(true)}>
        Editar
      </Button>

    </>
  )}
</div>
    </div>
  </div>
)}

{showLogoutConfirm && (
  <div className="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4">
    <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <LogOut className="w-6 h-6 text-red-600" />
        </div>

        <h3 className="text-lg font-semibold mb-2">
          Confirmar saída
        </h3>

        <p className="text-sm text-muted-foreground mb-6">
          Tem certeza que deseja sair do sistema?
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setShowLogoutConfirm(false)}
        >
          Cancelar
        </Button>

        <Button
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          onClick={handleLogout}
        >
          Sair
        </Button>
      </div>
    </div>
  </div>
)}

{expandedMedia && selectedReport?.images && (
  <div
    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
    onClick={() => setExpandedMedia(null)}
  >
    {expandedMedia.type === "video" ? (
      <video
        src={expandedMedia.url}
        controls
        autoPlay
        className="max-w-full max-h-full object-contain rounded-lg bg-black"
        onClick={(e) => e.stopPropagation()}
      />
    ) : (
      <img
        src={expandedMedia.url}
        alt="Mídia ampliada"
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    )}

    {selectedReport.images.length > 1 && (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();

            const newIndex =
              expandedMedia.index === 0
                ? selectedReport.images!.length - 1
                : expandedMedia.index - 1;

            const media = selectedReport.images![newIndex];

            setExpandedMedia({
              url: media.imageUrl,
              type: media.resourceType,
              index: newIndex,
            });
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();

            const newIndex =
              expandedMedia.index === selectedReport.images!.length - 1
                ? 0
                : expandedMedia.index + 1;

            const media = selectedReport.images![newIndex];

            setExpandedMedia({
              url: media.imageUrl,
              type: media.resourceType,
              index: newIndex,
            });
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl"
        >
          ›
        </button>
      </>
    )}

    <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    downloadMedia(expandedMedia.url);
  }}
  className="absolute top-4 right-16 bg-black/60 hover:bg-black/80 text-white rounded-full px-4 h-10 flex items-center justify-center text-sm"
>
  Baixar
</button>

    <button
      type="button"
      onClick={() => setExpandedMedia(null)}
      className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
    >
      ✕
    </button>
  </div>
)}

      </div>
    </div>
  );
};

export default EmployeePanel;

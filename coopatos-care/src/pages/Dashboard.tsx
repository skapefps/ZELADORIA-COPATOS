import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  Download,
  Expand,
  FileSpreadsheet,
  History,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Navigation,
  Droplets,
  Zap,
  Mountain,
  Shield,
  TreePine,
  HelpCircle,
  Map as MapIcon,
  X,
  Users,
  UserCog,
  Building2,
  Settings,
  ClipboardList,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/BrandLogo";
import {
  defaultBrandPreset,
  hexToHslString,
  hslStringToHex,
  useBranding,
} from "@/config/brand";
import DashboardMaps from "@/components/DashboardMaps";

type AdminSection =
  | "analytics"
  | "reports"
  | "maps"
  | "settings";

type SettingsTab =
  | "home"
  | "personalization"
  | "employees"
  | "users"
  | "departments"
  | "audit";

type AdminReport = {
  id: number;
  title?: string | null;
  description?: string | null;
  referencePoint?: string | null;
  priority?: string | null;
  address?: string | null;
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
  employee: {
    id: number;
    name: string;
    department?: string | null;
  };
  participants?: {
    id: number;
    employeeId: number;
    employee: {
      id: number;
      name: string;
      department?: string | null;
    };
  }[];
  images?: {
    id: number;
    imageUrl: string;
    resourceType?: string | null;
  }[];
};

type AdminEmployee = {
  id: number;
  registrationNumber: string;
  name: string;
  email?: string | null;
  cpf: string;
  phone?: string | null;
  avatarUrl?: string | null;
  birthDate?: string | null;
  department?: string | null;
  emailVerifiedAt?: string | null;
  emailVerificationSentAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    reports: number;
    participations: number;
  };
};

type AdminDepartment = {
  id: number;
  name: string;
  description?: string | null;
  color?: string | null;
  active: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdminUser = {
  id: number;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  employeeId?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  employee?: AdminEmployee | null;
};

type AuditLog = {
  id: number;
  action: string;
  entityType: string;
  entityId?: number | null;
  summary: string;
  actorName?: string | null;
  actorId?: number | null;
  metadata?: unknown;
  createdAt: string;
};

type DepartmentForm = {
  name: string;
  description: string;
  color: string;
  active: boolean;
};

type EmployeeForm = {
  registrationNumber: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  avatarUrl: string;
  birthDate: string;
  department: string;
};

type EmployeeFormErrors = Partial<Record<keyof EmployeeForm, string>>;

type ReportForm = {
  employeeId: string;
  categoryId: string;
  statusId: string;
  priority: string;
  title: string;
  description: string;
  referencePoint: string;
  address: string;
  latitude: string;
  longitude: string;
};

type BrandForm = {
  appName: string;
  shortName: string;
  organizationName: string;
  adminTitle: string;
  tagline: string;
  logoSrc: string;
  primary: string;
  secondary: string;
  background: string;
};

type ReportExportColumn =
  | "id"
  | "title"
  | "category"
  | "status"
  | "priority"
  | "employee"
  | "participants"
  | "address"
  | "referencePoint"
  | "createdAt"
  | "description";

type AnalyticsExportSection =
  | "summary"
  | "status"
  | "priority"
  | "categories"
  | "employees"
  | "departments"
  | "monthly"
  | "locations";

const emptyEmployeeForm: EmployeeForm = {
  registrationNumber: "",
  name: "",
  email: "",
  cpf: "",
  phone: "",
  avatarUrl: "",
  birthDate: "",
  department: "",
};

const emptyDepartmentForm: DepartmentForm = {
  name: "",
  description: "",
  color: "#2563eb",
  active: true,
};

const emptyReportForm: ReportForm = {
  employeeId: "",
  categoryId: "",
  statusId: "",
  priority: "MEDIA",
  title: "",
  description: "",
  referencePoint: "",
  address: "",
  latitude: "",
  longitude: "",
};

const createBrandForm = (preset = defaultBrandPreset): BrandForm => ({
  appName: preset.appName,
  shortName: preset.shortName,
  organizationName: preset.organizationName,
  adminTitle: preset.adminTitle,
  tagline: preset.tagline,
  logoSrc: preset.logoSrc,
  primary: hslStringToHex(preset.colors.primary),
  secondary: hslStringToHex(preset.colors.secondary),
  background: hslStringToHex(preset.colors.background),
});

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const formatCpf = (value: string) => {
  const cleanValue = value.replace(/\D/g, "").slice(0, 11);

  return cleanValue
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatPhone = (value: string) => {
  const cleanValue = value.replace(/\D/g, "").slice(0, 11);

  if (cleanValue.length <= 10) {
    return cleanValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return cleanValue
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidCpf = (cpf: string) => {
  const cleanCpf = cpf.replace(/\D/g, "");

  if (cleanCpf.length !== 11 || /^(\d)\1+$/.test(cleanCpf)) return false;

  const calcDigit = (base: string, factor: number) => {
    let total = 0;

    for (const digit of base) {
      total += Number(digit) * factor;
      factor -= 1;
    }

    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return (
    calcDigit(cleanCpf.slice(0, 9), 10) === Number(cleanCpf[9]) &&
    calcDigit(cleanCpf.slice(0, 10), 11) === Number(cleanCpf[10])
  );
};

const asArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? value : [];

const API_URL =
  window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? "http://localhost:3333"
    : import.meta.env.VITE_API_URL ||
    "https://zeladoria-coopatos-api.onrender.com";

const categoryIcons: Record<string, React.ReactNode> = {
  Hídrico: <Droplets className="w-4 h-4" />,
  Elétrico: <Zap className="w-4 h-4" />,
  Erosão: <Mountain className="w-4 h-4" />,
  Segurança: <Shield className="w-4 h-4" />,
  Vegetação: <TreePine className="w-4 h-4" />,
  Outros: <HelpCircle className="w-4 h-4" />,
  Outro: <HelpCircle className="w-4 h-4" />,
};

const statusColors: Record<string, string> = {
  ABERTO: "bg-red-100 text-red-700 border-red-200",
  EM_ANALISE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  EM_ANDAMENTO: "bg-blue-100 text-blue-700 border-blue-200",
  FINALIZADO: "bg-green-100 text-green-700 border-green-200",
};

const priorityOptions = [
  {
    value: "BAIXA",
    label: "Baixa",
    className: "bg-green-500",
    badge: "border-green-200 bg-green-50 text-green-700",
  },
  {
    value: "MEDIA",
    label: "Média",
    className: "bg-yellow-500",
    badge: "border-yellow-200 bg-yellow-50 text-yellow-700",
  },
  {
    value: "ALTA",
    label: "Alta",
    className: "bg-orange-500",
    badge: "border-orange-200 bg-orange-50 text-orange-700",
  },
  {
    value: "CRITICA",
    label: "Crítica",
    className: "bg-red-500",
    badge: "border-red-200 bg-red-50 text-red-700",
  },
];

const priorityBarColor = (report: AdminReport) => {
  return (
    priorityOptions.find((priority) => priority.value === report.priority)
      ?.className || "bg-yellow-500"
  );
};

const priorityLabel = (priority?: string | null) =>
  priorityOptions.find((item) => item.value === priority)?.label || "Média";

const priorityBadgeClass = (priority?: string | null) =>
  priorityOptions.find((item) => item.value === priority)?.badge ||
  "border-yellow-200 bg-yellow-50 text-yellow-700";

const chartPalette = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0f766e",
];

const reportExportColumns: {
  id: ReportExportColumn;
  label: string;
  getValue: (report: AdminReport) => string | number;
}[] = [
  { id: "id", label: "ID", getValue: (report) => report.id },
  { id: "title", label: "Título", getValue: (report) => report.title || "" },
  { id: "category", label: "Categoria", getValue: (report) => report.category.name },
  { id: "status", label: "Status", getValue: (report) => report.status.name },
  { id: "priority", label: "Prioridade", getValue: (report) => priorityLabel(report.priority) },
  { id: "employee", label: "Aberto por", getValue: (report) => report.employee?.name || "" },
  {
    id: "participants",
    label: "Atribuídos",
    getValue: (report) =>
      report.participants?.map((participant) => participant.employee.name).join("; ") || "",
  },
  { id: "address", label: "Endereço", getValue: (report) => report.address || "" },
  {
    id: "referencePoint",
    label: "Ponto de referência",
    getValue: (report) => report.referencePoint || "",
  },
  {
    id: "createdAt",
    label: "Criado em",
    getValue: (report) => new Date(report.createdAt).toLocaleString("pt-BR"),
  },
  {
    id: "description",
    label: "Descrição",
    getValue: (report) => report.description || "",
  },
];

const analyticsExportSections: { id: AnalyticsExportSection; label: string }[] = [
  { id: "summary", label: "Resumo executivo" },
  { id: "status", label: "Status" },
  { id: "priority", label: "Prioridades" },
  { id: "categories", label: "Categorias" },
  { id: "employees", label: "Produção individual" },
  { id: "departments", label: "Departamentos" },
  { id: "monthly", label: "Evolução mensal" },
  { id: "locations", label: "Locais recorrentes" },
];

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    brandPreset,
    saveBrandPreset: persistBrandPreset,
    resetBrandPreset: restoreBrandPreset,
  } = useBranding();

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeForm, setEmployeeForm] =
    useState<EmployeeForm>(emptyEmployeeForm);
  const [employeeFormErrors, setEmployeeFormErrors] =
    useState<EmployeeFormErrors>({});
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [departmentStatusFilter, setDepartmentStatusFilter] = useState("active");
  const [departmentForm, setDepartmentForm] =
    useState<DepartmentForm>(emptyDepartmentForm);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(
    null
  );
  const [savingDepartment, setSavingDepartment] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("active");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userDepartmentFilter, setUserDepartmentFilter] = useState("all");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [verificationNow, setVerificationNow] = useState(Date.now());
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [statuses, setStatuses] = useState<{ id: number; name: string }[]>([]);

  const [adminSection, setAdminSection] = useState<AdminSection>("reports");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("home");
  const [brandForm, setBrandForm] = useState<BrandForm>(() =>
    createBrandForm(brandPreset)
  );

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState<ReportForm>(emptyReportForm);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [savingReport, setSavingReport] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
  const [assigningReport, setAssigningReport] = useState(false);
  const [assignEmployeeIds, setAssignEmployeeIds] = useState<string[]>([]);
  const [reportParticipantIds, setReportParticipantIds] = useState<string[]>([]);
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [reportPreviews, setReportPreviews] = useState<string[]>([]);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [expandedMedia, setExpandedMedia] = useState<{
    items: { mediaUrl: string; resourceType?: string | null }[];
    index: number;
  } | null>(null);
  const [gettingReportLocation, setGettingReportLocation] = useState(false);
  const [geocodingReport, setGeocodingReport] = useState(false);
  const [reportCep, setReportCep] = useState("");
  const [uploadingReportMedia, setUploadingReportMedia] = useState(false);
  const [showAnalyticsExportModal, setShowAnalyticsExportModal] = useState(false);
  const [showReportExportModal, setShowReportExportModal] = useState(false);
  const [selectedAnalyticsSections, setSelectedAnalyticsSections] = useState<
    AnalyticsExportSection[]
  >(analyticsExportSections.map((section) => section.id));
  const [selectedReportColumns, setSelectedReportColumns] = useState<
    ReportExportColumn[]
  >([
    "id",
    "title",
    "category",
    "status",
    "priority",
    "employee",
    "participants",
    "address",
    "createdAt",
  ]);

  const admin = JSON.parse(localStorage.getItem("admin") || "{}");
  const adminHeaders = (extra?: Record<string, string>) => ({
    "X-Admin-Id": String(admin?.id || ""),
    "X-Admin-Session-Token": localStorage.getItem("adminSessionToken") || "",
    ...extra,
  });

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    const adminWelcomeShown = localStorage.getItem("adminWelcomeShown");

    if (!auth.isAuthenticated || auth.role !== "admin") {
      navigate("/admin/login", { replace: true });
      return;
    }

    if (admin?.email && adminWelcomeShown !== "true") {
      toast({
        title: `✓ Bem-vindo, ${admin.employee?.name || admin.email}!`,
        description: "Acesso administrativo realizado com sucesso.",
        className: "bg-secondary text-secondary-foreground border-secondary",
        duration: 3000,
      });

      localStorage.setItem("adminWelcomeShown", "true");
    }
  }, [navigate, toast]);

  useEffect(() => {
    const loadAdminData = async () => {
      setLoadingReports(true);

      try {
        const [
          reportsResponse,
          categoriesResponse,
          statusesResponse,
          employeesResponse,
          departmentsResponse,
          usersResponse,
        ] =
          await Promise.all([
            fetch(`${API_URL}/reports`),
            fetch(`${API_URL}/categories`),
            fetch(`${API_URL}/statuses`),
            fetch(`${API_URL}/admin/employees`, {
              headers: adminHeaders(),
            }),
            fetch(`${API_URL}/admin/departments`, {
              headers: adminHeaders(),
            }),
            fetch(`${API_URL}/admin/users`, {
              headers: adminHeaders(),
            }),
          ]);

        const [
          reportsData,
          categoriesData,
          statusesData,
          employeesData,
          departmentsData,
          usersData,
        ] = await Promise.all([
          reportsResponse.json(),
          categoriesResponse.json(),
          statusesResponse.json(),
          employeesResponse.json(),
          departmentsResponse.json(),
          usersResponse.json(),
        ]);

        setReports(asArray<AdminReport>(reportsData));
        setCategories(asArray<{ id: number; name: string }>(categoriesData));
        setStatuses(asArray<{ id: number; name: string }>(statusesData));
        setEmployees(asArray<AdminEmployee>(employeesData));
        setDepartments(asArray<AdminDepartment>(departmentsData));
        setUsers(asArray<AdminUser>(usersData));

        if (!employeesResponse.ok || !Array.isArray(employeesData)) {
          toast({
            title: "Funcionários não carregaram",
            description:
              employeesData?.error ||
              "Reinicie o backend para carregar as novas rotas do admin.",
            variant: "destructive",
          });
        }

        if (!departmentsResponse.ok || !Array.isArray(departmentsData)) {
          toast({
            title: "Departamentos não carregaram",
            description:
              departmentsData?.error ||
              "Publique a API atualizada no Render para carregar departamentos.",
            variant: "destructive",
          });
        }

        if (!usersResponse.ok || !Array.isArray(usersData)) {
          toast({
            title: "Usuários não carregaram",
            description:
              usersData?.error ||
              "Publique a API atualizada no Render para carregar usuários.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(error);

        toast({
          title: "Erro ao carregar dados administrativos",
          variant: "destructive",
        });
      } finally {
        setLoadingReports(false);
      }
    };

    loadAdminData();
  }, [toast]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVerificationNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
    const employeeId = currentAdmin?.employee?.id;

    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      query: employeeId
        ? {
          employeeId,
          sessionToken:
            sessionStorage.getItem("adminSessionToken") ||
            localStorage.getItem("adminSessionToken") ||
            "",
        }
        : undefined,
    });

    const finishAdminSession = (message: string) => {
      sessionStorage.setItem("adminForcedLogout", message);
      logout();
      sessionStorage.setItem("adminForcedLogout", message);
      navigate("/admin/login", { replace: true });
    };

    socket.on("employee-verification-updated", (employee: AdminEmployee) => {
      setEmployees((prev) =>
        prev.map((item) => (item.id === employee.id ? employee : item))
      );
      toast({
        title: "E-mail validado",
        description: `${employee.name} validou o acesso.`,
      });
    });

    socket.on(
      "force-logout",
      (data: { reason?: string; sessionToken?: string; role?: string }) => {
        const currentToken =
          sessionStorage.getItem("adminSessionToken") ||
          localStorage.getItem("adminSessionToken");

        if (data.role && data.role !== "admin") return;
        if (data.sessionToken && data.sessionToken === currentToken) return;

        finishAdminSession(
          data.reason || "Sua conta administrativa foi acessada em outro local."
        );
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [logout, navigate, toast]);

  useEffect(() => {
    const validateAdminSession = async () => {
      try {
        const currentAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
        const localToken =
          sessionStorage.getItem("adminSessionToken") ||
          localStorage.getItem("adminSessionToken");

        if (!currentAdmin?.id || !localToken) return;

        const response = await fetch(`${API_URL}/admin-session/${currentAdmin.id}`);
        const data = await response.json();

        if (
          !response.ok ||
          !data.isAdministrativeDepartment ||
          (data.activeSessionToken && data.activeSessionToken !== localToken)
        ) {
          sessionStorage.setItem(
            "adminForcedLogout",
            "Sua sessão administrativa foi encerrada ou aberta em outro dispositivo."
          );
          logout();
          sessionStorage.setItem(
            "adminForcedLogout",
            "Sua sessão administrativa foi encerrada ou aberta em outro dispositivo."
          );
          navigate("/admin/login", { replace: true });
        }
      } catch (error) {
        console.error(error);
      }
    };

    validateAdminSession();
    const interval = window.setInterval(validateAdminSession, 10000);

    return () => window.clearInterval(interval);
  }, [logout, navigate]);

  useEffect(() => {
    setBrandForm(createBrandForm(brandPreset));
  }, [brandPreset]);

  const saveBrandCustomization = () => {
    const nextPreset = {
      ...brandPreset,
      appName: brandForm.appName.trim() || defaultBrandPreset.appName,
      shortName: brandForm.shortName.trim() || defaultBrandPreset.shortName,
      organizationName:
        brandForm.organizationName.trim() || defaultBrandPreset.organizationName,
      adminTitle: brandForm.adminTitle.trim() || defaultBrandPreset.adminTitle,
      tagline: brandForm.tagline.trim() || defaultBrandPreset.tagline,
      logoSrc: brandForm.logoSrc.trim() || defaultBrandPreset.logoSrc,
      faviconSrc: brandForm.logoSrc.trim() || defaultBrandPreset.faviconSrc,
      colors: {
        ...brandPreset.colors,
        background: hexToHslString(brandForm.background),
        card: hexToHslString("#ffffff"),
        primary: hexToHslString(brandForm.primary),
        ring: hexToHslString(brandForm.primary),
        sidebarBackground: hexToHslString(brandForm.primary),
        sidebarBorder: hexToHslString(brandForm.primary),
        secondary: hexToHslString(brandForm.secondary),
        sidebarPrimary: hexToHslString(brandForm.secondary),
        accent: hexToHslString(brandForm.secondary),
      },
    };

    persistBrandPreset(nextPreset);
    toast({
      title: "Personalização aplicada",
      description: "Nome, logo e cores foram atualizados no site.",
      duration: 3000,
    });
  };

  const resetBrandCustomization = () => {
    const defaultPreset = restoreBrandPreset();
    setBrandForm(createBrandForm(defaultPreset));
    toast({
      title: "Personalização restaurada",
      description: "O padrão original da Coopatos voltou a ser usado.",
      duration: 3000,
    });
  };

  const getVerificationCooldown = (employee: AdminEmployee) => {
    if (!employee.emailVerificationSentAt) return 0;

    const elapsed = Math.floor(
      (verificationNow -
        new Date(employee.emailVerificationSentAt).getTime()) /
      1000
    );

    return Math.max(0, 120 - elapsed);
  };

  const filtered = useMemo(() => {
    let result = [...reports];

    if (filterCategory !== "all") {
      result = result.filter((r) => String(r.category.id) === filterCategory);
    }

    if (filterStatus !== "all") {
      result = result.filter((r) => String(r.status.id) === filterStatus);
    }

    if (filterEmployee !== "all") {
      result = result.filter(
        (r) =>
          String(r.employee?.id) === filterEmployee ||
          r.participants?.some(
            (participant) => String(participant.employeeId) === filterEmployee
          )
      );
    }

    if (filterPeriod === "custom") {
      const start = filterStartDate
        ? new Date(`${filterStartDate}T00:00:00`).getTime()
        : null;
      const end = filterEndDate
        ? new Date(`${filterEndDate}T23:59:59`).getTime()
        : null;

      result = result.filter((r) => {
        const createdAt = new Date(r.createdAt).getTime();
        if (start && createdAt < start) return false;
        if (end && createdAt > end) return false;
        return true;
      });
    } else if (filterPeriod !== "all") {
      const days = Number(filterPeriod);
      const since = Date.now() - days * 24 * 60 * 60 * 1000;

      result = result.filter(
        (r) => new Date(r.createdAt).getTime() >= since
      );
    }

    if (filterLocation.trim()) {
      const search = filterLocation.toLowerCase();

      result = result.filter(
        (r) =>
          r.referencePoint?.toLowerCase().includes(search) ||
          r.address?.toLowerCase().includes(search) ||
          r.description?.toLowerCase().includes(search) ||
          r.title?.toLowerCase().includes(search) ||
          r.employee?.name?.toLowerCase().includes(search) ||
          String(r.id).includes(search)
      );
    }

    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }, [
    reports,
    filterCategory,
    filterStatus,
    filterEmployee,
    filterPeriod,
    filterStartDate,
    filterEndDate,
    filterLocation,
  ]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      open: filtered.filter((r) => r.status.name === "ABERTO").length,
      inProgress: filtered.filter((r) => r.status.name === "EM_ANDAMENTO")
        .length,
      done: filtered.filter((r) => r.status.name === "FINALIZADO").length,
    }),
    [filtered]
  );

  const filteredEmployees = useMemo(() => {
    const search = employeeSearch.toLowerCase().trim();

    return employees.filter((employee) => {
      if (!search) return true;

      return (
        employee.name.toLowerCase().includes(search) ||
        employee.registrationNumber.toLowerCase().includes(search) ||
        employee.cpf.includes(search.replace(/\D/g, "")) ||
        employee.email?.toLowerCase().includes(search) ||
        employee.department?.toLowerCase().includes(search)
      );
    });
  }, [employees, employeeSearch]);

  const employeeStats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((employee) => !employee.deletedAt).length,
      inactive: employees.filter((employee) => employee.deletedAt).length,
      departments: new Set(
        employees
          .map((employee) => employee.department)
          .filter(Boolean)
      ).size,
    }),
    [employees]
  );

  const filteredDepartments = useMemo(() => {
    const search = departmentSearch.toLowerCase().trim();

    return departments.filter((department) => {
      const matchesStatus =
        departmentStatusFilter === "all" ||
        (departmentStatusFilter === "active" && department.active) ||
        (departmentStatusFilter === "inactive" && !department.active);

      if (!matchesStatus) return false;
      if (!search) return true;

      return (
        department.name.toLowerCase().includes(search) ||
        department.description?.toLowerCase().includes(search)
      );
    });
  }, [departments, departmentSearch, departmentStatusFilter]);

  const filteredUsers = useMemo(() => {
    const search = userSearch.toLowerCase().trim();

    return users.filter((user) => {
      const matchesStatus =
        userStatusFilter === "all" ||
        (userStatusFilter === "active" && !user.deletedAt) ||
        (userStatusFilter === "inactive" && user.deletedAt);
      const matchesRole = userRoleFilter === "all" || user.role === userRoleFilter;
      const matchesDepartment =
        userDepartmentFilter === "all" ||
        user.employee?.department === userDepartmentFilter;
      const matchesSearch =
        !search ||
        user.email.toLowerCase().includes(search) ||
        user.employee?.name.toLowerCase().includes(search) ||
        user.employee?.registrationNumber.toLowerCase().includes(search);

      return matchesStatus && matchesRole && matchesDepartment && matchesSearch;
    });
  }, [users, userSearch, userStatusFilter, userRoleFilter, userDepartmentFilter]);

  const departmentStats = useMemo(
    () => ({
      total: departments.length,
      active: departments.filter((department) => department.active).length,
      inactive: departments.filter((department) => !department.active).length,
      withEmployees: departments.filter((department) =>
        employees.some((employee) => employee.department === department.name)
      ).length,
    }),
    [departments, employees]
  );

  const departmentOptions = useMemo(
    () => {
      const fromDepartments = departments
        .filter((department) => department.active)
        .map((department) => department.name);
      const fromEmployees = employees
        .map((employee) => employee.department)
        .filter(Boolean) as string[];

      return Array.from(new Set([...fromDepartments, ...fromEmployees])).sort();
    },
    [departments, employees]
  );

  const assignedEmployeeOptions = useMemo(
    () =>
      [...employees]
        .filter((employee) =>
          reports.some(
            (report) =>
              report.employee?.id === employee.id ||
              report.participants?.some(
                (participant) => participant.employeeId === employee.id
              )
          )
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [employees, reports]
  );

  const analytics = useMemo(() => {
    const sourceReports = filtered;
    const completedReports = sourceReports.filter(
      (report) => report.status.name === "FINALIZADO"
    );
    const pendingReports = sourceReports.filter(
      (report) => report.status.name !== "FINALIZADO"
    );
    const completionRate = sourceReports.length
      ? Math.round((completedReports.length / sourceReports.length) * 100)
      : 0;
    const openCriticalReports = sourceReports.filter(
      (report) => report.status.name !== "FINALIZADO" && report.priority === "CRITICA"
    );
    const reportsWithMedia = sourceReports.filter(
      (report) => (report.images?.length || 0) > 0
    );
    const averageAgeDays = pendingReports.length
      ? Math.round(
        pendingReports.reduce(
          (total, report) =>
            total +
            (Date.now() - new Date(report.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
          0
        ) / pendingReports.length
      )
      : 0;

    const statusData = statuses.map((status, index) => ({
      name: status.name.replace(/_/g, " "),
      value: sourceReports.filter((report) => report.status.id === status.id).length,
      color: status.color || chartPalette[index % chartPalette.length],
    }));

    const priorityData = priorityOptions.map((priority, index) => ({
      name: priority.label,
      value: sourceReports.filter((report) => report.priority === priority.value).length,
      color: chartPalette[index % chartPalette.length],
    }));

    const categoryData = categories
      .map((category, index) => ({
        name: category.name,
        value: sourceReports.filter((report) => report.category.id === category.id).length,
        color: chartPalette[index % chartPalette.length],
      }))
      .filter((item) => item.value > 0);

    const monthlyMap = new Map<string, { month: string; abertos: number; finalizados: number }>();
    sourceReports.forEach((report) => {
      const date = new Date(report.createdAt);
      const month = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(
        date.getFullYear()
      ).slice(-2)}`;
      const current = monthlyMap.get(month) || {
        month,
        abertos: 0,
        finalizados: 0,
      };

      current.abertos += 1;
      if (report.status.name === "FINALIZADO") current.finalizados += 1;
      monthlyMap.set(month, current);
    });

    const monthlyData = Array.from(monthlyMap.values()).slice(-8);

    const employeeData = employees
      .map((employee) => {
        const assigned = sourceReports.filter(
          (report) =>
            report.employee?.id === employee.id ||
            report.participants?.some(
              (participant) => participant.employeeId === employee.id
            )
        );

        return {
          name: employee.name.split(" ").slice(0, 2).join(" "),
          total: assigned.length,
          finalizados: assigned.filter(
            (report) => report.status.name === "FINALIZADO"
          ).length,
        };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const departmentData = departmentOptions
      .map((department) => {
        const team = employees.filter(
          (employee) => employee.department === department
        );
        const teamIds = new Set(team.map((employee) => employee.id));
        const assigned = sourceReports.filter(
          (report) =>
            teamIds.has(report.employee?.id) ||
            report.participants?.some((participant) =>
              teamIds.has(participant.employeeId)
            )
        );

        return {
          name: department,
          equipe: team.length,
          chamados: assigned.length,
          finalizados: assigned.filter(
            (report) => report.status.name === "FINALIZADO"
          ).length,
        };
      })
      .filter((item) => item.equipe > 0 || item.chamados > 0)
      .sort((a, b) => b.chamados - a.chamados)
      .slice(0, 8);

    const locationMap = new Map<string, number>();
    sourceReports.forEach((report) => {
      const location =
        report.referencePoint || report.address || "Local não informado";
      locationMap.set(location, (locationMap.get(location) || 0) + 1);
    });
    const locationData = Array.from(locationMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      completedReports,
      pendingReports,
      openCriticalReports,
      reportsWithMedia,
      completionRate,
      averageAgeDays,
      statusData,
      priorityData,
      categoryData,
      monthlyData,
      employeeData,
      departmentData,
      locationData,
    };
  }, [categories, departmentOptions, employees, filtered, statuses]);

  const loadEmployees = async () => {
    setLoadingEmployees(true);

    try {
      const response = await fetch(`${API_URL}/admin/employees`, {
        headers: adminHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao carregar funcionários",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      if (!Array.isArray(data)) {
        toast({
          title: "Funcionários não carregaram",
          description:
            data?.error ||
            "Reinicie o backend para carregar as novas rotas do admin.",
          variant: "destructive",
        });
        setEmployees([]);
        return;
      }

      setEmployees(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao carregar funcionários",
        variant: "destructive",
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  const startEditingEmployee = (employee: AdminEmployee) => {
    setEditingEmployeeId(employee.id);
    setEmployeeForm({
      registrationNumber: employee.registrationNumber,
      name: employee.name,
      email: employee.email || "",
      cpf: formatCpf(employee.cpf),
      phone: employee.phone ? formatPhone(employee.phone) : "",
      avatarUrl: employee.avatarUrl || "",
      birthDate: employee.birthDate ? employee.birthDate.slice(0, 10) : "",
      department: employee.department || "",
    });
    setShowEmployeeModal(true);
  };

  const openNewEmployeeModal = () => {
    resetEmployeeForm();
    setShowEmployeeModal(true);
  };

  const resetEmployeeForm = () => {
    setEditingEmployeeId(null);
    setEmployeeForm(emptyEmployeeForm);
    setEmployeeFormErrors({});
  };

  const validateEmployeeForm = () => {
    const errors: EmployeeFormErrors = {};

    if (!employeeForm.name.trim()) {
      errors.name = "Informe o nome completo.";
    }

    if (!employeeForm.registrationNumber.trim()) {
      errors.registrationNumber = "Informe a matrícula.";
    }

    if (!employeeForm.email.trim()) {
      errors.email = "E-mail é obrigatório.";
    } else if (!isValidEmail(employeeForm.email.trim())) {
      errors.email = "Informe um e-mail válido.";
    }

    if (!isValidCpf(employeeForm.cpf)) {
      errors.cpf = "Informe um CPF válido.";
    }

    const phoneDigits = employeeForm.phone.replace(/\D/g, "");
    if (phoneDigits && phoneDigits.length < 10) {
      errors.phone = "Informe um telefone com DDD.";
    }

    setEmployeeFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const saveEmployee = async () => {
    if (!validateEmployeeForm()) {
      toast({
        title: "Revise os dados do funcionário",
        description: "Existem campos obrigatórios ou inválidos.",
        variant: "destructive",
      });
      return;
    }

    setSavingEmployee(true);

    try {
      const response = await fetch(
        editingEmployeeId
          ? `${API_URL}/admin/employees/${editingEmployeeId}`
          : `${API_URL}/admin/employees`,
        {
          method: editingEmployeeId ? "PATCH" : "POST",
          headers: adminHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            ...employeeForm,
            cpf: employeeForm.cpf.replace(/\D/g, ""),
            phone: employeeForm.phone.replace(/\D/g, ""),
            email: employeeForm.email.trim().toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao salvar funcionário",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setEmployees((prev) =>
        editingEmployeeId
          ? prev.map((employee) =>
            employee.id === editingEmployeeId ? data : employee
          )
          : [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      );

      resetEmployeeForm();
      setShowEmployeeModal(false);

      toast({
        title: editingEmployeeId
          ? "Funcionário atualizado"
          : "Funcionário criado",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setSavingEmployee(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true);

    try {
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

      if (!response.ok || !data.secure_url) {
        toast({
          title: "Erro ao enviar foto",
          description: data.error?.message || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setEmployeeForm((prev) => ({
        ...prev,
        avatarUrl: data.secure_url,
      }));
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao enviar foto",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const resendVerification = async (employee: AdminEmployee) => {
    const sentAt = new Date().toISOString();

    setEmployees((prev) =>
      prev.map((item) =>
        item.id === employee.id
          ? {
            ...item,
            emailVerificationSentAt: sentAt,
          }
          : item
      )
    );

    try {
      const response = await fetch(
        `${API_URL}/admin/employees/${employee.id}/send-verification`,
        {
          method: "POST",
          headers: adminHeaders(),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setEmployees((prev) =>
          prev.map((item) =>
            item.id === employee.id
              ? {
                ...item,
                emailVerificationSentAt: employee.emailVerificationSentAt,
              }
              : item
          )
        );

        toast({
          title: "Erro ao reenviar validação",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setEmployees((prev) =>
        prev.map((item) => (item.id === employee.id ? data : item))
      );

      toast({
        title: "E-mail de validação enviado",
        description: employee.email
          ? `Enviado para ${employee.email}.`
          : undefined,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    }
  };

  const toggleEmployeeStatus = async (employee: AdminEmployee) => {
    const active = Boolean(employee.deletedAt);

    try {
      const response = await fetch(
        `${API_URL}/admin/employees/${employee.id}/status`,
        {
          method: "PATCH",
          headers: adminHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ active }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao alterar status",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setEmployees((prev) =>
        prev.map((item) => (item.id === employee.id ? data : item))
      );

      toast({
        title: active ? "Funcionário restaurado" : "Funcionário desativado",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    }
  };

  const resetDepartmentForm = () => {
    setEditingDepartmentId(null);
    setDepartmentForm(emptyDepartmentForm);
  };

  const openNewDepartmentModal = () => {
    resetDepartmentForm();
    setShowDepartmentModal(true);
  };

  const startEditingDepartment = (department: AdminDepartment) => {
    setEditingDepartmentId(department.id);
    setDepartmentForm({
      name: department.name,
      description: department.description || "",
      color: department.color || "#2563eb",
      active: department.active,
    });
    setShowDepartmentModal(true);
  };

  const saveDepartment = async () => {
    if (!departmentForm.name.trim()) {
      toast({
        title: "Informe o nome do departamento",
        variant: "destructive",
      });
      return;
    }

    setSavingDepartment(true);

    try {
      const response = await fetch(
        editingDepartmentId
          ? `${API_URL}/admin/departments/${editingDepartmentId}`
          : `${API_URL}/admin/departments`,
        {
          method: editingDepartmentId ? "PATCH" : "POST",
          headers: adminHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(departmentForm),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao salvar departamento",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setDepartments((prev) =>
        editingDepartmentId
          ? prev.map((department) =>
            department.id === editingDepartmentId ? data : department
          )
          : [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      );
      resetDepartmentForm();
      setShowDepartmentModal(false);
      toast({
        title: editingDepartmentId
          ? "Departamento atualizado"
          : "Departamento criado",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setSavingDepartment(false);
    }
  };

  const toggleDepartmentStatus = async (department: AdminDepartment) => {
    try {
      const response = await fetch(
        `${API_URL}/admin/departments/${department.id}`,
        {
          method: "PATCH",
          headers: adminHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            name: department.name,
            description: department.description || "",
            color: department.color || "#2563eb",
            active: !department.active,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao alterar departamento",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setDepartments((prev) =>
        prev.map((item) => (item.id === department.id ? data : item))
      );
      toast({
        title: data.active ? "Departamento reativado" : "Departamento desativado",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    }
  };

  const changeEmployeeDepartment = async (
    employeeId: number,
    department: string
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/admin/employees/${employeeId}/department`,
        {
          method: "PATCH",
          headers: adminHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ department }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao mudar departamento",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setEmployees((prev) =>
        prev.map((employee) => (employee.id === data.id ? data : employee))
      );
      setUsers((prev) =>
        prev.map((user) =>
          user.employee?.id === data.id
            ? { ...user, employee: { ...user.employee, department: data.department } }
            : user
        )
      );
      toast({
        title: "Departamento atualizado",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (user: AdminUser) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: adminHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ active: Boolean(user.deletedAt) }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao alterar usuário",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setUsers((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      toast({
        title: data.deletedAt ? "Usuário desativado" : "Usuário restaurado",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    }
  };

  const openAuditLogs = async () => {
    setShowAuditModal(true);
    setLoadingAuditLogs(true);

    try {
      const response = await fetch(`${API_URL}/admin/audit-logs?limit=200`, {
        headers: adminHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao carregar auditoria",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setAuditLogs(asArray<AuditLog>(data));
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const exportAdminCsv = async (type: "employees" | "reports" | "audit") => {
    try {
      const response = await fetch(`${API_URL}/admin/exports/${type}`, {
        headers: adminHeaders(),
      });

      if (!response.ok) {
        toast({
          title: "Planilha ainda não disponível",
          description:
            "A API de produção precisa estar atualizada no Render para liberar este arquivo.",
          variant: "destructive",
        });
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename =
        response.headers
          .get("content-disposition")
          ?.match(/filename="(.+)"/)?.[1] || `${type}.csv`;

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao baixar planilha",
        variant: "destructive",
      });
    }
  };

  const escapeClientCsvValue = (value: unknown) => {
    const text = value == null ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const exportFilteredReportsCsv = () => {
    if (selectedReportColumns.length === 0) {
      toast({
        title: "Selecione ao menos uma coluna",
        variant: "destructive",
      });
      return;
    }

    const columns = reportExportColumns.filter((column) =>
      selectedReportColumns.includes(column.id)
    );
    const csv = [
      columns.map((column) => escapeClientCsvValue(column.label)).join(","),
      ...filtered.map((report) =>
        columns.map((column) => escapeClientCsvValue(column.getValue(report))).join(",")
      ),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `chamados-filtrados-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setShowReportExportModal(false);
  };

  const toggleReportExportColumn = (column: ReportExportColumn) => {
    setSelectedReportColumns((prev) =>
      prev.includes(column)
        ? prev.filter((item) => item !== column)
        : [...prev, column]
    );
  };

  const toggleAnalyticsExportSection = (section: AnalyticsExportSection) => {
    setSelectedAnalyticsSections((prev) =>
      prev.includes(section)
        ? prev.filter((item) => item !== section)
        : [...prev, section]
    );
  };

  const openReportsByStatus = (statusName?: string) => {
    if (!statusName) {
      setFilterStatus("all");
    } else {
      const status = statuses.find((item) => item.name === statusName);
      setFilterStatus(status ? String(status.id) : "all");
    }

    setAdminSection("reports");
  };

  const formatFiltersForExport = () => {
    const category =
      filterCategory === "all"
        ? "Todas"
        : categories.find((item) => String(item.id) === filterCategory)?.name ||
        "Selecionada";
    const status =
      filterStatus === "all"
        ? "Todos"
        : statuses.find((item) => String(item.id) === filterStatus)?.name ||
        "Selecionado";
    const employee =
      filterEmployee === "all"
        ? "Todos"
        : employees.find((item) => String(item.id) === filterEmployee)?.name ||
        "Selecionado";
    const period =
      filterPeriod === "custom"
        ? `${filterStartDate || "início"} até ${filterEndDate || "hoje"}`
        : filterPeriod === "all"
          ? "Todo período"
          : `Últimos ${filterPeriod} dias`;

    return { category, status, employee, period };
  };

  const renderPrintList = (items: { name: string; value: number }[]) =>
    items.length
      ? items
        .map(
          (item) => `
            <div class="row">
              <span>${item.name}</span>
              <strong>${item.value}</strong>
            </div>
          `
        )
        .join("")
      : `<p class="empty">Sem dados para este filtro.</p>`;

  const exportAnalyticsPdf = () => {
    if (selectedAnalyticsSections.length === 0) {
      toast({
        title: "Selecione ao menos um indicador",
        variant: "destructive",
      });
      return;
    }

    const filters = formatFiltersForExport();
    const printWindow = window.open("", "_blank", "width=1100,height=800");

    if (!printWindow) {
      toast({
        title: "Popup bloqueado",
        description: "Libere popups para gerar o PDF.",
        variant: "destructive",
      });
      return;
    }

    const section = (id: AnalyticsExportSection, html: string) =>
      selectedAnalyticsSections.includes(id) ? html : "";

    printWindow.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Indicadores - ${brandPreset.appName}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; font-family: Arial, sans-serif; color: #1f3557; background: #f4f7fb; }
            header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
            header img { width: 76px; height: 76px; object-fit: contain; }
            h1 { margin: 0; font-size: 28px; }
            h2 { margin: 0 0 12px; font-size: 18px; }
            .muted { color: #62708a; font-size: 13px; }
            .filters { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
            .filter, .card, .panel { background: #fff; border: 1px solid #dbe3ef; border-radius: 16px; padding: 14px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
            .two { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 16px; }
            .card small { display: block; color: #62708a; text-transform: uppercase; font-size: 11px; }
            .card strong { display: block; margin-top: 8px; font-size: 30px; color: #1f3557; }
            .row { display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid #edf1f7; font-size: 13px; }
            .row:last-child { border-bottom: 0; }
            .empty { color: #62708a; font-size: 13px; }
            @media print { body { background: #fff; padding: 20px; } .panel, .card, .filter { break-inside: avoid; } }
          </style>
        </head>
        <body>
          <header>
            <img src="${brandPreset.logoSrc}" alt="" />
            <div>
              <h1>Indicadores de chamados</h1>
              <div class="muted">${brandPreset.organizationName} • ${new Date().toLocaleString("pt-BR")}</div>
            </div>
          </header>
          <section class="filters">
            <div class="filter"><strong>Categoria</strong><br /><span class="muted">${filters.category}</span></div>
            <div class="filter"><strong>Status</strong><br /><span class="muted">${filters.status}</span></div>
            <div class="filter"><strong>Funcionário</strong><br /><span class="muted">${filters.employee}</span></div>
            <div class="filter"><strong>Período</strong><br /><span class="muted">${filters.period}</span></div>
          </section>
          ${section(
      "summary",
      `<section class="grid">
              <div class="card"><small>Total filtrado</small><strong>${filtered.length}</strong></div>
              <div class="card"><small>Conclusão</small><strong>${analytics.completionRate}%</strong></div>
              <div class="card"><small>Pendentes críticos</small><strong>${analytics.openCriticalReports.length}</strong></div>
              <div class="card"><small>Idade média pendente</small><strong>${analytics.averageAgeDays}d</strong></div>
            </section>`
    )}
          <section class="two">
            ${section("status", `<div class="panel"><h2>Status</h2>${renderPrintList(analytics.statusData)}</div>`)}
            ${section("priority", `<div class="panel"><h2>Prioridades</h2>${renderPrintList(analytics.priorityData)}</div>`)}
            ${section("categories", `<div class="panel"><h2>Categorias</h2>${renderPrintList(analytics.categoryData)}</div>`)}
            ${section("locations", `<div class="panel"><h2>Locais recorrentes</h2>${renderPrintList(analytics.locationData)}</div>`)}
            ${section("employees", `<div class="panel"><h2>Produção individual</h2>${renderPrintList(analytics.employeeData.map((item) => ({ name: item.name, value: item.total })))}</div>`)}
            ${section("departments", `<div class="panel"><h2>Departamentos</h2>${renderPrintList(analytics.departmentData.map((item) => ({ name: item.name, value: item.chamados })))}</div>`)}
            ${section("monthly", `<div class="panel"><h2>Evolução mensal</h2>${renderPrintList(analytics.monthlyData.map((item) => ({ name: item.month, value: item.abertos })))}</div>`)}
          </section>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 400);
    setShowAnalyticsExportModal(false);
  };

  const formatVerificationSentAt = (value?: string | null) => {
    if (!value) return null;

    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const upsertReportInState = (report: AdminReport) => {
    setReports((prev) => {
      const exists = prev.some((item) => item.id === report.id);

      if (exists) {
        return prev.map((item) => (item.id === report.id ? report : item));
      }

      return [report, ...prev];
    });
    setSelectedReport((prev) => (prev?.id === report.id ? report : prev));
  };

  const resetReportForm = () => {
    setEditingReportId(null);
    setReportForm(emptyReportForm);
    setReportParticipantIds([]);
    setReportFiles([]);
    setReportPreviews([]);
    setReportCep("");
  };

  const openNewReportModal = () => {
    setSelectedReport(null);
    resetReportForm();
    setShowReportModal(true);
  };

  const openEditReportModal = (report: AdminReport) => {
    setSelectedReport(null);
    setEditingReportId(report.id);
    setReportForm({
      employeeId: String(report.employee?.id || ""),
      categoryId: String(report.category?.id || ""),
      statusId: String(report.status?.id || ""),
      priority: report.priority || "MEDIA",
      title: report.title || "",
      description: report.description || "",
      referencePoint: report.referencePoint || "",
      address: report.address || "",
      latitude: report.latitude == null ? "" : String(report.latitude),
      longitude: report.longitude == null ? "" : String(report.longitude),
    });
    setReportParticipantIds(
      (report.participants || []).map((participant) =>
        String(participant.employeeId)
      )
    );
    setShowReportModal(true);
  };

  const toggleReportParticipant = (employeeId: number) => {
    setReportParticipantIds((prev) =>
      prev.includes(String(employeeId))
        ? prev.filter((id) => id !== String(employeeId))
        : [...prev, String(employeeId)]
    );
  };

  const toggleAssignEmployee = (employeeId: number) => {
    setAssignEmployeeIds((prev) =>
      prev.includes(String(employeeId))
        ? prev.filter((id) => id !== String(employeeId))
        : [...prev, String(employeeId)]
    );
  };

  const formatAddressFromNominatim = (data: any) => {
    const road = data.address?.road || data.address?.pedestrian || "";
    const suburb =
      data.address?.suburb ||
      data.address?.neighbourhood ||
      data.address?.city_district ||
      "";
    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      "";
    const state = data.address?.state || "";

    return [road, suburb, city, state].filter(Boolean).join(", ");
  };

  const getReportLocation = () => {
    setGettingReportLocation(true);

    if (!navigator.geolocation) {
      setGettingReportLocation(false);
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

        setReportForm((prev) => ({
          ...prev,
          latitude: String(latitude),
          longitude: String(longitude),
        }));

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const addressText = formatAddressFromNominatim(data);

          if (addressText) {
            setReportForm((prev) => ({
              ...prev,
              address: addressText,
            }));
          }

          toast({
            title: "Localização capturada",
            description: addressText || "Coordenadas adicionadas ao chamado.",
          });
        } catch {
          toast({
            title: "Localização capturada",
            description: "Coordenadas adicionadas ao chamado.",
          });
        } finally {
          setGettingReportLocation(false);
        }
      },
      () => {
        setGettingReportLocation(false);
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

  const fillReportAddressByCep = async () => {
    const cleanCep = reportCep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      toast({
        title: "CEP inválido",
        description: "Informe um CEP com 8 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setGeocodingReport(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          variant: "destructive",
        });
        return;
      }

      const addressText = [
        data.logradouro,
        data.bairro,
        data.localidade,
        data.uf,
      ]
        .filter(Boolean)
        .join(", ");

      setReportForm((prev) => ({
        ...prev,
        address: addressText,
      }));

      toast({
        title: "Endereço preenchido",
        description: addressText,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao buscar CEP",
        variant: "destructive",
      });
    } finally {
      setGeocodingReport(false);
    }
  };

  const geocodeReportAddress = async () => {
    if (!reportForm.address.trim()) {
      toast({
        title: "Informe um endereço",
        variant: "destructive",
      });
      return;
    }

    setGeocodingReport(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          reportForm.address
        )}&limit=1`
      );
      const data = await response.json();

      if (!data || data.length === 0) {
        toast({
          title: "Endereço não encontrado",
          description: "Tente informar rua, número, bairro e cidade.",
          variant: "destructive",
        });
        return;
      }

      setReportForm((prev) => ({
        ...prev,
        address: data[0].display_name,
        latitude: String(Number(data[0].lat)),
        longitude: String(Number(data[0].lon)),
      }));

      toast({
        title: "Endereço localizado",
        description: "Coordenadas preenchidas automaticamente.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao localizar endereço",
        variant: "destructive",
      });
    } finally {
      setGeocodingReport(false);
    }
  };

  const uploadReportMediaToCloudinary = async (file: File) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      throw new Error(data.error?.message || "Erro ao enviar mídia.");
    }

    return {
      imageUrl: data.secure_url,
      publicId: data.public_id,
      resourceType: data.resource_type || "image",
    };
  };

  const handleReportFiles = (files: File[]) => {
    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);

    if (oversizedFile) {
      toast({
        title: "Arquivo muito grande",
        description: "Cada arquivo deve ter no máximo 100 MB.",
        variant: "destructive",
      });
      return;
    }

    setReportFiles(files);
    setReportPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const downloadMedia = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const extension = url.includes(".mp4")
        ? "mp4"
        : url.includes(".webm")
          ? "webm"
          : url.includes(".png")
            ? "png"
            : "jpg";
      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = `chamado-midia.${extension}`;
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

  const saveReport = async () => {
    setSavingReport(true);

    try {
      const mediaItems =
        !editingReportId && reportFiles.length
          ? await Promise.all(
            reportFiles.map((file) => uploadReportMediaToCloudinary(file))
          )
          : [];
      const response = await fetch(
        editingReportId
          ? `${API_URL}/admin/reports/${editingReportId}`
          : `${API_URL}/admin/reports`,
        {
          method: editingReportId ? "PATCH" : "POST",
          headers: adminHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            ...reportForm,
            participantIds: reportParticipantIds.map(Number),
            mediaItems,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: editingReportId
            ? "Erro ao atualizar chamado"
            : "Erro ao criar chamado",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      upsertReportInState(data);
      resetReportForm();
      setShowReportModal(false);

      toast({
        title: editingReportId ? "Chamado atualizado" : "Chamado criado",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setSavingReport(false);
    }
  };

  const deleteReport = async (report: AdminReport) => {
    const confirmed = window.confirm(
      `Excluir definitivamente o chamado #${report.id}? Essa ação remove mensagens, anotações, mídias e notificações vinculadas.`
    );

    if (!confirmed) return;

    setDeletingReportId(report.id);

    try {
      const response = await fetch(`${API_URL}/admin/reports/${report.id}`, {
        method: "DELETE",
        headers: adminHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao excluir chamado",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setReports((prev) => prev.filter((item) => item.id !== report.id));
      setSelectedReport(null);

      toast({
        title: "Chamado excluído",
        description: `Chamado #${report.id} removido do sistema.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setDeletingReportId(null);
    }
  };

  const assignEmployeeToReport = async (report: AdminReport) => {
    if (assignEmployeeIds.length === 0) {
      toast({
        title: "Selecione pelo menos um funcionário",
        variant: "destructive",
      });
      return;
    }

    setAssigningReport(true);

    try {
      const createdParticipants = await Promise.all(
        assignEmployeeIds.map(async (employeeId) => {
          const response = await fetch(
            `${API_URL}/reports/${report.id}/participants`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ employeeId: Number(employeeId) }),
            }
          );
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Erro ao atribuir funcionário.");
          }

          return data;
        })
      );

      const updatedReport = {
        ...report,
        participants: [
          ...(report.participants || []).filter(
            (participant) =>
              !assignEmployeeIds.includes(String(participant.employeeId))
          ),
          ...createdParticipants.map((participant) => ({
            id: participant.id,
            employeeId: participant.employeeId,
            employee: participant.employee,
          })),
        ],
      };

      upsertReportInState(updatedReport);
      setAssignEmployeeIds([]);
      toast({
        title: "Funcionários atribuídos",
        description: `${createdParticipants.length} participante(s) adicionados.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao atribuir funcionário",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setAssigningReport(false);
    }
  };

  const addMediaToSelectedReport = async (files: File[]) => {
    if (!selectedReport || files.length === 0) return;

    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);

    if (oversizedFile) {
      toast({
        title: "Arquivo muito grande",
        description: "Cada arquivo deve ter no máximo 100 MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingReportMedia(true);

    try {
      const mediaItems = await Promise.all(
        files.map((file) => uploadReportMediaToCloudinary(file))
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
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao adicionar mídia",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      upsertReportInState(data);
      setDetailImageIndex(Math.max(0, data.images.length - mediaItems.length));
      toast({
        title: "Mídia adicionada",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao enviar mídia",
        variant: "destructive",
      });
    } finally {
      setUploadingReportMedia(false);
    }
  };

  const removeSelectedReportMedia = async () => {
    const image = selectedReport?.images?.[detailImageIndex];

    if (!selectedReport || !image) return;

    try {
      const response = await fetch(`${API_URL}/report-images/${image.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao remover mídia",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const updatedReport = {
        ...selectedReport,
        images: (selectedReport.images || []).filter(
          (item) => item.id !== image.id
        ),
      };

      upsertReportInState(updatedReport);
      setDetailImageIndex(0);
      toast({
        title: "Mídia removida",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    }
  };

  const adminMenu = [
    { id: "analytics", label: "Indicadores", icon: BarChart3 },
    { id: "reports", label: "Chamados", icon: ClipboardList },
    { id: "maps", label: "Mapa", icon: MapIcon },
    { id: "settings", label: "Configurações", icon: Settings },
  ] as const;

  const settingsMenu = [
    { id: "home", label: "Resumo", icon: Settings },
    { id: "personalization", label: "Personalização", icon: Pencil },
    { id: "employees", label: "Funcionários", icon: Users },
    { id: "users", label: "Usuários", icon: UserCog },
    { id: "departments", label: "Departamentos", icon: Building2 },
    { id: "audit", label: "Auditoria", icon: History },
  ] as const;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="gradient-primary sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo
            imageClassName="h-14 w-14 rounded-xl object-contain sm:h-20 sm:w-20"
          />

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-primary-foreground sm:text-xl">
              {brandPreset.shortName}
            </h1>
            <p className="truncate text-xs text-primary-foreground/60 sm:text-sm">
              {brandPreset.adminTitle} • {brandPreset.organizationName}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/admin/login", { replace: true });
          }}
          className="flex shrink-0 items-center gap-1 text-sm text-primary-foreground/70 hover:text-primary-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </header>

      <div className="sticky top-[80px] z-10 border-b border-border/60 bg-background/80 backdrop-blur-xl sm:top-[112px]">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3">
          <div className="flex min-w-max gap-2 rounded-2xl bg-muted/40 p-1">
            {adminMenu.map((item) => {
              const Icon = item.icon;
              const active = adminSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAdminSection(item.id)}
                  className={`group relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 sm:px-4 ${active
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
                    }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"
                      }`}
                  />

                  {item.label}

                  {active && (
                    <motion.span
                      layoutId="adminActiveLine"
                      className="absolute inset-x-4 -bottom-1 h-0.5 rounded-full bg-primary"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl p-4 lg:p-6">
        {adminSection === "settings" && (
          <div className="mb-5 rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {settingsMenu.map((item) => {
                const Icon = item.icon;
                const active = settingsTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSettingsTab(item.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {adminSection === "analytics" ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-bold">Indicadores</p>
                  <p className="text-sm text-muted-foreground">
                    Gráficos e métricas usam os filtros abaixo.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAnalyticsExportModal(true)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={String(status.id)}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pessoa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas pessoas</SelectItem>
                    {assignedEmployeeOptions.map((employee) => (
                      <SelectItem key={employee.id} value={String(employee.id)}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo período</SelectItem>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="180">Últimos 180 dias</SelectItem>
                    <SelectItem value="365">Últimos 365 dias</SelectItem>
                    <SelectItem value="custom">Período personalizado</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  value={filterLocation}
                  onChange={(event) => setFilterLocation(event.target.value)}
                  placeholder="Local, descrição ou ID..."
                />
              </div>

              {filterPeriod === "custom" && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:w-[420px]">
                  <Input
                    type="date"
                    value={filterStartDate}
                    onChange={(event) => setFilterStartDate(event.target.value)}
                  />
                  <Input
                    type="date"
                    value={filterEndDate}
                    onChange={(event) => setFilterEndDate(event.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Chamados totais",
                  value: filtered.length,
                  detail: `${filtered.length} no filtro atual`,
                  action: () => openReportsByStatus(),
                },
                {
                  label: "Concluídos",
                  value: analytics.completedReports.length,
                  detail: `${analytics.completionRate}% de conclusão`,
                  action: () => openReportsByStatus("FINALIZADO"),
                },
                {
                  label: "Pendentes",
                  value: analytics.pendingReports.length,
                  detail: "Abertos, análise ou andamento",
                  action: () => openReportsByStatus("ABERTO"),
                },
                {
                  label: "Críticos pendentes",
                  value: analytics.openCriticalReports.length,
                  detail: "Prioridade crítica ainda não finalizada",
                  action: () => {
                    setFilterStatus("all");
                    setAdminSection("reports");
                  },
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-md"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-primary">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  label: "Idade média pendente",
                  value: `${analytics.averageAgeDays}d`,
                  detail: "Tempo médio dos chamados ainda abertos",
                },
                {
                  label: "Com mídia",
                  value: analytics.reportsWithMedia.length,
                  detail: "Chamados filtrados com foto, vídeo ou anexo",
                },
                {
                  label: "Locais recorrentes",
                  value: analytics.locationData.length,
                  detail: "Pontos com registros agrupados no filtro",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-primary">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Evolução mensal</p>
                    <p className="text-xs text-muted-foreground">
                      Chamados abertos e finalizados por mês.
                    </p>
                  </div>
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="abertos"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="finalizados"
                        stroke="#16a34a"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Distribuição por status</p>
                    <p className="text-xs text-muted-foreground">
                      Percentual operacional atual.
                    </p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.statusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={92}
                        paddingAngle={3}
                      >
                        {analytics.statusData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color || chartPalette[index % chartPalette.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm font-semibold">Produção individual</p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Ranking dos funcionários mais envolvidos em chamados.
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.employeeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={96} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#2563eb" radius={[0, 8, 8, 0]} />
                      <Bar dataKey="finalizados" fill="#16a34a" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm font-semibold">Produção por departamento</p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Volume de chamados por equipe e taxa de conclusão.
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.departmentData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="chamados" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="finalizados" fill="#16a34a" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm font-semibold">Categorias com mais demanda</p>
                <div className="mt-4 space-y-3">
                  {analytics.categoryData.slice(0, 6).map((item) => (
                    <div key={item.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.max(
                              8,
                              (item.value / Math.max(1, filtered.length)) * 100
                            )}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm font-semibold">Prioridade dos chamados</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {analytics.priorityData.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-xl border border-border bg-background p-3"
                    >
                      <div
                        className="mb-3 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <p className="text-xs text-muted-foreground">{item.name}</p>
                      <p className="text-2xl font-bold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm font-semibold">Locais com recorrência</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {analytics.locationData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sem dados de local para os filtros atuais.
                  </p>
                ) : (
                  analytics.locationData.map((item) => (
                    <div key={item.name}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{item.name}</span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-secondary"
                          style={{
                            width: `${Math.max(
                              8,
                              (item.value / Math.max(1, filtered.length)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : adminSection === "reports" ? (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                {
                  label: "Total",
                  value: stats.total,
                  color: "text-primary",
                  action: () => openReportsByStatus(),
                },
                {
                  label: "Abertos",
                  value: stats.open,
                  color: "text-red-700",
                  action: () => openReportsByStatus("ABERTO"),
                },
                {
                  label: "Em andamento",
                  value: stats.inProgress,
                  color: "text-blue-700",
                  action: () => openReportsByStatus("EM_ANDAMENTO"),
                },
                {
                  label: "Finalizados",
                  value: stats.done,
                  color: "text-green-700",
                  action: () => openReportsByStatus("FINALIZADO"),
                },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={s.action}
                  className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-md"
                >
                  <p className="mb-1 text-xs text-muted-foreground">
                    {s.label}
                  </p>
                  <p className={`text-2xl font-bold ${s.color}`}>
                    {s.value}
                  </p>
                </button>
              ))}
            </div>

            <div className="mb-4 flex min-w-0 flex-col gap-3 lg:flex-row">
              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  onClick={openNewReportModal}
                  className="justify-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  <Plus className="h-4 w-4" />
                  Novo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowReportExportModal(true)}
                  className="justify-center gap-1"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar
                </Button>
              </div>

              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="h-9 w-full text-sm lg:w-[170px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <span className="flex items-center gap-2">
                          {categoryIcons[c.name] || (
                            <HelpCircle className="h-4 w-4" />
                          )}
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 w-full text-sm lg:w-[170px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                  <SelectTrigger className="h-9 w-full text-sm lg:w-[220px]">
                    <SelectValue placeholder="Funcionário atribuído" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos funcionários</SelectItem>
                    {assignedEmployeeOptions.map((employee) => (
                      <SelectItem key={employee.id} value={String(employee.id)}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="h-9 w-full text-sm lg:w-[170px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo período</SelectItem>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="180">Últimos 180 dias</SelectItem>
                    <SelectItem value="365">Últimos 365 dias</SelectItem>
                    <SelectItem value="custom">Período personalizado</SelectItem>
                  </SelectContent>
                </Select>

                {filterPeriod === "custom" && (
                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto">
                    <Input
                      type="date"
                      value={filterStartDate}
                      onChange={(event) => setFilterStartDate(event.target.value)}
                      className="h-9 w-full text-sm lg:w-[150px]"
                    />
                    <Input
                      type="date"
                      value={filterEndDate}
                      onChange={(event) => setFilterEndDate(event.target.value)}
                      className="h-9 w-full text-sm lg:w-[150px]"
                    />
                  </div>
                )}

                <Input
                  placeholder="Buscar chamado, local ou funcionário..."
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="h-9 w-full text-sm lg:w-[280px]"
                />
              </div>
            </div>

            {loadingReports ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                Carregando chamados...
              </div>
            ) : (
              <div className="space-y-2">
                <p className="mb-2 text-xs text-muted-foreground">
                  {filtered.length} ocorrência(s) encontradas
                </p>

                {filtered.map((report, i) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => {
                      setDetailImageIndex(0);
                      setAssignEmployeeIds([]);
                      setSelectedReport(report);
                    }}
                    className="group cursor-pointer rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-lg"
                  >
                    <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                      <div className="flex w-8 shrink-0 flex-col items-center gap-1">
                        <div
                          className={`h-8 w-2 rounded-full ${priorityBarColor(
                            report
                          )}`}
                        />
                        <span className="text-[10px] font-bold text-muted-foreground">
                          #{report.id}
                        </span>
                      </div>

                      <img
                        src={
                          report.images?.[0]?.imageUrl || "/placeholder.svg"
                        }
                        alt=""
                        className="hidden h-14 w-14 flex-shrink-0 rounded-xl object-cover sm:block"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                          <span className="shrink-0 text-primary">
                            {categoryIcons[report.category.name] || (
                              <HelpCircle className="h-4 w-4" />
                            )}
                          </span>

                          <span className="min-w-0 max-w-full truncate text-sm font-semibold">
                            {report.title || report.category.name}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            #{report.id}
                          </span>
                        </div>

                        <p className="truncate text-xs text-muted-foreground">
                          {report.description ||
                            report.referencePoint ||
                            report.address ||
                            "Sem descrição"}
                        </p>

                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                          <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="min-w-0 break-words">
                              {report.referencePoint ||
                                report.address ||
                                "Local não informado"}
                            </span>
                          </span>

                          <span className="text-[11px] text-muted-foreground">
                            Aberto por{" "}
                            {report.employee?.name || "Funcionário"}
                          </span>

                          <span className="text-[11px] text-muted-foreground">
                            {new Date(report.createdAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`ml-auto shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs sm:px-3 ${statusColors[report.status.name] ||
                          "border-border bg-muted text-muted-foreground"
                          }`}
                      >
                        {report.status.name}
                      </span>
                      <span
                        className={`hidden whitespace-nowrap rounded-full border px-3 py-1 text-xs sm:inline-flex ${priorityBadgeClass(
                          report.priority
                        )}`}
                      >
                        {priorityLabel(report.priority)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : adminSection === "maps" ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold">Mapa operacional</p>
                <p className="text-xs text-muted-foreground">
                  Pins de chamados e mapa de calor com os mesmos filtros da lista.
                </p>
              </div>
              <Button
                type="button"
                onClick={openNewReportModal}
                className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                <Plus className="h-4 w-4" />
                Novo chamado
              </Button>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 lg:flex lg:flex-wrap">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-9 w-full text-sm lg:w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 w-full text-sm lg:w-[170px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={String(status.id)}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="h-9 w-full text-sm lg:w-[220px]">
                  <SelectValue placeholder="Funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos funcionários</SelectItem>
                  {assignedEmployeeOptions.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Buscar local ou chamado..."
                value={filterLocation}
                onChange={(event) => setFilterLocation(event.target.value)}
                className="h-9 w-full text-sm lg:w-[280px]"
              />
            </div>

            <DashboardMaps
              reports={filtered}
              onSelectReport={(report) => {
                setDetailImageIndex(0);
                setAssignEmployeeIds([]);
                setSelectedReport(report);
              }}
            />
          </div>
        ) : adminSection === "settings" && settingsTab === "employees" ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Total", value: employeeStats.total },
                { label: "Ativos", value: employeeStats.active },
                { label: "Inativos", value: employeeStats.inactive },
                { label: "Departamentos", value: employeeStats.departments },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <p className="mb-1 text-xs text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Funcionários</p>
                    <p className="text-xs text-muted-foreground">
                      {filteredEmployees.length} registro(s) encontrados
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={employeeSearch}
                        onChange={(event) => setEmployeeSearch(event.target.value)}
                        placeholder="Buscar nome, matrícula, CPF..."
                        className="pl-9 lg:w-[320px]"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => exportAdminCsv("employees")}
                      className="gap-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Exportar
                    </Button>
                    <Button
                      type="button"
                      onClick={openNewEmployeeModal}
                      className="gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Novo funcionário
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {loadingEmployees ? (
                    <p className="p-4 text-sm text-muted-foreground">
                      Carregando funcionários...
                    </p>
                  ) : filteredEmployees.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">
                      Nenhum funcionário encontrado.
                    </p>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex flex-col gap-3 p-4 transition hover:bg-muted/30 lg:flex-row lg:items-center"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary/10 text-secondary">
                          {employee.avatarUrl ? (
                            <img
                              src={employee.avatarUrl.replace(
                                "/upload/",
                                "/upload/w_160,h_160,c_fill,q_auto,f_auto/"
                              )}
                              alt={employee.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Users className="h-6 w-6" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold">
                              {employee.name}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${employee.deletedAt
                                  ? "bg-red-50 text-red-700"
                                  : "bg-green-50 text-green-700"
                                }`}
                            >
                              {employee.deletedAt ? "Inativo" : "Ativo"}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${employee.emailVerifiedAt
                                  ? "bg-green-50 text-green-700"
                                  : "bg-amber-50 text-amber-700"
                                }`}
                            >
                              {employee.emailVerifiedAt ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <AlertCircle className="h-3 w-3" />
                              )}
                              {employee.emailVerifiedAt ? "Validado" : "Pendente"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Matrícula {employee.registrationNumber} • CPF {employee.cpf}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {employee.email || "Sem e-mail"} •{" "}
                            {employee.department || "Sem departamento"}
                          </p>
                          {employee.birthDate && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Nascimento:{" "}
                              {new Date(employee.birthDate).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                          {!employee.emailVerifiedAt &&
                            employee.emailVerificationSentAt && (
                              <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                                <Mail className="h-3 w-3" />
                                Validação enviada em{" "}
                                {formatVerificationSentAt(
                                  employee.emailVerificationSentAt
                                )}
                              </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-muted px-2.5 py-1">
                            {employee._count?.reports || 0} chamados
                          </span>
                          <span className="rounded-full bg-muted px-2.5 py-1">
                            {employee._count?.participations || 0} participações
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => startEditingEmployee(employee)}
                            className="gap-1"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Button>
                          {employee.email && !employee.emailVerifiedAt && (() => {
                            const cooldown = getVerificationCooldown(employee);

                            return (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={cooldown > 0}
                                onClick={() => resendVerification(employee)}
                                className="gap-1 border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-70"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                {cooldown > 0 ? `${cooldown}s` : "Validar"}
                              </Button>
                            );
                          })()}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleEmployeeStatus(employee)}
                            className={`gap-1 ${employee.deletedAt
                                ? "border-green-200 text-green-700 hover:bg-green-50"
                                : "border-red-200 text-red-700 hover:bg-red-50"
                              }`}
                          >
                            {employee.deletedAt ? (
                              <RotateCcw className="h-3.5 w-3.5" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            {employee.deletedAt ? "Restaurar" : "Desativar"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
            </div>
          </div>
        ) : adminSection === "settings" && settingsTab === "users" ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border p-4">
                <div>
                  <p className="text-sm font-semibold">Usuários</p>
                  <p className="text-xs text-muted-foreground">
                    {filteredUsers.length} usuário(s) encontrados
                  </p>
                </div>

                <div className="grid gap-2 md:grid-cols-4">
                  <div className="relative md:col-span-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Buscar e-mail, nome, matrícula..."
                      className="pl-9"
                    />
                  </div>
                  <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Desativados</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos perfis</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="EMPLOYEE">Funcionário</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={userDepartmentFilter}
                    onValueChange={setUserDepartmentFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos departamentos</SelectItem>
                      {departmentOptions.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    Nenhum usuário encontrado.
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">
                            {user.email}
                          </p>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {user.role}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${user.deletedAt
                                ? "bg-red-50 text-red-700"
                                : "bg-green-50 text-green-700"
                              }`}
                          >
                            {user.deletedAt ? "Desativado" : "Ativo"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {user.employee?.name || "Sem funcionário vinculado"} •{" "}
                          {user.employee?.department || "Sem departamento"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {user.employee && (
                          <Select
                            value={user.employee.department || "none"}
                            onValueChange={(value) =>
                              changeEmployeeDepartment(
                                user.employee!.id,
                                value === "none" ? "" : value
                              )
                            }
                          >
                            <SelectTrigger className="h-9 w-[210px]">
                              <SelectValue placeholder="Departamento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem departamento</SelectItem>
                              {departmentOptions.map((department) => (
                                <SelectItem key={department} value={department}>
                                  {department}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user)}
                          className={`gap-1 ${user.deletedAt
                              ? "border-green-200 text-green-700 hover:bg-green-50"
                              : "border-red-200 text-red-700 hover:bg-red-50"
                            }`}
                        >
                          {user.deletedAt ? (
                            <RotateCcw className="h-3.5 w-3.5" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          {user.deletedAt ? "Restaurar" : "Desativar"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : adminSection === "settings" && settingsTab === "departments" ? (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Departamentos", value: departmentStats.total },
                { label: "Ativos", value: departmentStats.active },
                { label: "Inativos", value: departmentStats.inactive },
                { label: "Com funcionários", value: departmentStats.withEmployees },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <p className="mb-1 text-xs text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold">Departamentos</p>
                  <p className="text-xs text-muted-foreground">
                    Áreas usadas para filtros, cadastro e indicadores.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={departmentSearch}
                      onChange={(event) => setDepartmentSearch(event.target.value)}
                      placeholder="Buscar departamento..."
                      className="pl-9 lg:w-[320px]"
                    />
                  </div>
                  <Select
                    value={departmentStatusFilter}
                    onValueChange={setDepartmentStatusFilter}
                  >
                    <SelectTrigger className="sm:w-[170px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Desativados</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={openNewDepartmentModal}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Novo departamento
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredDepartments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum departamento encontrado.
                  </p>
                ) : (
                  filteredDepartments.map((department) => {
                    const teamCount = employees.filter(
                      (employee) => employee.department === department.name
                    ).length;
                    const reportCount = reports.filter(
                      (report) =>
                        report.employee?.department === department.name ||
                        report.participants?.some(
                          (participant) =>
                            participant.employee.department === department.name
                        )
                    ).length;

                    return (
                      <div
                        key={department.id}
                        className="rounded-2xl border border-border bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="h-10 w-2 rounded-full"
                              style={{ backgroundColor: department.color || "#2563eb" }}
                            />
                            <div>
                              <p className="font-semibold">{department.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {department.active ? "Ativo" : "Inativo"}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${department.active
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                              }`}
                          >
                            {department.active ? "Ativo" : "Inativo"}
                          </span>
                        </div>

                        <p className="mt-3 min-h-10 text-sm text-muted-foreground">
                          {department.description || "Sem descrição cadastrada."}
                        </p>

	                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-muted px-2.5 py-1">
                            {teamCount} funcionário(s)
                          </span>
                          <span className="rounded-full bg-muted px-2.5 py-1">
                            {reportCount} chamado(s)
	                          </span>
	                        </div>

                        <div className="mt-4 space-y-2 rounded-xl border border-border bg-card/60 p-3">
                          <p className="text-xs font-semibold text-muted-foreground">
                            Funcionários deste departamento
                          </p>
                          {employees.filter(
                            (employee) => employee.department === department.name
                          ).length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Nenhum funcionário vinculado.
                            </p>
                          ) : (
                            employees
                              .filter((employee) => employee.department === department.name)
                              .slice(0, 4)
                              .map((employee) => (
                                <div
                                  key={employee.id}
                                  className="flex items-center justify-between gap-2 text-xs"
                                >
                                  <span className="truncate">{employee.name}</span>
                                  <Select
                                    value={employee.department || "none"}
                                    onValueChange={(value) =>
                                      changeEmployeeDepartment(
                                        employee.id,
                                        value === "none" ? "" : value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Sem depto.</SelectItem>
                                      {departmentOptions.map((item) => (
                                        <SelectItem key={item} value={item}>
                                          {item}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))
                          )}
                        </div>

	                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => startEditingDepartment(department)}
                            className="gap-1"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleDepartmentStatus(department)}
                            className={`gap-1 ${department.active
                                ? "border-red-200 text-red-700 hover:bg-red-50"
                                : "border-green-200 text-green-700 hover:bg-green-50"
                              }`}
                          >
                            {department.active ? (
                              <Trash2 className="h-3.5 w-3.5" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                            {department.active ? "Desativar" : "Reativar"}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : adminSection === "settings" && settingsTab === "personalization" ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-5">
                <p className="text-lg font-bold">Personalização whitelabel</p>
                <p className="text-sm text-muted-foreground">
                  Altere nome, logo e cores principais. A mudança aparece no login,
                  painel administrativo e área do funcionário.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["appName", "Nome do sistema"],
                  ["shortName", "Nome curto"],
                  ["organizationName", "Organização"],
                  ["adminTitle", "Título administrativo"],
                  ["tagline", "Frase do login"],
                  ["logoSrc", "URL/caminho da logo"],
                ].map(([key, label]) => (
                  <label key={key} className="space-y-1.5 text-sm font-medium">
                    {label}
                    <Input
                      value={brandForm[key as keyof BrandForm]}
                      onChange={(event) =>
                        setBrandForm((prev) => ({
                          ...prev,
                          [key]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["primary", "Cor principal"],
                  ["secondary", "Cor de destaque"],
                  ["background", "Fundo"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="rounded-2xl border border-border bg-background p-3 text-sm font-medium"
                  >
                    {label}
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="color"
                        value={brandForm[key as keyof BrandForm]}
                        onChange={(event) =>
                          setBrandForm((prev) => ({
                            ...prev,
                            [key]: event.target.value,
                          }))
                        }
                        className="h-10 w-12 rounded-lg border border-border bg-transparent"
                      />
                      <Input
                        value={brandForm[key as keyof BrandForm]}
                        onChange={(event) =>
                          setBrandForm((prev) => ({
                            ...prev,
                            [key]: event.target.value,
                          }))
                        }
                        className="h-10"
                      />
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={saveBrandCustomization}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Aplicar personalização
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetBrandCustomization}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurar padrão
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm font-semibold">Prévia rápida</p>
              <div
                className="mt-4 rounded-3xl p-5 text-white shadow-lg"
                style={{ backgroundColor: brandForm.primary }}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={brandForm.logoSrc || defaultBrandPreset.logoSrc}
                    alt=""
                    className="h-16 w-16 rounded-2xl bg-white/10 object-contain p-1"
                  />
                  <div>
                    <p className="text-xl font-bold">{brandForm.shortName}</p>
                    <p className="text-sm text-white/75">
                      {brandForm.adminTitle} • {brandForm.organizationName}
                    </p>
                  </div>
                </div>
                <div
                  className="mt-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold"
                  style={{ backgroundColor: brandForm.secondary }}
                >
                  {brandForm.tagline || "Sempre presente!"}
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Nesta versão a personalização fica salva neste navegador. Para
                produção multiempresa, o próximo passo é persistir o preset no banco.
              </p>
            </div>
          </div>
        ) : adminSection === "settings" && settingsTab === "audit" ? (
          <div className="grid gap-4 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => setShowAnalyticsExportModal(true)}
              className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <BarChart3 className="mb-3 h-6 w-6 text-primary" />
              <p className="font-semibold">PDF de indicadores</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha quais blocos entram no relatório visual.
              </p>
            </button>
            <button
              type="button"
              onClick={openAuditLogs}
              className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <History className="mb-3 h-6 w-6 text-primary" />
              <p className="font-semibold">Visualizar auditoria</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Veja ações, edições, atribuições e alterações registradas.
              </p>
            </button>
            <button
              type="button"
              onClick={() => exportAdminCsv("audit")}
              className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Download className="mb-3 h-6 w-6 text-primary" />
              <p className="font-semibold">Baixar auditoria</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Exporte os registros para planilha CSV.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setShowReportExportModal(true)}
              className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <FileSpreadsheet className="mb-3 h-6 w-6 text-primary" />
              <p className="font-semibold">Planilha de chamados</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Exporte chamados filtrados por categoria, pessoa, status, local e período.
              </p>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="text-lg font-bold">Configurações administrativas</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Áreas de gestão ficam aqui para o painel abrir limpo em Chamados
                e Mapa durante a apresentação.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {settingsMenu
                .filter((item) => item.id !== "home")
                .map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSettingsTab(item.id)}
                      className="group rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-md"
                    >
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-105">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.id === "personalization"
                          ? "Nome, logo, cores e reversão para o padrão."
                          : item.id === "analytics"
                            ? "Gráficos de produtividade e indicadores."
                            : item.id === "employees"
                              ? "Cadastro, validação, filtros e status."
                              : item.id === "users"
                                ? "Acessos, perfis e usuários desativados."
                                : item.id === "departments"
                                  ? "Departamentos, vínculos e equipes."
                                  : "Visualizar e baixar registros do sistema."}
                      </p>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showAuditModal && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 36, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="modal-max-h-90 w-full max-w-4xl overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Auditoria</h2>
                    <p className="text-xs text-muted-foreground">
                      Últimas alterações registradas no sistema.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => exportAdminCsv("audit")}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowAuditModal(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="modal-max-h-72 overflow-y-auto p-4">
                {loadingAuditLogs ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando auditoria...
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum registro de auditoria encontrado.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-2xl border border-border bg-background p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                              {log.action}
                            </span>
                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                              {log.entityType}
                              {log.entityId ? ` #${log.entityId}` : ""}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-medium">{log.summary}</p>
                        {log.metadata ? (
                          <pre className="mt-3 max-h-32 overflow-auto rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showDepartmentModal && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowDepartmentModal(false);
              resetDepartmentForm();
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 36, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-xl rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">
                      {editingDepartmentId
                        ? "Editar departamento"
                        : "Novo departamento"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Organização operacional e indicadores.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDepartmentModal(false);
                    resetDepartmentForm();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 p-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Nome
                  </label>
                  <Input
                    value={departmentForm.name}
                    onChange={(event) =>
                      setDepartmentForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Ex: Administrativo"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Descrição
                  </label>
                  <Input
                    value={departmentForm.description}
                    onChange={(event) =>
                      setDepartmentForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Responsabilidades principais da área"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Cor do indicador
                    </label>
                    <Input
                      type="color"
                      value={departmentForm.color}
                      onChange={(event) =>
                        setDepartmentForm((prev) => ({
                          ...prev,
                          color: event.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </div>
                  <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={departmentForm.active}
                      onChange={(event) =>
                        setDepartmentForm((prev) => ({
                          ...prev,
                          active: event.target.checked,
                        }))
                      }
                    />
                    Ativo
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDepartmentModal(false);
                      resetDepartmentForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={saveDepartment}
                    disabled={savingDepartment}
                    className="gap-2"
                  >
                    {savingDepartment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showReportModal && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 36, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="modal-max-h-92 w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">
                      {editingReportId ? "Editar chamado" : "Novo chamado"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Dados, localização, status e responsável.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Título
                  </label>
                  <Input
                    value={reportForm.title}
                    onChange={(event) =>
                      setReportForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Ex: Vazamento próximo ao bloco 2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Responsável
                  </label>
                  <Select
                    value={reportForm.employeeId || "none"}
                    onValueChange={(value) =>
                      setReportForm((prev) => ({
                        ...prev,
                        employeeId: value === "none" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={String(employee.id)}>
                          {employee.name}
                          {employee.deletedAt ? " (inativo)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Categoria
                  </label>
                  <Select
                    value={reportForm.categoryId || "none"}
                    onValueChange={(value) =>
                      setReportForm((prev) => ({
                        ...prev,
                        categoryId: value === "none" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  <Select
                    value={reportForm.statusId || "none"}
                    onValueChange={(value) =>
                      setReportForm((prev) => ({
                        ...prev,
                        statusId: value === "none" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status inicial" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Usar aberto</SelectItem>
                      {statuses.map((status) => (
                        <SelectItem key={status.id} value={String(status.id)}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Prioridade
                  </label>
                  <Select
                    value={reportForm.priority || "MEDIA"}
                    onValueChange={(value) =>
                      setReportForm((prev) => ({
                        ...prev,
                        priority: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Ponto de referência
                  </label>
                  <Input
                    value={reportForm.referencePoint}
                    onChange={(event) =>
                      setReportForm((prev) => ({
                        ...prev,
                        referencePoint: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Localização
                  </label>
                  <div className="rounded-2xl border border-border bg-muted/20 p-3">
                    <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                      <Input
                        value={reportForm.address}
                        onChange={(event) =>
                          setReportForm((prev) => ({
                            ...prev,
                            address: event.target.value,
                          }))
                        }
                        placeholder="Digite rua, número, bairro e cidade"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={geocodeReportAddress}
                        disabled={geocodingReport}
                        className="gap-2"
                      >
                        {geocodingReport ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                        Encontrar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getReportLocation}
                        disabled={gettingReportLocation}
                        className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                      >
                        {gettingReportLocation ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Navigation className="h-4 w-4" />
                        )}
                        GPS
                      </Button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Input
                        value={reportCep}
                        onChange={(event) => setReportCep(event.target.value)}
                        placeholder="CEP para preencher endereço"
                        inputMode="numeric"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={fillReportAddressByCep}
                        disabled={geocodingReport}
                      >
                        Buscar CEP
                      </Button>
                    </div>

                    {(reportForm.latitude || reportForm.longitude) && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Coordenadas: {reportForm.latitude || "-"} /{" "}
                        {reportForm.longitude || "-"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Atribuir participantes
                  </label>
                  <div className="grid max-h-44 gap-2 overflow-y-auto rounded-2xl border border-border bg-muted/20 p-2 sm:grid-cols-2">
                    {employees.map((employee) => {
                      const selected = reportParticipantIds.includes(
                        String(employee.id)
                      );

                      return (
                        <button
                          key={employee.id}
                          type="button"
                          onClick={() => toggleReportParticipant(employee.id)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${selected
                            ? "border-secondary bg-secondary/10 text-primary"
                            : "border-border bg-card hover:bg-muted"
                            }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {employee.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {employee.department || "Sem departamento"}
                              {employee.deletedAt ? " • inativo" : ""}
                            </span>
                          </span>
                          {selected && (
                            <CheckCircle className="h-4 w-4 text-secondary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!editingReportId && (
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Mídias do chamado
                    </label>
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-center transition hover:bg-muted">
                      <ImageIcon className="mb-2 h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Adicionar fotos ou vídeos
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Pode selecionar mais de um arquivo.
                      </span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(event) =>
                          handleReportFiles(Array.from(event.target.files || []))
                        }
                      />
                    </label>

                    {reportPreviews.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {reportPreviews.map((preview, index) => (
                          <div
                            key={preview}
                            className="aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                          >
                            {reportFiles[index]?.type.startsWith("video/") ? (
                              <video
                                src={preview}
                                className="h-full w-full object-cover"
                                muted
                              />
                            ) : (
                              <img
                                src={preview}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Descrição
                  </label>
                  <textarea
                    value={reportForm.description}
                    onChange={(event) =>
                      setReportForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    className="min-h-[110px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:col-span-2 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReportModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    disabled={savingReport}
                    onClick={saveReport}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {savingReport ? "Salvando..." : "Salvar chamado"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmployeeModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEmployeeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="modal-max-h-92 w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">
                      {editingEmployeeId ? "Editar funcionário" : "Novo funcionário"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Perfil, acesso e validação por e-mail.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-5 p-4 lg:grid-cols-[220px_1fr]">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="mx-auto mb-3 flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-card shadow-sm">
                    {employeeForm.avatarUrl ? (
                      <img
                        src={employeeForm.avatarUrl.replace(
                          "/upload/",
                          "/upload/w_300,h_300,c_fill,q_auto,f_auto/"
                        )}
                        alt="Foto do funcionário"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-9 w-9 text-muted-foreground" />
                    )}
                  </div>

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition hover:bg-muted">
                    <ImageIcon className="h-4 w-4" />
                    {uploadingAvatar ? "Enviando..." : "Foto do perfil"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) uploadAvatar(file);
                      }}
                    />
                  </label>

                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    A foto aparece nos perfis, listas e futuras interações.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Nome completo
                      </label>
                      <Input
                        value={employeeForm.name}
                        onChange={(event) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        aria-invalid={Boolean(employeeFormErrors.name)}
                      />
                      {employeeFormErrors.name && (
                        <p className="mt-1 text-xs text-red-600">
                          {employeeFormErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Matrícula
                      </label>
                      <Input
                        value={employeeForm.registrationNumber}
                        onChange={(event) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            registrationNumber: event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 12),
                          }))
                        }
                        inputMode="numeric"
                        aria-invalid={Boolean(
                          employeeFormErrors.registrationNumber
                        )}
                      />
                      {employeeFormErrors.registrationNumber && (
                        <p className="mt-1 text-xs text-red-600">
                          {employeeFormErrors.registrationNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        CPF
                      </label>
                      <Input
                        value={employeeForm.cpf}
                        onChange={(event) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            cpf: formatCpf(event.target.value),
                          }))
                        }
                        inputMode="numeric"
                        maxLength={14}
                        placeholder="000.000.000-00"
                        aria-invalid={Boolean(employeeFormErrors.cpf)}
                      />
                      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                        <span>{employeeFormErrors.cpf || "Somente 11 dígitos."}</span>
                        <span>{employeeForm.cpf.replace(/\D/g, "").length}/11</span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        E-mail
                      </label>
                      <Input
                        value={employeeForm.email}
                        onChange={(event) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            email: event.target.value,
                          }))
                        }
                        type="email"
                        placeholder="nome@empresa.com"
                        aria-invalid={Boolean(employeeFormErrors.email)}
                      />
                      {employeeFormErrors.email && (
                        <p className="mt-1 text-xs text-red-600">
                          {employeeFormErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Telefone
                      </label>
                      <Input
                        value={employeeForm.phone}
                        onChange={(event) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            phone: formatPhone(event.target.value),
                          }))
                        }
                        inputMode="tel"
                        maxLength={15}
                        placeholder="(00) 00000-0000"
                        aria-invalid={Boolean(employeeFormErrors.phone)}
                      />
                      {employeeFormErrors.phone && (
                        <p className="mt-1 text-xs text-red-600">
                          {employeeFormErrors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Data de nascimento
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="date"
                          value={employeeForm.birthDate}
                          onChange={(event) =>
                            setEmployeeForm((prev) => ({
                              ...prev,
                              birthDate: event.target.value,
                            }))
                          }
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Departamento
                      </label>
                      <Select
                        value={employeeForm.department || "none"}
                        onValueChange={(value) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            department: value === "none" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem departamento</SelectItem>
                          {departmentOptions.map((department) => (
                            <SelectItem key={department} value={department}>
                              {department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="flex gap-2">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Ao salvar com e-mail novo, o funcionário recebe um link
                        de validação. O acesso só é liberado depois da validação.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEmployeeModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      disabled={savingEmployee || uploadingAvatar}
                      onClick={saveEmployee}
                      className="gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      {savingEmployee ? "Salvando..." : "Salvar funcionário"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedReport && (
          <div
            className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
              className="modal-max-h-92 w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <div>
                  <h2 className="text-lg font-bold">
                    {selectedReport.title || `Chamado #${selectedReport.id}`}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Aberto por {selectedReport.employee?.name}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 p-4">
                {selectedReport.images && selectedReport.images.length > 0 && (
                  <div className="relative overflow-hidden rounded-2xl border bg-muted">
                    {selectedReport.images[detailImageIndex]?.resourceType === "video" ? (
                      <video
                        src={selectedReport.images[detailImageIndex].imageUrl}
                        controls
                        preload="metadata"
                        className="max-h-80 w-full bg-black object-contain"
                      />
                    ) : (
                      <img
                        src={selectedReport.images[detailImageIndex].imageUrl.replace(
                          "/upload/",
                          "/upload/w_1100,q_auto,f_auto/"
                        )}
                        alt=""
                        className="max-h-80 w-full object-contain"
                      />
                    )}

                    <div className="absolute right-2 top-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMedia({
                            items: (selectedReport.images || []).map((image) => ({
                              mediaUrl: image.imageUrl,
                              resourceType: image.resourceType,
                            })),
                            index: detailImageIndex,
                          })
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80"
                        title="Expandir mídia"
                      >
                        <Expand className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadMedia(
                            selectedReport.images?.[detailImageIndex]?.imageUrl || ""
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80"
                        title="Baixar mídia"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>

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
                          className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-2xl text-white"
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
                          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-2xl text-white"
                        >
                          ›
                        </button>
                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-2.5 py-1 text-xs text-white">
                          {detailImageIndex + 1} / {selectedReport.images.length}
                        </span>
                      </>
                    )}
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100">
                    <Plus className="h-4 w-4" />
                    {uploadingReportMedia ? "Enviando..." : "Adicionar mídia"}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      disabled={uploadingReportMedia}
                      onChange={(event) => {
                        addMediaToSelectedReport(
                          Array.from(event.target.files || [])
                        );
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!selectedReport.images?.[detailImageIndex]}
                    onClick={removeSelectedReportMedia}
                    className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover mídia atual
                  </Button>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Categoria</p>
                  <p className="font-medium">{selectedReport.category.name}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedReport.status.name}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Prioridade</p>
                  <span
                    className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${priorityBadgeClass(
                      selectedReport.priority
                    )}`}
                  >
                    {priorityLabel(selectedReport.priority)}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="text-sm">
                    {selectedReport.description || "Sem descrição."}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Local</p>
                  <p className="text-sm">
                    {selectedReport.referencePoint ||
                      selectedReport.address ||
                      "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    Atribuídos
                  </p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(selectedReport.participants || []).map((participant) => (
                      <span
                        key={participant.id}
                        className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs shadow-sm"
                      >
                        <UserCheck className="h-3 w-3 text-secondary" />
                        {participant.employee.name}
                      </span>
                    ))}
                    {!selectedReport.participants?.length && (
                      <span className="text-xs text-muted-foreground">
                        Nenhum funcionário atribuído.
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="grid max-h-40 gap-2 overflow-y-auto rounded-xl border border-border bg-card p-2 sm:grid-cols-2">
                      {employees.map((employee) => {
                        const selected = assignEmployeeIds.includes(
                          String(employee.id)
                        );

                        return (
                          <button
                            key={employee.id}
                            type="button"
                            onClick={() => toggleAssignEmployee(employee.id)}
                            className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition ${selected
                              ? "border-secondary bg-secondary/10 text-primary"
                              : "border-border hover:bg-muted"
                              }`}
                          >
                            <span className="truncate">
                              {employee.name}
                              {employee.deletedAt ? " (inativo)" : ""}
                            </span>
                            {selected && (
                              <CheckCircle className="h-3.5 w-3.5 text-secondary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      type="button"
                      disabled={assigningReport}
                      onClick={() => assignEmployeeToReport(selectedReport)}
                      className="w-full gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      {assigningReport
                        ? "Atribuindo..."
                        : `Atribuir selecionados (${assignEmployeeIds.length})`}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 border-t border-border pt-4 sm:grid-cols-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openEditReportModal(selectedReport)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    onClick={openNewReportModal}
                    className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Novo chamado
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deletingReportId === selectedReport.id}
                    onClick={() => deleteReport(selectedReport)}
                    className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingReportId === selectedReport.id ? "Excluindo..." : "Excluir"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAnalyticsExportModal && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAnalyticsExportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 36, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-2xl rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Exportar indicadores em PDF</h2>
                  <p className="text-sm text-muted-foreground">
                    Marque os blocos que devem aparecer no relatório.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAnalyticsExportModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {analyticsExportSections.map((section) => (
                  <label
                    key={section.id}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background p-3 text-sm transition hover:border-secondary/60"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAnalyticsSections.includes(section.id)}
                      onChange={() => toggleAnalyticsExportSection(section.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>{section.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setSelectedAnalyticsSections(
                      analyticsExportSections.map((section) => section.id)
                    )
                  }
                >
                  Marcar todos
                </Button>
                <Button type="button" onClick={exportAnalyticsPdf} className="gap-2">
                  <Download className="h-4 w-4" />
                  Gerar PDF
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showReportExportModal && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReportExportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 36, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-3xl rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Exportar chamados filtrados</h2>
                  <p className="text-sm text-muted-foreground">
                    Serão exportados {filtered.length} chamado(s) usando categoria,
                    pessoa, status, período e busca atuais.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportExportModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4 grid gap-2 rounded-2xl border border-border bg-background p-3 text-xs text-muted-foreground sm:grid-cols-4">
                {Object.entries(formatFiltersForExport()).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-semibold text-foreground">{key}</span>
                    <p className="truncate">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {reportExportColumns.map((column) => (
                  <label
                    key={column.id}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background p-3 text-sm transition hover:border-secondary/60"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReportColumns.includes(column.id)}
                      onChange={() => toggleReportExportColumn(column.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>{column.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setSelectedReportColumns(
                      reportExportColumns.map((column) => column.id)
                    )
                  }
                >
                  Marcar todos
                </Button>
                <Button
                  type="button"
                  onClick={exportFilteredReportsCsv}
                  className="gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Baixar CSV
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {expandedMedia && (
          <motion.div
            className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedMedia(null)}
          >
            <button
              type="button"
              onClick={() => setExpandedMedia(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                downloadMedia(expandedMedia.items[expandedMedia.index].mediaUrl);
              }}
              className="absolute right-16 top-4 z-10 flex h-10 items-center justify-center gap-2 rounded-full bg-white/10 px-4 text-sm text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
              Baixar
            </button>

            {expandedMedia.items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setExpandedMedia((prev) =>
                      prev
                        ? {
                          ...prev,
                          index:
                            prev.index === 0
                              ? prev.items.length - 1
                              : prev.index - 1,
                        }
                        : prev
                    );
                  }}
                  className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setExpandedMedia((prev) =>
                      prev
                        ? {
                          ...prev,
                          index:
                            prev.index === prev.items.length - 1
                              ? 0
                              : prev.index + 1,
                        }
                        : prev
                    );
                  }}
                  className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
                >
                  ›
                </button>
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                  {expandedMedia.index + 1} / {expandedMedia.items.length}
                </div>
              </>
            )}

            {expandedMedia.items[expandedMedia.index]?.resourceType === "video" ? (
              <video
                src={expandedMedia.items[expandedMedia.index].mediaUrl}
                controls
                autoPlay
                className="max-h-[85vh] max-w-full rounded-xl bg-black"
                onClick={(event) => event.stopPropagation()}
              />
            ) : (
              <img
                src={expandedMedia.items[expandedMedia.index].mediaUrl}
                alt="Mídia ampliada"
                className="max-h-[85vh] max-w-full rounded-xl object-contain"
                onClick={(event) => event.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;

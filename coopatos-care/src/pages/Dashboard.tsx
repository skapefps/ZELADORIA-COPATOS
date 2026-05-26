import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  MapPin,
  List,
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
  RotateCcw,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";

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
import { brandPreset } from "@/config/brand";

type AdminSection =
  | "reports"
  | "employees"
  | "users"
  | "departments"
  | "settings";

type AdminReport = {
  id: number;
  title?: string | null;
  description?: string | null;
  referencePoint?: string | null;
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
  employee: {
    id: number;
    name: string;
  };
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
  department?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    reports: number;
    participations: number;
  };
};

type EmployeeForm = {
  registrationNumber: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  department: string;
};

const emptyEmployeeForm: EmployeeForm = {
  registrationNumber: "",
  name: "",
  email: "",
  cpf: "",
  phone: "",
  department: "",
};

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

const priorityBarColor = (report: AdminReport) => {
  const category = report.category?.name;

  if (category === "Segurança") return "bg-red-500";
  if (category === "Elétrico") return "bg-yellow-500";
  if (category === "Hídrico") return "bg-blue-500";
  if (category === "Erosão") return "bg-amber-600";
  return "bg-green-500";
};

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeForm, setEmployeeForm] =
    useState<EmployeeForm>(emptyEmployeeForm);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [statuses, setStatuses] = useState<{ id: number; name: string }[]>([]);

  const [adminSection, setAdminSection] = useState<AdminSection>("reports");

  const [view, setView] = useState<"list" | "maps">("list");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLocation, setFilterLocation] = useState("");
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);

  const admin = JSON.parse(localStorage.getItem("admin") || "{}");

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    const adminWelcomeShown = localStorage.getItem("adminWelcomeShown");

    if (!auth.isAuthenticated || auth.role !== "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    if (admin?.email && adminWelcomeShown !== "true") {
      toast({
        title: `✓ Bem-vindo, ${admin.employee?.name || admin.email}!`,
        description: "Acesso administrativo realizado com sucesso.",
        className: "bg-secondary text-secondary-foreground border-secondary",
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
        ] =
          await Promise.all([
            fetch(`${API_URL}/reports`),
            fetch(`${API_URL}/categories`),
            fetch(`${API_URL}/statuses`),
            fetch(`${API_URL}/admin/employees`),
          ]);

        setReports(await reportsResponse.json());
        setCategories(await categoriesResponse.json());
        setStatuses(await statusesResponse.json());
        setEmployees(await employeesResponse.json());
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

  const filtered = useMemo(() => {
    let result = [...reports];

    if (filterCategory !== "all") {
      result = result.filter((r) => String(r.category.id) === filterCategory);
    }

    if (filterStatus !== "all") {
      result = result.filter((r) => String(r.status.id) === filterStatus);
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
  }, [reports, filterCategory, filterStatus, filterLocation]);

  const stats = useMemo(
    () => ({
      total: reports.length,
      open: reports.filter((r) => r.status.name === "ABERTO").length,
      inProgress: reports.filter((r) => r.status.name === "EM_ANDAMENTO")
        .length,
      done: reports.filter((r) => r.status.name === "FINALIZADO").length,
    }),
    [reports]
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

  const loadEmployees = async () => {
    setLoadingEmployees(true);

    try {
      const response = await fetch(`${API_URL}/admin/employees`);
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao carregar funcionários",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
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
      cpf: employee.cpf,
      phone: employee.phone || "",
      department: employee.department || "",
    });
  };

  const resetEmployeeForm = () => {
    setEditingEmployeeId(null);
    setEmployeeForm(emptyEmployeeForm);
  };

  const saveEmployee = async () => {
    setSavingEmployee(true);

    try {
      const response = await fetch(
        editingEmployeeId
          ? `${API_URL}/admin/employees/${editingEmployeeId}`
          : `${API_URL}/admin/employees`,
        {
          method: editingEmployeeId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(employeeForm),
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

  const toggleEmployeeStatus = async (employee: AdminEmployee) => {
    const active = Boolean(employee.deletedAt);

    try {
      const response = await fetch(
        `${API_URL}/admin/employees/${employee.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
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

  const adminMenu = [
    { id: "reports", label: "Chamados", icon: ClipboardList },
    { id: "employees", label: "Funcionários", icon: Users },
    { id: "users", label: "Usuários", icon: UserCog },
    { id: "departments", label: "Departamentos", icon: Building2 },
    { id: "settings", label: "Configurações", icon: Settings },
  ] as const;

  const sectionTitle = {
    reports: "Chamados",
    employees: "Funcionários",
    users: "Usuários",
    departments: "Departamentos",
    settings: "Configurações",
  }[adminSection];

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-primary sticky top-0 z-20 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <BrandLogo
            imageClassName="h-20 w-20 rounded-xl object-contain"
          />

          <div>
            <h1 className="text-lg font-bold text-primary-foreground">
              {brandPreset.shortName}
            </h1>
            <p className="text-xs text-primary-foreground/60">
              {brandPreset.adminTitle} • {brandPreset.organizationName}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/admin", { replace: true });
          }}
          className="flex items-center gap-1 text-sm text-primary-foreground/70 hover:text-primary-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </header>

      <div className="sticky top-[112px] z-10 border-b border-border/60 bg-background/80 backdrop-blur-xl">
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
                  className={`group relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${active
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

      <main className="mx-auto max-w-7xl p-4 lg:p-6">
        {adminSection === "reports" ? (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Total", value: stats.total, color: "text-primary" },
                {
                  label: "Abertos",
                  value: stats.open,
                  color: "text-red-700",
                },
                {
                  label: "Em andamento",
                  value: stats.inProgress,
                  color: "text-blue-700",
                },
                {
                  label: "Finalizados",
                  value: stats.done,
                  color: "text-green-700",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="mb-1 text-xs text-muted-foreground">
                    {s.label}
                  </p>
                  <p className={`text-2xl font-bold ${s.color}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row">
              <div className="flex gap-2">
                <Button
                  variant={view === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("list")}
                  className={
                    view === "list" ? "bg-primary text-primary-foreground" : ""
                  }
                >
                  <List className="mr-1 h-4 w-4" />
                  Lista
                </Button>

                <Button
                  variant={view === "maps" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("maps")}
                  className={
                    view === "maps" ? "bg-primary text-primary-foreground" : ""
                  }
                >
                  <MapIcon className="mr-1 h-4 w-4" />
                  Mapas
                </Button>
              </div>

              <div className="flex flex-1 flex-wrap gap-2">
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="h-9 w-[170px] text-sm">
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
                  <SelectTrigger className="h-9 w-[170px] text-sm">
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
            ) : view === "list" ? (
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
                    onClick={() => setSelectedReport(report)}
                    className="group cursor-pointer rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex w-8 flex-col items-center gap-1">
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
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-primary">
                            {categoryIcons[report.category.name] || (
                              <HelpCircle className="h-4 w-4" />
                            )}
                          </span>

                          <span className="truncate text-sm font-semibold">
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

                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {report.referencePoint ||
                              report.address ||
                              "Local não informado"}
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
                        className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${statusColors[report.status.name] ||
                          "border-border bg-muted text-muted-foreground"
                          }`}
                      >
                        {report.status.name}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="mb-1 text-sm font-semibold">
                  Mapa administrativo
                </p>
                <p className="text-sm text-muted-foreground">
                  Vamos reconectar o mapa aos chamados reais no próximo passo.
                </p>
              </div>
            )}
          </>
        ) : adminSection === "employees" ? (
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

            <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {editingEmployeeId ? "Editar funcionário" : "Novo funcionário"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cadastro usado no login por matrícula e CPF.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Input
                    value={employeeForm.name}
                    onChange={(event) =>
                      setEmployeeForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Nome completo"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={employeeForm.registrationNumber}
                      onChange={(event) =>
                        setEmployeeForm((prev) => ({
                          ...prev,
                          registrationNumber: event.target.value,
                        }))
                      }
                      placeholder="Matrícula"
                    />
                    <Input
                      value={employeeForm.cpf}
                      onChange={(event) =>
                        setEmployeeForm((prev) => ({
                          ...prev,
                          cpf: event.target.value,
                        }))
                      }
                      placeholder="CPF"
                    />
                  </div>
                  <Input
                    value={employeeForm.email}
                    onChange={(event) =>
                      setEmployeeForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    placeholder="E-mail"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={employeeForm.phone}
                      onChange={(event) =>
                        setEmployeeForm((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="Telefone"
                    />
                    <Input
                      value={employeeForm.department}
                      onChange={(event) =>
                        setEmployeeForm((prev) => ({
                          ...prev,
                          department: event.target.value,
                        }))
                      }
                      placeholder="Departamento"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      disabled={savingEmployee}
                      onClick={saveEmployee}
                      className="flex-1 gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      {savingEmployee ? "Salvando..." : "Salvar"}
                    </Button>

                    {editingEmployeeId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetEmployeeForm}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Funcionários</p>
                    <p className="text-xs text-muted-foreground">
                      {filteredEmployees.length} registro(s) encontrados
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={employeeSearch}
                      onChange={(event) => setEmployeeSearch(event.target.value)}
                      placeholder="Buscar nome, matrícula, CPF..."
                      className="pl-9 lg:w-[320px]"
                    />
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
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Matrícula {employee.registrationNumber} • CPF {employee.cpf}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {employee.email || "Sem e-mail"} •{" "}
                            {employee.department || "Sem departamento"}
                          </p>
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
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-lg font-semibold">{sectionTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Essa área será conectada ao banco nos próximos passos.
            </p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
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
                  <img
                    src={selectedReport.images[0].imageUrl}
                    alt=""
                    className="max-h-80 w-full rounded-xl border object-cover"
                  />
                )}

                <div>
                  <p className="text-xs text-muted-foreground">Categoria</p>
                  <p className="font-medium">{selectedReport.category.name}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedReport.status.name}</p>
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;

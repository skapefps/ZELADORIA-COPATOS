import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Shield, Eye, EyeOff, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/BrandLogo";
import { useBranding } from "@/config/brand";

const API_URL =
  window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? "http://localhost:3333"
    : import.meta.env.VITE_API_URL ||
    "https://zeladoria-coopatos-api.onrender.com";

const EmployeeLogin = () => {

  const isPublicDomain =
    window.location.hostname === "zeladoriacoopatos.com.br" ||
    window.location.hostname === "www.zeladoriacoopatos.com.br";

  const [matricula, setMatricula] = useState("");
  const [error, setError] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCpf, setShowCpf] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCpf, setRecoveryCpf] = useState("");
  const [sendingRecovery, setSendingRecovery] = useState(false);

  const { loginEmployee } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { brandPreset } = useBranding();


  useEffect(() => {
    const employee = localStorage.getItem("employee");

    if (employee) {
      navigate("/funcionario", { replace: true });
    }
  }, [navigate]);

  const sendRecoveryRequest = async () => {
    if (!recoveryEmail.trim() || !recoveryCpf.trim()) {
      toast({
        title: "Preencha e-mail e CPF",
        variant: "destructive",
      });
      return;
    }

    setSendingRecovery(true);

    try {
      const response = await fetch(`${API_URL}/employee/recover-registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: recoveryEmail.trim().toLowerCase(),
          cpf: recoveryCpf.replace(/\D/g, ""),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Não foi possível recuperar",
          description: data.error || "Confira os dados informados.",
          variant: "destructive",
        });
        return;
      }



      toast({
        title: "E-mail enviado!",
        description: "Enviamos sua matrícula para o e-mail cadastrado.",
      });

      setRecoveryEmail("");
      setRecoveryCpf("");
      setShowRecovery(false);
    } catch (error) {
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setSendingRecovery(false);
    }
  };


  useEffect(() => {
    const sessionExpired = sessionStorage.getItem("sessionExpired");
    const expiredRole = sessionStorage.getItem("sessionExpiredRole");
    const storedForcedLogoutMessage = sessionStorage.getItem("employeeForcedLogout");

    if (sessionExpired === "true" && (!expiredRole || expiredRole === "employee")) {
      toast({
        title: "Sessão expirada",
        description:
          "Você foi desconectado por inatividade. Faça login novamente para continuar.",
        variant: "destructive",
      });
    }

    if (storedForcedLogoutMessage) {
      toast({
        title: "Sessão encerrada",
        description: storedForcedLogoutMessage,
        variant: "destructive",
      });
    }

    sessionStorage.removeItem("sessionExpired");
    sessionStorage.removeItem("sessionExpiredRole");
    sessionStorage.removeItem("employeeForcedLogout");
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matricula.trim() || matricula.trim().length < 3) {
      setError("Insira uma matrícula válida (mín. 3 dígitos)");
      return;
    }

    if (!cpf.trim() || cpf.trim().length < 11) {
      setError("Insira um CPF válido");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/employee-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationNumber: matricula.trim(),
          cpf: cpf.replace(/\D/g, ""),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Matrícula não encontrada");
        return;
      }

      localStorage.setItem("employee", JSON.stringify(data.employee));

      localStorage.setItem(
        "employeeSessionToken",
        data.sessionToken || ""
      );
      sessionStorage.setItem(
        "employeeSessionToken",
        data.sessionToken || ""
      );

      loginEmployee(matricula.trim());

      navigate("/funcionario", { replace: true });
    } catch (error) {
      console.error("Erro no login:", error);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-hero px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo e título */}
        <div className="text-center mb-4">
          <BrandLogo
            className="inline-flex items-center justify-center w-64 h-64 rounded-2xl mb-0 p-0"
            imageClassName="mb-0 p-0"
          />

          <h1 className="text-2xl font-bold text-primary-foreground mt-0">
            {brandPreset.appName}
          </h1>

          <p className="text-primary-foreground/70 text-sm mt-1 mb-20">
            {brandPreset.tagline}
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-card rounded-xl p-6 shadow-xl border border-border">
          <h2 className="text-lg font-semibold text-card-foreground mb-1">
            Acesso do Funcionário
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            Insira sua matrícula para continuar
          </p>


          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                disabled={loading}
                type="text"
                placeholder="Digite sua matrícula"
                value={matricula}
                onChange={(e) => {
                  setMatricula(e.target.value);
                  setError("");
                }}
                className="text-center text-lg tracking-widest"
                inputMode="numeric"
              />

              {error && (
                <p className="text-destructive text-xs mt-2 text-center">
                  {error}
                </p>
              )}
            </div>
            <div className="relative">
              <Input
                disabled={loading}
                type={showCpf ? "text" : "password"}
                placeholder="Digite seu CPF"
                value={cpf}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 11);

                  const formatted = value
                    .replace(/(\d{3})(\d)/, "$1.$2")
                    .replace(/(\d{3})(\d)/, "$1.$2")
                    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

                  setCpf(formatted);
                  setError("");
                }}
                className="text-center text-lg tracking-widest pr-10"
                inputMode="numeric"
              />

              <button
                type="button"
                onClick={() => setShowCpf((prev) => !prev)}
                className="
    absolute
    right-3
    top-1/2
    -translate-y-1/2
    text-muted-foreground
    hover:text-foreground
    transition-colors
  "
              >
                {showCpf ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setShowRecovery(true)}
            className="w-full mt-3 text-sm text-secondary hover:underline"
          >
            Esqueci meu CPF ou matrícula
          </button>



          {/* Acesso administrativo */}
          <button
            type="button"
            onClick={() => navigate("/admin/login")}
            className="w-full mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Shield className="w-3 h-3" />
            Acesso Administrativo
          </button>
        </div>
      </motion.div>
      <AnimatePresence>
        {showRecovery && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/50"
              onClick={() => setShowRecovery(false)}
            />

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 20,
              }}
              transition={{
                duration: 0.2,
              }}
              className="
          fixed
          inset-0
          z-[9999]
          flex
          items-center
          justify-center
          p-4
        "
            >
              <div
                className="
            w-full
            max-w-md
            rounded-3xl
            bg-card
            border
            border-border
            shadow-2xl
            p-6
          "
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold">
                  Recuperar acesso
                </h3>

                <p className="text-sm text-muted-foreground mt-1 mb-5">
                  Informe seus dados para que o administrativo entre em contato.
                </p>

                <div className="space-y-3">
                  <Input
                    placeholder="E-mail vinculado à matrícula"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    inputMode="email"
                  />

                  <Input
                    placeholder="CPF"
                    value={recoveryCpf}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 11);

                      const formatted = value
                        .replace(/(\d{3})(\d)/, "$1.$2")
                        .replace(/(\d{3})(\d)/, "$1.$2")
                        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

                      setRecoveryCpf(formatted);
                    }}
                    inputMode="numeric"
                  />
                </div>

                <div className="mt-5 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      setShowRecovery(false)
                    }
                  >
                    Cancelar
                  </Button>

                  <Button
                    className="flex-1"
                    disabled={sendingRecovery}
                    onClick={sendRecoveryRequest}
                  >
                    {sendingRecovery
                      ? "Enviando..."
                      : "Enviar"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EmployeeLogin;

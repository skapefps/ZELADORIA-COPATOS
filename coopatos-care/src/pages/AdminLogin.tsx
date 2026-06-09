import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Loader2, Mail, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/BrandLogo";
import { useBranding } from "@/config/brand";
import { useToast } from "@/hooks/use-toast";

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3333"
    : import.meta.env.VITE_API_URL ||
      "https://zeladoria-coopatos-api.onrender.com";

const AdminLogin = () => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [sendingRecovery, setSendingRecovery] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const { brandPreset } = useBranding();
  const { toast } = useToast();

  useEffect(() => {
    const sessionExpired = sessionStorage.getItem("sessionExpired");
    const expiredRole = sessionStorage.getItem("sessionExpiredRole");
    const storedForcedLogoutMessage = sessionStorage.getItem("adminForcedLogout");

    if (sessionExpired === "true" && expiredRole === "admin") {
      toast({
        title: "Sessão expirada",
        description:
          "Sua sessão administrativa expirou por inatividade. Faça login novamente para continuar.",
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
    sessionStorage.removeItem("adminForcedLogout");
  }, [toast]);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const success = await loginAdmin(
        user,
        pass
      );

      if (success) {
        navigate("/dashboard");
        return;
      }

      setError("Credenciais inválidas");
    } catch {
      setError("Erro ao realizar login.");
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    if (!recoveryEmail.trim()) {
      toast({
        title: "Informe seu e-mail",
        variant: "destructive",
      });
      return;
    }

    setSendingRecovery(true);

    try {
      const response = await fetch(
        `${API_URL}/admin/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: recoveryEmail.trim().toLowerCase(),
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao solicitar redefinição",
          description: data.error || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Verifique seu e-mail",
        description: data.message,
      });
      setShowForgotPassword(false);
      setRecoveryEmail("");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setSendingRecovery(false);
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
        <div className="text-center mb-4">
          <BrandLogo
            className="inline-flex items-center justify-center w-64 h-64 rounded-2xl mb-0 p-0"
            imageClassName="mb-0 p-0"
          />
          <h1 className="text-2xl font-bold text-primary-foreground mt-0">
            {brandPreset.adminTitle}
          </h1>
          <p className="text-primary-foreground/70 text-sm mt-1">Acesso restrito</p>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="E-mail administrativo"
              value={user}
              onChange={(e) => {
                setUser(e.target.value);
                setError("");
              }}
            />
            <Input
              type="password"
              placeholder="Senha"
              value={pass}
              onChange={(e) => { setPass(e.target.value); setError(""); }}
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
            >
              {loading
                ? "Entrando..."
                : "Entrar"}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="mx-auto mt-4 block text-xs font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Esqueci minha senha
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mx-auto mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <UserRound className="h-3.5 w-3.5" />
            Acesso funcionário
          </button>
        </div>
      </motion.div>

      {showForgotPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowForgotPassword(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-border bg-muted/40 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/15 text-secondary shadow-sm">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Recuperar senha
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Enviaremos um link seguro para o e-mail administrativo.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="rounded-full bg-background p-2 text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Fechar recuperação de senha"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Mail className="h-4 w-4 text-secondary" />
                  E-mail do administrador
                </div>
                <Input
                  type="email"
                  value={recoveryEmail}
                  onChange={(event) => setRecoveryEmail(event.target.value)}
                  placeholder="nome@empresa.com"
                  className="bg-card"
                  autoFocus
                />
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Se o e-mail estiver cadastrado e validado, você receberá as instruções para redefinir a senha.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  className="sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={sendingRecovery}
                  onClick={requestPasswordReset}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 sm:w-auto"
                >
                  {sendingRecovery ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Enviar link
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;

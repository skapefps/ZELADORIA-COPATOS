import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Shield, X } from "lucide-react";
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
          <p className="text-xs text-muted-foreground text-center mt-4">

          </p>
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="w-full mt-3 text-xs font-medium text-secondary hover:text-secondary/80 transition-colors"
          >
            Esqueci minha senha administrativa
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar ao acesso do funcionário
          </button>
        </div>
      </motion.div>

      {showForgotPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowForgotPassword(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Redefinir senha</h2>
                  <p className="text-sm text-muted-foreground">
                    Informe seu e-mail administrativo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="rounded-full bg-muted p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <Input
              type="email"
              value={recoveryEmail}
              onChange={(event) => setRecoveryEmail(event.target.value)}
              placeholder="email@empresa.com"
            />

            <Button
              type="button"
              disabled={sendingRecovery}
              onClick={requestPasswordReset}
              className="mt-4 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {sendingRecovery ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Enviar link de redefinição
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;

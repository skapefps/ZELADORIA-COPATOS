import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/config/brand";

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3333"
    : import.meta.env.VITE_API_URL ||
      "https://zeladoria-coopatos-api.onrender.com";

const AdminResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { brandPreset } = useBranding();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "Use pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas diferentes",
        description: "Confirme a mesma senha nos dois campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Link inválido",
          description: data.error || "Solicite um novo link de redefinição.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Senha redefinida",
        description: "Entre com sua nova senha administrativa.",
      });
      navigate("/admin/login", { replace: true });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gradient-hero px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="mb-4 text-center">
          <BrandLogo
            className="mb-0 inline-flex h-48 w-48 items-center justify-center rounded-2xl p-0"
            imageClassName="mb-0 p-0"
          />
          <h1 className="mt-0 text-2xl font-bold text-primary-foreground">
            Redefinir senha
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/70">
            {brandPreset.adminTitle}
          </p>
        </div>

        <form onSubmit={submit} className="rounded-xl bg-card p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Nova senha administrativa</p>
              <p className="text-xs text-muted-foreground">
                Defina uma senha segura para acessar o painel.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nova senha"
            />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirmar senha"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary font-semibold text-secondary-foreground hover:bg-secondary/90"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar senha
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminResetPassword;

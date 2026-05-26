import React, { useState } from "react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/BrandLogo";
import { brandPreset } from "@/config/brand";

const AdminLogin = () => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem("sessionExpired");
  }, []);

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
              placeholder="E-mail ou matrícula"
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
            onClick={() => navigate("/")}
            className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar ao acesso do funcionário
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

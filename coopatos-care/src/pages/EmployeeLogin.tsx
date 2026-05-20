import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Droplets, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3333"
    : import.meta.env.VITE_API_URL || "https://zeladoria-coopatos-api.onrender.com";
const EmployeeLogin = () => {
  const [matricula, setMatricula] = useState("");
  const [error, setError] = useState("");
  const { loginEmployee } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  

  if (!matricula.trim() || matricula.trim().length < 3) {
    setError("Insira uma matrícula válida (mín. 3 dígitos)");
    return;
  }
  
  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/employee-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registrationNumber: matricula.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Matrícula não encontrada");
      return;
    }

    localStorage.setItem("employee", JSON.stringify(data.employee));

    loginEmployee(matricula.trim());

    navigate("/funcionario");
  } catch (error) {
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
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-64 h-64 rounded-2xl mb-0 p-0">
            <img src="/logo-coopatos.png" alt="Logo Coopatos" className="mb-0 p-0" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground mt-0">Zeladoria Coopatos</h1>
          <p className="text-primary-foreground/70 text-sm mt-1 mb-20">Sempre presente!</p>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-card-foreground mb-1">Acesso do Funcionário</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Insira sua matrícula para continuar
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Digite sua matrícula: "
                value={matricula}
                onChange={(e) => { setMatricula(e.target.value); setError(""); }}
                className="text-center text-lg tracking-widest"
                inputMode="numeric"
              />
              {error && <p className="text-destructive text-xs mt-1">{error}</p>}
            </div>
            <Button
  type="submit"
  disabled={loading}
  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
>
  {loading ? "Entrando..." : "Entrar"}
</Button>
          </form>

          <button
            onClick={() => navigate("/admin/login")}
            className="w-full mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Shield className="w-3 h-3" />
            Acesso Manutenção
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EmployeeLogin;

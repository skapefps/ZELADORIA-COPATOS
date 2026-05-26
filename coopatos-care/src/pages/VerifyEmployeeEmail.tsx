import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { brandPreset } from "@/config/brand";

const API_URL =
  window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? "http://localhost:3333"
    : import.meta.env.VITE_API_URL ||
    "https://zeladoria-coopatos-api.onrender.com";

const VerifyEmployeeEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    const validateEmail = async () => {
      try {
        const response = await fetch(`${API_URL}/employee/verify-email/${token}`, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          setStatus("error");
          return;
        }

        const data = await response.json();
        const storedEmployee = JSON.parse(
          localStorage.getItem("employee") || "{}"
        );

        if (storedEmployee?.id && storedEmployee.id === data.employee?.id) {
          localStorage.setItem(
            "employee",
            JSON.stringify({
              ...storedEmployee,
              ...data.employee,
            })
          );
        }

        setStatus("success");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    };

    validateEmail();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-2xl">
        <BrandLogo
          className="mx-auto mb-4 flex h-24 w-24 items-center justify-center"
          imageClassName="max-h-full max-w-full object-contain"
        />

        {status === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-secondary" />
            <h1 className="text-xl font-bold">Validando seu acesso</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Aguarde enquanto confirmamos seu e-mail.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
            <h1 className="text-xl font-bold">E-mail validado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Seu acesso ao {brandPreset.appName} foi liberado.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/">Ir para o login</Link>
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
            <h1 className="text-xl font-bold">Link inválido</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Solicite um novo e-mail de validação ao administrador.
            </p>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link to="/">Voltar</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmployeeEmail;

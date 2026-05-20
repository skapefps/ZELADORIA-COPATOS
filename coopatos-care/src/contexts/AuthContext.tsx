import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface AuthState {
  isAuthenticated: boolean;
  role: "employee" | "admin" | null;
  matricula: string | null;
}

interface AuthContextType extends AuthState {
  loginEmployee: (matricula: string) => void;
  loginAdmin: (user: string, pass: string) => boolean;
  logout: (reason?: "manual" | "timeout") => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const INACTIVITY_LIMIT = 15 * 60 * 1000; // settado agora tempo de inatiividade para 15 minutos

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const savedAuth = localStorage.getItem("auth");

    if (savedAuth) {
      return JSON.parse(savedAuth);
    }

    return {
      isAuthenticated: false,
      role: null,
      matricula: null,
    };
  });

  const loginEmployee = (matricula: string) => {
    const newAuth: AuthState = {
      isAuthenticated: true,
      role: "employee",
      matricula,
    };

    localStorage.setItem("auth", JSON.stringify(newAuth));
    localStorage.setItem("lastActivity", String(Date.now()));

    setAuth(newAuth);
  };

  const loginAdmin = (user: string, pass: string) => {
    if (user === "admin" && pass === "admin123") {
      const newAuth: AuthState = {
        isAuthenticated: true,
        role: "admin",
        matricula: null,
      };

      localStorage.setItem("auth", JSON.stringify(newAuth));
      localStorage.setItem("lastActivity", String(Date.now()));

      setAuth(newAuth);
      return true;
    }

    return false;
  };

  const logout = (reason?: "manual" | "timeout") => {
    localStorage.removeItem("auth");
    localStorage.removeItem("employee");
    localStorage.removeItem("lastActivity");
    sessionStorage.removeItem("welcomeShown");

    if (reason === "timeout") {
      sessionStorage.setItem("sessionExpired", "true");
    }

    setAuth({
      isAuthenticated: false,
      role: null,
      matricula: null,
    });
  };

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const updateActivity = () => {
      localStorage.setItem("lastActivity", String(Date.now()));
    };

    const checkInactivity = () => {
      const lastActivity = Number(localStorage.getItem("lastActivity"));

      if (!lastActivity) return;

      const inactiveTime = Date.now() - lastActivity;

      if (inactiveTime >= INACTIVITY_LIMIT) {
        logout("timeout");
      }
    };

    const events = [
  "click",
  "keydown",
  "mousemove",
  "touchstart",
  "scroll",
  "visibilitychange",
];

    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    const interval = setInterval(checkInactivity, 10 * 1000); // vai verificar a cada 10  segundos se a inatividade foi atingida

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });

      clearInterval(interval);
    };
  }, [auth.isAuthenticated]);

  return (
    <AuthContext.Provider value={{ ...auth, loginEmployee, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

const API_URL =
  window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? "http://localhost:3333"
    : import.meta.env.VITE_API_URL ||
    "https://zeladoria-coopatos-api.onrender.com";

interface AuthState {
  isAuthenticated: boolean;
  role: "employee" | "admin" | null;
  matricula: string | null;
}

interface AuthContextType extends AuthState {
  loginEmployee: (matricula: string) => void;
  loginAdmin: (
    email: string,
    password: string
  ) => Promise<boolean>;

  logout: (reason?: "manual" | "timeout") => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const INACTIVITY_LIMIT = 15 * 60 * 1000;

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
    sessionStorage.setItem(
      "employeeSessionToken",
      localStorage.getItem("employeeSessionToken") || ""
    );

    setAuth(newAuth);
  };

  const loginAdmin = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(
        `${API_URL}/admin-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      const newAuth: AuthState = {
        isAuthenticated: true,
        role: "admin",
        matricula: null,
      };

      localStorage.setItem(
        "auth",
        JSON.stringify(newAuth)
      );


      localStorage.setItem(
        "admin",
        JSON.stringify(data.admin)
      );

      localStorage.setItem(
        "adminSessionToken",
        data.adminSessionToken
      );
      sessionStorage.setItem(
        "adminSessionToken",
        data.adminSessionToken
      );

      localStorage.setItem(
        "adminWelcomeShown",
        "false"
      );

      localStorage.setItem(
        "lastActivity",
        String(Date.now())
      );

      setAuth(newAuth);

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const logout = useCallback((reason?: "manual" | "timeout") => {
    localStorage.removeItem("auth");
    localStorage.removeItem("employee");
    localStorage.removeItem("admin");
    localStorage.removeItem("employeeSessionToken");
    localStorage.removeItem("adminSessionToken");
    sessionStorage.removeItem("employeeSessionToken");
    sessionStorage.removeItem("adminSessionToken");
    localStorage.removeItem("lastActivity");
    localStorage.removeItem("welcomeShown");
    localStorage.removeItem("adminWelcomeShown");

    if (reason === "timeout") {
      sessionStorage.setItem("sessionExpired", "true");
      if (auth.role) {
        sessionStorage.setItem("sessionExpiredRole", auth.role);
      }
    } else {
      sessionStorage.removeItem("sessionExpired");
      sessionStorage.removeItem("sessionExpiredRole");
    }

    setAuth({
      isAuthenticated: false,
      role: null,
      matricula: null,
    });
  }, [auth.role]);

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

    updateActivity();

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
  }, [auth.isAuthenticated, logout]);

  return (
    <AuthContext.Provider value={{ ...auth, loginEmployee, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

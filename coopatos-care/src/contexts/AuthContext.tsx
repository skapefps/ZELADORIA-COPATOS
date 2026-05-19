import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthState {
  isAuthenticated: boolean;
  role: "employee" | "admin" | null;
  matricula: string | null;
}

interface AuthContextType extends AuthState {
  loginEmployee: (matricula: string) => void;
  loginAdmin: (user: string, pass: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    matricula: null,
  });

  const loginEmployee = (matricula: string) => {
    setAuth({ isAuthenticated: true, role: "employee", matricula });
  };

  const loginAdmin = (user: string, pass: string) => {
    if (user === "admin" && pass === "admin123") {
      setAuth({ isAuthenticated: true, role: "admin", matricula: null });
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuth({ isAuthenticated: false, role: null, matricula: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, loginEmployee, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

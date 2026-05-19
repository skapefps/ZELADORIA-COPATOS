import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ReportsProvider } from "@/contexts/ReportsContext";
import EmployeeLogin from "./pages/EmployeeLogin";
import AdminLogin from "./pages/AdminLogin";
import EmployeePanel from "./pages/EmployeePanel";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedEmployee = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated || role !== "employee") return <Navigate to="/" />;
  return <>{children}</>;
};

const ProtectedAdmin = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated || role !== "admin") return <Navigate to="/admin/login" />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ReportsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<EmployeeLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/funcionario" element={<ProtectedEmployee><EmployeePanel /></ProtectedEmployee>} />
              <Route path="/dashboard" element={<ProtectedAdmin><Dashboard /></ProtectedAdmin>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ReportsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

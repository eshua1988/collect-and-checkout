import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import FormEditor from "./pages/FormEditor";
import FormView from "./pages/FormView";
import FormResults from "./pages/FormResults";
import BotEditor from "./pages/BotEditor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Redirect authenticated users away from /auth
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
    <Route path="/form/new" element={<ProtectedRoute><FormEditor /></ProtectedRoute>} />
    <Route path="/form/:formId" element={<ProtectedRoute><FormEditor /></ProtectedRoute>} />
    <Route path="/form/:formId/results" element={<ProtectedRoute><FormResults /></ProtectedRoute>} />
    <Route path="/f/:formId" element={<FormView />} />
    <Route path="/bot/new" element={<ProtectedRoute><BotEditor /></ProtectedRoute>} />
    <Route path="/bot/:botId" element={<ProtectedRoute><BotEditor /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

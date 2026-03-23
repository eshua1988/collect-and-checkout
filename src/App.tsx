import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "./pages/Home";
import FormEditor from "./pages/FormEditor";
import FormView from "./pages/FormView";
import FormResults from "./pages/FormResults";
import BotEditor from "./pages/BotEditor";
import DocumentEditor from "./pages/DocumentEditor";
import DocView from "./pages/DocView";
import ProjectEditor from "./pages/ProjectEditor";
import WebsiteEditor from "./pages/WebsiteEditor";
import WebsiteView from "./pages/WebsiteView";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user === null) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/f/:formId" element={<FormView />} />
            <Route path="/d/:docId" element={<DocView />} />

            {/* Protected */}
            <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
            <Route path="/form/new" element={<AuthGuard><FormEditor /></AuthGuard>} />
            <Route path="/form/:formId" element={<AuthGuard><FormEditor /></AuthGuard>} />
            <Route path="/form/:formId/results" element={<AuthGuard><FormResults /></AuthGuard>} />
            <Route path="/bot/new" element={<AuthGuard><BotEditor /></AuthGuard>} />
            <Route path="/bot/:botId" element={<AuthGuard><BotEditor /></AuthGuard>} />
            <Route path="/doc/new" element={<AuthGuard><DocumentEditor /></AuthGuard>} />
            <Route path="/doc/:docId" element={<AuthGuard><DocumentEditor /></AuthGuard>} />
            <Route path="/project/new" element={<AuthGuard><ProjectEditor /></AuthGuard>} />
            <Route path="/project/:projectId" element={<AuthGuard><ProjectEditorRoute /></AuthGuard>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

// Wrapper to pass projectId from params
function ProjectEditorRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  return <ProjectEditor projectId={projectId} />;
}

export default App;

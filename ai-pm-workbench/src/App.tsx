import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { ProjectWorkspace } from "./components/workspace/ProjectWorkspace";
import Roadmap from "./pages/Roadmap";
import CompanyInfo from "./pages/CompanyInfo";
import Profile from "./pages/Profile";
import Templates from "./pages/Templates";
import Integrations from "./pages/Integrations";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <MainLayout>
                <Index />
              </MainLayout>
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <MainLayout>
                <ProjectWorkspace />
              </MainLayout>
            }
          />
          <Route
            path="/project/:projectId/roadmap"
            element={
              <MainLayout>
                <Roadmap />
              </MainLayout>
            }
          />
          <Route
            path="/company-info"
            element={
              <MainLayout>
                <CompanyInfo />
              </MainLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <MainLayout>
                <Profile />
              </MainLayout>
            }
          />
          <Route
            path="/templates"
            element={
              <MainLayout>
                <Templates />
              </MainLayout>
            }
          />
          <Route
            path="/integrations"
            element={
              <MainLayout>
                <Integrations />
              </MainLayout>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

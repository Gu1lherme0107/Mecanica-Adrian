import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Servicos from "./pages/Servicos";
import AgendaPage from "./pages/AgendaPage";
import EstoquePage from "./pages/EstoquePage";
import BackupPage from "./pages/BackupPage";
import DebugPage from "./pages/DebugPage";
import NotFound from "./pages/NotFound";
import { useAutoSave } from "./hooks/useAutoSave";

const queryClient = new QueryClient();

function AppContent() {
  // Ativar auto-save
  useAutoSave(5000); // A cada 5 segundos

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/servicos" element={<Servicos />} />
      <Route path="/agenda" element={<AgendaPage />} />
      <Route path="/estoque" element={<EstoquePage />} />
      <Route path="/backup" element={<BackupPage />} />
      <Route path="/debug" element={<DebugPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppLayout>
            <AppContent />
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LandingPage from "./components/LandingPages/LandingPage";
import TuneOra from "./pages/TuneOra";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  
  const navigate = useNavigate();
  const handleGetStartedClick = () => {
    navigate('/LoginPage');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route
              path="/"
              element={<LandingPage onGetStartedClick={handleGetStartedClick} />}
            />

            <Route path="/LoginPage" element={<LoginPage />} />
            <Route path="/RegisterPage" element={<RegisterPage />} />
            <Route path="/TuneOra" element={<TuneOra />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// We wrap the exported component with <BrowserRouter> so that the useNavigate hook
// inside the App component is within the router context.
const RootApp = () => (
    <BrowserRouter>
        <App />
    </BrowserRouter>
);

export default RootApp;


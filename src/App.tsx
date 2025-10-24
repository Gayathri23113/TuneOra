// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route, useNavigate  } from "react-router-dom";
// import LandingPage from "./components/LandingPages/LandingPage";
// import TuneOra from "./pages/TuneOra";
// import LoginPage from "./pages/LoginPage";
// import RegisterPage from "./pages/RegisterPage";
// import NotFound from "./pages/NotFound";

// const queryClient = new QueryClient();



// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <BrowserRouter>
//         <Routes>
//           {/* <Route path="/" element={<Navigate to="/LoginPage" replace />} /> */}
//           {/* <Route path="/" element={<LandingPage />} /> */}
//           <Route path="/LoginPage" element={<LoginPage />} />
//           <Route path="/RegisterPage" element={<RegisterPage />} />
//           <Route path="/TuneOra" element={<TuneOra />} />
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// );


// export default App;




import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

// --- FIXED IMPORT PATHS (Attempt 3: Using ../../) ---
// If App.tsx is nested (e.g., in src/routes), and pages/components are in src/pages 
// and src/components, we might need two steps up to reach the root folder 
// where 'pages' and 'components' directories are located.
import LandingPage from "./components/LandingPages/LandingPage";
import TuneOra from "./pages/TuneOra";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// The App component is now a function where hooks can be used
const App = () => {
  // NOTE: useNavigate MUST be inside a component wrapped by <BrowserRouter>.
  const navigate = useNavigate();

  // Define the function that handles the "Get Started" click
  const handleGetStartedClick = () => {
    // Programmatically navigate to the LoginPage route
    navigate('/LoginPage');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* The root path now uses the LandingPage and passes the navigation handler */}
          <Route 
            path="/" 
            element={
              <LandingPage onGetStartedClick={handleGetStartedClick} />
            } 
          />
          
          <Route path="/LoginPage" element={<LoginPage />} />
          <Route path="/RegisterPage" element={<RegisterPage />} />
          <Route path="/TuneOra" element={<TuneOra />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
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

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Directory from "./pages/Directory";
import About from "./pages/About";
import VoiceOfRen from "./pages/VoiceOfRen";
import KeyMoments from "./pages/KeyMoments";
import Admin from "./pages/Admin";
import Member from "./pages/Member";
import Cities from "./pages/admin/Cities";
import Chapters from "./pages/admin/Chapters";
import Members from "./pages/admin/Members";
import Applications from "./pages/admin/Applications";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { LanguageProvider } from "./i18n/LanguageProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/key-moments" element={<KeyMoments />} />
          <Route path="/about" element={<About />} />
          <Route path="/voice" element={<VoiceOfRen />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/cities" 
            element={
              <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                <Cities />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/chapters" 
            element={
              <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                <Chapters />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/members" 
            element={
              <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                <Members />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/applications" 
            element={
              <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                <Applications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/member" 
            element={
              <ProtectedRoute allowedRoles={["member", "admin", "super_admin"]}>
                <Member />
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;

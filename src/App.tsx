import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Directory from "./pages/Directory";
import About from "./pages/About";
import VoiceOfRen from "./pages/VoiceOfRen";
import KeyMoments from "./pages/KeyMoments";
import Admin from "./pages/Admin";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/Dashboard";
import DashboardDirectory from "./pages/DashboardDirectory";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Members from "./pages/admin/Members";
import Applications from "./pages/admin/Applications";
import ManageRoles from "./pages/admin/ManageRoles";
import MyProfile from "./pages/MyProfile";
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
          <PwaInstallPrompt />
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
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Admin />} />
            <Route path="applications" element={<Applications />} />
            <Route path="members" element={<Members />} />
            <Route
              path="manage-roles"
              element={
                <ProtectedRoute allowedRoles={["super_admin"]}>
                  <ManageRoles />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["member", "admin", "super_admin"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="applications" element={<Applications />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="directory" element={<DashboardDirectory />} />
          </Route>
          {/* Legacy redirect */}
          <Route path="/member" element={<Navigate to="/dashboard" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;

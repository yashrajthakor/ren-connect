import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import RootRoute from "./pages/RootRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
import AdminLeads from "./pages/admin/Leads";
import LeadsPage from "./pages/dashboard/Leads";
import NotificationsPage from "./pages/dashboard/Notifications";
import AdminAnnouncements from "./pages/admin/Announcements";
import MyProfile from "./pages/MyProfile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { AuthProvider } from "./context/AuthContext";
import { useServiceWorkerUpdate } from "./hooks/useServiceWorkerUpdate";
import { Button } from "./components/ui/button";
import { Alert, AlertDescription } from "./components/ui/alert";
import { RefreshCw } from "lucide-react";


const queryClient = new QueryClient();

const App = () => {
  const { showUpdatePrompt, updateApp, dismissPrompt } = useServiceWorkerUpdate();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {showUpdatePrompt && (
              <div className="fixed top-4 right-4 z-50 max-w-sm">
                <Alert>
                  <RefreshCw className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>A new version is available!</span>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" onClick={updateApp}>
                        Update
                      </Button>
                      <Button size="sm" variant="outline" onClick={dismissPrompt}>
                        Later
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
            <BrowserRouter>
              <PwaInstallPrompt />
              <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
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
                <Route path="leads" element={<AdminLeads />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
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
                <Route path="settings" element={<Settings />} />
                <Route path="directory" element={<DashboardDirectory />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
              {/* Legacy redirect */}
              <Route path="/member" element={<Navigate to="/dashboard" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

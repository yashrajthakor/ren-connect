import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import SplashScreen from "./components/SplashScreen";
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
import DashboardNews from "./pages/DashboardNews";
import DashboardNewsArticle from "./pages/DashboardNewsArticle";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Members from "./pages/admin/Members";
import ValuableMembers from "./pages/admin/ValuableMembers";
import ValuableMemberDetails from "./pages/admin/ValuableMemberDetails";
import ValuableMemberActivity from "./pages/admin/ValuableMemberActivity";
import ValuableMemberProfile from "./pages/admin/ValuableMemberProfile";
import ValuableMemberRenew from "./pages/admin/ValuableMemberRenew";
import ValuableMemberAttendance from "./pages/admin/ValuableMemberAttendance";
import ValuableMemberQrCode from "./pages/admin/ValuableMemberQrCode";
import AttendanceMeetings from "./pages/admin/attendance/AttendanceMeetings";
import LiveAttendance from "./pages/admin/attendance/LiveAttendance";
import AttendanceHistoryList from "./pages/admin/attendance/AttendanceHistoryList";
import AttendanceHistoryDetail from "./pages/admin/attendance/AttendanceHistoryDetail";
import Applications from "./pages/admin/Applications";
import ManageRoles from "./pages/admin/ManageRoles";
import AdminLeads from "./pages/admin/Leads";
import AdminCategories from "./pages/admin/Categories";
import LeadsPage from "./pages/dashboard/Leads";
import AsksPage from "./pages/dashboard/Asks";
import MeetingsPage from "./pages/dashboard/Meetings";
import AdminAsks from "./pages/admin/Asks";
import AdminMeetings from "./pages/admin/Meetings";
import NotificationsPage from "./pages/dashboard/Notifications";
import MorePage from "./pages/dashboard/More";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminNoticeBoard from "./pages/admin/NoticeBoard";
import AdminSponsors from "./pages/admin/Sponsors";
import AdminNewsletter from "./pages/admin/Newsletter";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
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

// Routes under /admin that the narrow "attendance_head" role must NOT reach —
// wraps each in its own guard so a direct URL visit still bounces them out,
// even though the outer /admin route now also allows attendance_head in.
const fullAdminOnly = (el: JSX.Element) => (
  <ProtectedRoute allowedRoles={["admin", "super_admin"]}>{el}</ProtectedRoute>
);

const App = () => {
  const { showUpdatePrompt, updateApp, dismissPrompt } = useServiceWorkerUpdate();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <SplashScreen />
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
              <Route path="/news" element={<News />} />
              <Route path="/news/:slug" element={<NewsArticle />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin", "super_admin", "attendance_head"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={fullAdminOnly(<Admin />)} />
                <Route path="applications" element={fullAdminOnly(<Applications />)} />
                <Route path="members" element={fullAdminOnly(<Members />)} />
                <Route path="valuable-members" element={fullAdminOnly(<ValuableMembers />)} />
                <Route path="valuable-members/:memberId/details" element={fullAdminOnly(<ValuableMemberDetails />)} />
                <Route path="valuable-members/:memberId/activity" element={fullAdminOnly(<ValuableMemberActivity />)} />
                <Route path="valuable-members/:memberId/profile" element={fullAdminOnly(<ValuableMemberProfile />)} />
                <Route path="valuable-members/:memberId/renew" element={fullAdminOnly(<ValuableMemberRenew />)} />
                <Route path="valuable-members/:memberId/attendance" element={fullAdminOnly(<ValuableMemberAttendance />)} />
                <Route path="valuable-members/:memberId/qr-code" element={fullAdminOnly(<ValuableMemberQrCode />)} />
                <Route path="categories" element={fullAdminOnly(<AdminCategories />)} />
                <Route path="leads" element={fullAdminOnly(<AdminLeads />)} />
                <Route path="asks" element={fullAdminOnly(<AdminAsks />)} />
                <Route path="meetings" element={fullAdminOnly(<AdminMeetings />)} />
                <Route path="attendance/meetings" element={<AttendanceMeetings />} />
                <Route path="attendance/live" element={<LiveAttendance />} />
                <Route path="attendance/history" element={<AttendanceHistoryList />} />
                <Route path="attendance/history/:meetingId" element={<AttendanceHistoryDetail />} />
                <Route path="announcements" element={fullAdminOnly(<AdminAnnouncements />)} />
                <Route path="notice-board" element={fullAdminOnly(<AdminNoticeBoard />)} />
                <Route path="sponsors" element={fullAdminOnly(<AdminSponsors />)} />
                <Route path="newsletter" element={fullAdminOnly(<AdminNewsletter />)} />
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
                <Route path="news" element={<DashboardNews />} />
                <Route path="news/:slug" element={<DashboardNewsArticle />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="asks" element={<AsksPage />} />
                <Route path="meetings" element={<MeetingsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="more" element={<MorePage />} />
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

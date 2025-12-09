import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import '@/i18n';
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// Company Layout & Pages
import { CompanyLayout } from "./layouts/CompanyLayout";
import CompanyDashboard from "./pages/company/Dashboard";
import Students from "./pages/company/Students";
import HumanResources from "./pages/company/HumanResources";
import Classes from "./pages/company/Classes";
import Communication from "./pages/company/Communication";
import Financial from "./pages/company/Financial";
import Equipment from "./pages/company/Equipment";
import Shop from "./pages/company/Shop";
import Events from "./pages/company/Events";
import CompanySettings from "./pages/company/Settings";

// Student Layout & Pages
import { StudentLayout } from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/Dashboard";
import StudentClasses from "./pages/student/Classes";
import TrainingPlans from "./pages/student/TrainingPlans";
import NutritionPlan from "./pages/student/Nutrition";
import Payments from "./pages/student/Payments";
import StudentChat from "./pages/student/Chat";
import StudentSettings from "./pages/student/Settings";

// Personal Trainer Layout & Pages
import PersonalLayout from "./layouts/PersonalLayout";
import PersonalDashboard from "./pages/personal/Dashboard";
import PersonalStudents from "./pages/personal/Students";
import PersonalSchedule from "./pages/personal/Schedule";
import PersonalTrainingPlans from "./pages/personal/TrainingPlans";
import PersonalNutrition from "./pages/personal/Nutrition";
import PersonalFinancial from "./pages/personal/Financial";
import PersonalAttendance from "./pages/personal/Attendance";
import PersonalChat from "./pages/personal/Chat";
import PersonalSettings from "./pages/personal/Settings";

// Admin Layout & Pages
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminCompanies from "./pages/admin/Companies";
import AdminPlans from "./pages/admin/Plans";
import AdminPermissions from "./pages/admin/Permissions";
import AdminReports from "./pages/admin/Reports";
import AdminMonitoring from "./pages/admin/Monitoring";
import AdminEvents from "./pages/admin/Events";
import AdminRoadmap from "./pages/admin/Roadmap";
import AdminSettings from "./pages/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Company Dashboard Routes */}
          <Route path="/company" element={<CompanyLayout />}>
            <Route index element={<CompanyDashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="hr" element={<HumanResources />} />
            <Route path="classes" element={<Classes />} />
            <Route path="communication" element={<Communication />} />
            <Route path="financial" element={<Financial />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="shop" element={<Shop />} />
            <Route path="events" element={<Events />} />
            <Route path="settings" element={<CompanySettings />} />
          </Route>
          
          {/* Student Dashboard Routes */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="classes" element={<StudentClasses />} />
            <Route path="plans" element={<TrainingPlans />} />
            <Route path="nutrition" element={<NutritionPlan />} />
            <Route path="payments" element={<Payments />} />
            <Route path="chat" element={<StudentChat />} />
            <Route path="settings" element={<StudentSettings />} />
          </Route>

          {/* Personal Trainer Dashboard Routes */}
          <Route path="/personal" element={<PersonalLayout />}>
            <Route index element={<PersonalDashboard />} />
            <Route path="students" element={<PersonalStudents />} />
            <Route path="schedule" element={<PersonalSchedule />} />
            <Route path="training-plans" element={<PersonalTrainingPlans />} />
            <Route path="nutrition" element={<PersonalNutrition />} />
            <Route path="financial" element={<PersonalFinancial />} />
            <Route path="attendance" element={<PersonalAttendance />} />
            <Route path="chat" element={<PersonalChat />} />
            <Route path="settings" element={<PersonalSettings />} />
          </Route>

          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="companies" element={<AdminCompanies />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="permissions" element={<AdminPermissions />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="monitoring" element={<AdminMonitoring />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="roadmap" element={<AdminRoadmap />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/home";
import ChatbotPage from "@/pages/features/chatbot";
import RecordsPage from "@/pages/features/records";
import MyAppointmentsPage from "@/pages/features/my-appointments";
import FindVetPage from "@/pages/features/find-vet";
import EmergencyPage from "@/pages/features/emergency";
import PredictionPage from "@/pages/features/prediction";
import NotFound from "@/pages/not-found";

import { DoctorOnboardWizard, DoctorDashboard } from "@/features/doctor";
import { SuperAdminDoctorPanel } from "@/features/admin";
import SuperAdminRegisterPage from "@/pages/admin/SuperAdminRegisterPage";
import { RoleRouteGuard } from "./RoleRouteGuard";
import { AuthRouteGuard } from "./AuthRouteGuard";
import { ScrollToTop } from "./ScrollToTop";

export function AppRoutes() {
  return (
    <TooltipProvider>
      <ScrollToTop />
      <Switch>
        {/* Special Super Admin Registration Gateway */}
        <Route path="/super/admin-register" component={SuperAdminRegisterPage} />
        <Route path="/super-admin-register" component={SuperAdminRegisterPage} />

        {/* Core & Landing */}
        <Route path="/" component={Home} />

        {/* AI & Feature Pages (Require Login / Registration First) */}
        <Route path="/features/chatbot">
          {() => (
            <AuthRouteGuard featureName="Cattle AI Chatbot">
              <ChatbotPage />
            </AuthRouteGuard>
          )}
        </Route>
        <Route path="/features/records">
          {() => (
            <AuthRouteGuard featureName="Digital Animal Records">
              <RecordsPage />
            </AuthRouteGuard>
          )}
        </Route>
        <Route path="/my-appointments">
          {() => (
            <AuthRouteGuard featureName="My Appointments">
              <MyAppointmentsPage />
            </AuthRouteGuard>
          )}
        </Route>
        <Route path="/features/my-appointments">
          {() => (
            <AuthRouteGuard featureName="My Appointments">
              <MyAppointmentsPage />
            </AuthRouteGuard>
          )}
        </Route>
        <Route path="/features/find-vet">
          {() => (
            <AuthRouteGuard featureName="Find a Vet & Doctor Scheduling">
              <FindVetPage />
            </AuthRouteGuard>
          )}
        </Route>
        <Route path="/features/emergency">
          {() => (
            <AuthRouteGuard featureName="24/7 Emergency Veterinary Care">
              <EmergencyPage />
            </AuthRouteGuard>
          )}
        </Route>

        {/* Buffalo / Cattle Monitor Dashboard (Strictly restricted to super_admin) */}
        <Route path="/cattle-dashboard">
          {() => (
            <RoleRouteGuard allowedRoles={["super_admin"]} moduleName="Buffalo Monitor Dashboard">
              <PredictionPage />
            </RoleRouteGuard>
          )}
        </Route>
        <Route path="/features/prediction">
          {() => (
            <RoleRouteGuard allowedRoles={["super_admin"]} moduleName="Buffalo Monitor Dashboard">
              <PredictionPage />
            </RoleRouteGuard>
          )}
        </Route>
        <Route path="/cow-manager">
          {() => (
            <RoleRouteGuard allowedRoles={["super_admin"]} moduleName="Buffalo Monitor Dashboard">
              <PredictionPage />
            </RoleRouteGuard>
          )}
        </Route>
        <Route path="/buffalo-monitor">
          {() => (
            <RoleRouteGuard allowedRoles={["super_admin"]} moduleName="Buffalo Monitor Dashboard">
              <PredictionPage />
            </RoleRouteGuard>
          )}
        </Route>

        {/* Doctor Module (Strictly restricted to registered doctor role) */}
        <Route path="/doctor/onboard">
          {() => (
            <RoleRouteGuard allowedRoles={["doctor"]} moduleName="Veterinary Onboarding">
              <DoctorOnboardWizard />
            </RoleRouteGuard>
          )}
        </Route>
        <Route path="/doctor/dashboard">
          {() => (
            <RoleRouteGuard allowedRoles={["doctor"]} moduleName="Doctor Dashboard">
              <DoctorDashboard />
            </RoleRouteGuard>
          )}
        </Route>

        {/* Admin Module (Strictly restricted to super_admin) */}
        <Route path="/super-admin">
          {() => (
            <RoleRouteGuard allowedRoles={["super_admin"]}>
              <SuperAdminDoctorPanel />
            </RoleRouteGuard>
          )}
        </Route>

        {/* 404 Fallback */}
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

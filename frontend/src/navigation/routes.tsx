import type { ComponentType, JSX } from "react";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import ReferralsPage from "@/pages/ReferralsPage";
import LeaderBoardPage from "@/pages/LeaderBoardPage";
import TasksPage from "@/pages/TasksPage";
import DashboardPage from "@/pages/DashboardPage";
// import MaintenancePage from "@/pages/MaintenancePage";

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: "/admin-login", Component: AdminDashboard },
  // { path: "/", Component: MaintenancePage },

  // Public Routes
  { path: "/login", Component: LoginPage },
  { path: "/register", Component: RegisterPage },
  {
    path: "/",
    Component: () => (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    Component: () => (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tasks",
    Component: () => (
      <ProtectedRoute>
        <TasksPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/leaderboard",
    Component: () => (
      <ProtectedRoute>
        <LeaderBoardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/referrals",
    Component: () => (
      <ProtectedRoute>
        <ReferralsPage />
      </ProtectedRoute>
    ),
  },
];

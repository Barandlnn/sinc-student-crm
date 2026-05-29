import { createBrowserRouter, Navigate } from "react-router";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute, RoleRoute } from "@/lib/auth";

import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ClientsPage } from "@/pages/ClientsPage";
import { ClientDetailPage } from "@/pages/ClientDetailPage";
import { ConversationsPage } from "@/pages/ConversationsPage";
import { PipelinePage } from "@/pages/PipelinePage";
import { DealDetailPage } from "@/pages/DealDetailPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <RoleRoute allowedRoles={["manager", "sales"]}>
            <DashboardPage />
          </RoleRoute>
        ),
      },
      {
        path: "clients",
        element: (
          <RoleRoute allowedRoles={["manager", "sales"]}>
            <ClientsPage />
          </RoleRoute>
        ),
      },
      {
        path: "clients/:id",
        element: (
          <RoleRoute allowedRoles={["manager", "sales"]}>
            <ClientDetailPage />
          </RoleRoute>
        ),
      },
      {
        path: "conversations",
        element: (
          <RoleRoute allowedRoles={["manager", "sales", "client"]}>
            <ConversationsPage />
          </RoleRoute>
        ),
      },
      {
        path: "pipeline",
        element: (
          <RoleRoute allowedRoles={["manager", "sales"]}>
            <PipelinePage />
          </RoleRoute>
        ),
      },
      {
        path: "pipeline/:id",
        element: (
          <RoleRoute allowedRoles={["manager", "sales"]}>
            <DealDetailPage />
          </RoleRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
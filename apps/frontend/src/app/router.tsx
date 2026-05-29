import { createBrowserRouter, Navigate } from "react-router";
import App from "@/App";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ClientsPage } from "@/pages/ClientsPage";
import { ClientDetailPage } from "@/pages/ClientDetailPage";
import { ConversationsPage } from "@/pages/ConversationsPage";
import { PipelinePage } from "@/pages/PipelinePage";
import { DealDetailPage } from "@/pages/DealDetailPage";
import { ProtectedRoute, RoleRoute } from "@/lib/auth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
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
            path: "clients/:clientId",
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
            path: "deals/:dealId",
            element: (
              <RoleRoute allowedRoles={["manager", "sales"]}>
                <DealDetailPage />
              </RoleRoute>
            ),
          },
        ],
      },
    ],
  },
]);
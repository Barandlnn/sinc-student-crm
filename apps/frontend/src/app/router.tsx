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
import { ProtectedRoute } from "@/lib/auth";

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
            element: <DashboardPage />,
          },
          {
            path: "clients",
            element: <ClientsPage />,
          },
          {
            path: "clients/:clientId",
            element: <ClientDetailPage />,
          },
          {
            path: "conversations",
            element: <ConversationsPage />,
          },
          {
            path: "pipeline",
            element: <PipelinePage />,
          },
          {
            path: "deals/:dealId",
            element: <DealDetailPage />,
          },
        ],
      },
    ],
  },
]);
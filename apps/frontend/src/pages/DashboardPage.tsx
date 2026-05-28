import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";

type DashboardResponse = {
  conversationsByStatus: {
    open: number;
    pending: number;
    closed: number;
  };
  unassignedConversations: number;
  dealsByStage: Record<string, number>;
  dealsByOwner: {
    ownerName: string;
    count: number;
  }[];
  recentActivity: string[];
};

type MeResponse = {
  user: {
    id: string;
    email: string;
  };
  profile: {
    id: string;
    email: string;
    full_name: string;
    role: "manager" | "sales" | "client";
  };
};

export function DashboardPage() {
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: () => apiRequest<DashboardResponse>("/dashboard"),
  });

  const {
    data: meData,
    isLoading: isMeLoading,
    isError: isMeError,
    error: meError,
  } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: () => apiRequest<MeResponse>("/me"),
  });

  if (isLoading) {
    return <p>Loading dashboard...</p>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border bg-white p-5 text-red-600">
        Dashboard could not be loaded: {error.message}
      </div>
    );
  }

  if (!data) {
    return <p>No dashboard data found.</p>;
  }

  const activeDeals = Object.entries(data.dealsByStage)
    .filter(([stage]) => stage !== "won" && stage !== "lost")
    .reduce((total, [, count]) => total + count, 0);

  const wonDeals = data.dealsByStage.won ?? 0;

  const stats = [
    {
      label: "Open Chats",
      value: data.conversationsByStatus.open,
    },
    {
      label: "Unassigned",
      value: data.unassignedConversations,
    },
    {
      label: "Active Deals",
      value: activeDeals,
    },
    {
      label: "Won Deals",
      value: wonDeals,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-600">
          Dashboard data is loaded from the Worker API.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="font-semibold">Current Auth User Test</h2>

        {isMeLoading && (
          <p className="mt-3 text-sm text-slate-600">Loading current user...</p>
        )}

        {isMeError && (
          <p className="mt-3 text-sm text-red-600">
            Current user could not be loaded: {meError.message}
          </p>
        )}

        {meData && (
          <pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
            {JSON.stringify(meData, null, 2)}
          </pre>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Deals by Stage</h2>

          <div className="mt-4 space-y-2 text-sm">
            {Object.entries(data.dealsByStage).map(([stage, count]) => (
              <div key={stage} className="flex justify-between">
                <span className="capitalize">{stage.replaceAll("_", " ")}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Deals by Owner</h2>

          <div className="mt-4 space-y-2 text-sm">
            {data.dealsByOwner.map((item) => (
              <div key={item.ownerName} className="flex justify-between">
                <span>{item.ownerName}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="font-semibold">Recent Activity</h2>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          {data.recentActivity.map((activity) => (
            <p key={activity}>{activity}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
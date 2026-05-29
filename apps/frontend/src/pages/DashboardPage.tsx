import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";

type DashboardResponse = {
  conversationsByStatus?: {
    open?: number;
    pending?: number;
    closed?: number;
  };
  unassignedConversations?: number;
  dealsByStage?: Record<string, number>;
  dealsByOwner?: {
    ownerName: string;
    count: number;
  }[];
  recentActivity?: string[];
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

  if (isLoading) {
    return <p>Loading dashboard...</p>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border bg-white p-5 text-red-600">
        Dashboard could not be loaded: {(error as Error).message}
      </div>
    );
  }

  if (!data) {
    return <p>No dashboard data found.</p>;
  }

  const conversationsByStatus = data.conversationsByStatus ?? {
    open: 0,
    pending: 0,
    closed: 0,
  };

  const dealsByStage = data.dealsByStage ?? {};
  const dealsByOwner = data.dealsByOwner ?? [];
  const recentActivity = data.recentActivity ?? [];

  const activeDeals = Object.entries(dealsByStage)
    .filter(([stage]) => stage !== "won" && stage !== "lost")
    .reduce((total, [, count]) => total + count, 0);

  const wonDeals = dealsByStage.won ?? 0;

  const stats = [
    {
      label: "Open Chats",
      value: conversationsByStatus.open ?? 0,
    },
    {
      label: "Unassigned",
      value: data.unassignedConversations ?? 0,
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
          Overview of conversations and deal pipeline.
        </p>
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
          <h2 className="font-semibold">Conversations by Status</h2>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Open</span>
              <span className="font-medium">
                {conversationsByStatus.open ?? 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Pending</span>
              <span className="font-medium">
                {conversationsByStatus.pending ?? 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Closed</span>
              <span className="font-medium">
                {conversationsByStatus.closed ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Deals by Stage</h2>

          <div className="mt-4 space-y-2 text-sm">
            {Object.entries(dealsByStage).length === 0 ? (
              <p className="text-slate-500">No deals found.</p>
            ) : (
              Object.entries(dealsByStage).map(([stage, count]) => (
                <div key={stage} className="flex justify-between">
                  <span className="capitalize">
                    {stage.replaceAll("_", " ")}
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Deals by Owner</h2>

          <div className="mt-4 space-y-2 text-sm">
            {dealsByOwner.length === 0 ? (
              <p className="text-slate-500">No owner data found.</p>
            ) : (
              dealsByOwner.map((item) => (
                <div key={item.ownerName} className="flex justify-between">
                  <span>{item.ownerName}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Recent Activity</h2>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {recentActivity.length === 0 ? (
              <p>No recent activity found.</p>
            ) : (
              recentActivity.map((activity) => (
                <p key={activity}>{activity}</p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
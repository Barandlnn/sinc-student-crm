import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";

type RecentActivity = {
  id: string;
  type: "conversation" | "deal" | string;
  title: string;
  description: string;
  timestamp: string;
};

type DashboardResponse = {
  openChats?: number;
  open_chats?: number;

  unassigned?: number;
  unassignedConversations?: number;
  unassigned_conversations?: number;

  activeDeals?: number;
  active_deals?: number;

  wonDeals?: number;
  won_deals?: number;

  dealsByStage?: Record<string, number>;
  deals_by_stage?: Record<string, number>;

  dealsByOwner?: Record<string, number>;
  deals_by_owner?: Record<string, number>;

  recentActivity?: RecentActivity[];
  recent_activity?: RecentActivity[];

  stats?: {
    openChats?: number;
    unassignedConversations?: number;
    activeDeals?: number;
    wonDeals?: number;
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

  const dealsByStage =
    data.dealsByStage ??
    data.deals_by_stage ??
    {};

  const dealsByOwner =
    data.dealsByOwner ??
    data.deals_by_owner ??
    {};

  const recentActivity =
    data.recentActivity ??
    data.recent_activity ??
    [];

  const calculatedActiveDeals = Object.entries(dealsByStage)
    .filter(([stage]) => stage !== "won" && stage !== "lost")
    .reduce((total, [, count]) => total + count, 0);

  const openChats =
    data.stats?.openChats ??
    data.openChats ??
    data.open_chats ??
    0;

  const unassignedConversations =
    data.stats?.unassignedConversations ??
    data.unassignedConversations ??
    data.unassigned_conversations ??
    data.unassigned ??
    0;

  const activeDeals =
    data.stats?.activeDeals ??
    data.activeDeals ??
    data.active_deals ??
    calculatedActiveDeals;

  const wonDeals =
    data.stats?.wonDeals ??
    data.wonDeals ??
    data.won_deals ??
    dealsByStage.won ??
    0;

  const stats = [
    {
      label: "Open Chats",
      value: openChats,
    },
    {
      label: "Unassigned",
      value: unassignedConversations,
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
          <h2 className="font-semibold">Conversation Summary</h2>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Open Chats</span>
              <span className="font-medium">{openChats}</span>
            </div>

            <div className="flex justify-between">
              <span>Unassigned</span>
              <span className="font-medium">{unassignedConversations}</span>
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
            {Object.entries(dealsByOwner).length === 0 ? (
              <p className="text-slate-500">No owner data found.</p>
            ) : (
              Object.entries(dealsByOwner).map(([ownerName, count]) => (
                <div key={ownerName} className="flex justify-between">
                  <span>{ownerName}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Recent Activity</h2>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {recentActivity.length === 0 ? (
              <p>No recent activity found.</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="rounded-xl border p-3">
                  <p className="font-medium text-slate-900">
                    {activity.title}
                  </p>

                  <p className="mt-1">{activity.description}</p>

                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
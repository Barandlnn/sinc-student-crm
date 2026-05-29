import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/apiClient";

type Client = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  target_country?: string | null;
  target_program?: string | null;
  status?: string | null;
  source?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Conversation = {
  id: string;
  client_id: string;
  title?: string | null;
  subject?: string | null;
  status?: string | null;
  assigned_to?: string | null;
  created_at?: string | null;
  last_message_at?: string | null;
};

type Deal = {
  id: string;
  client_id: string | null;
  owner_id: string | null;
  title: string;
  stage: string;
  value: number | null;
  currency?: string | null;
  expected_close_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ActivityItem = {
  id: string;
  type: "conversation" | "deal" | string;
  title: string;
  description: string;
  timestamp: string;
};

type ClientDetailResponse = {
  client: Client;
  conversations: Conversation[];
  deals: Deal[];
  activity: ActivityItem[];
};

function getClientName(client: Client) {
  return client.full_name ?? client.name ?? client.email ?? "Unnamed Client";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function formatStage(stage: string | null | undefined) {
  if (!stage) {
    return "-";
  }

  return stage.replaceAll("_", " ");
}

function formatMoney(value: number | null | undefined, currency?: string | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${currency ?? "USD"} ${Number(value).toLocaleString()}`;
}

export function ClientDetailPage() {
  const { id } = useParams();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<ClientDetailResponse>({
    queryKey: ["client", id],
    queryFn: () => apiRequest<ClientDetailResponse>(`/clients/${id}`),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <p>Loading client...</p>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border bg-white p-5 text-red-600">
        Client could not be loaded: {(error as Error).message}
      </div>
    );
  }

  if (!data) {
    return <p>No client found.</p>;
  }

  const { client, conversations, deals, activity } = data;

  const profileFields = [
    {
      label: "Name",
      value: getClientName(client),
    },
    {
      label: "Email",
      value: client.email ?? "-",
    },
    {
      label: "Phone",
      value: client.phone ?? "-",
    },
    {
      label: "Country",
      value: client.country ?? "-",
    },
    {
      label: "Target Country",
      value: client.target_country ?? "-",
    },
    {
      label: "Target Program",
      value: client.target_program ?? "-",
    },
    {
      label: "Status",
      value: client.status ?? "-",
    },
    {
      label: "Source",
      value: client.source ?? "-",
    },
    {
      label: "Created At",
      value: formatDate(client.created_at),
    },
    {
      label: "Updated At",
      value: formatDate(client.updated_at),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/clients"
          className="text-sm font-medium text-slate-600 underline"
        >
          ← Back to Clients
        </Link>

        <h1 className="mt-4 text-3xl font-bold">{getClientName(client)}</h1>

        <p className="mt-1 text-slate-600">
          Client profile, conversations, deals, and activity history.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Conversations</p>
          <p className="mt-2 text-3xl font-bold">{conversations.length}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Deals</p>
          <p className="mt-2 text-3xl font-bold">{deals.length}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Open Deals</p>
          <p className="mt-2 text-3xl font-bold">
            {
              deals.filter(
                (deal) => deal.stage !== "won" && deal.stage !== "lost"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Won Deals</p>
          <p className="mt-2 text-3xl font-bold">
            {deals.filter((deal) => deal.stage === "won").length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Client Profile</h2>

        <div className="mt-4 divide-y">
          {profileFields.map((field) => (
            <div
              key={field.label}
              className="grid gap-2 py-3 text-sm md:grid-cols-3"
            >
              <p className="font-medium text-slate-500">{field.label}</p>
              <p className="break-all md:col-span-2">{field.value}</p>
            </div>
          ))}
        </div>

        {client.notes && (
          <div className="mt-4 rounded-xl border bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Notes</p>
            <p className="mt-2 text-sm">{client.notes}</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Conversations</h2>
              <p className="mt-1 text-sm text-slate-600">
                Chat threads connected to this client.
              </p>
            </div>

            <Link
              to="/conversations"
              className="rounded-xl border px-3 py-2 text-sm font-medium"
            >
              Open Chat
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {conversations.length === 0 && (
              <p className="text-sm text-slate-500">
                No conversations found for this client.
              </p>
            )}

            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="rounded-xl border bg-slate-50 p-4"
              >
                <p className="font-medium">
                  {conversation.title ??
                    conversation.subject ??
                    "Untitled Conversation"}
                </p>

                <div className="mt-2 grid gap-1 text-sm text-slate-600">
                  <p>Status: {conversation.status ?? "-"}</p>
                  <p>
                    Assigned:{" "}
                    {conversation.assigned_to ? "Assigned" : "Unassigned"}
                  </p>
                  <p>
                    Last Message: {formatDate(conversation.last_message_at)}
                  </p>
                  <p>Created: {formatDate(conversation.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Deals</h2>
              <p className="mt-1 text-sm text-slate-600">
                Sales pipeline deals for this client.
              </p>
            </div>

            <Link
              to="/pipeline"
              className="rounded-xl border px-3 py-2 text-sm font-medium"
            >
              Open Pipeline
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {deals.length === 0 && (
              <p className="text-sm text-slate-500">
                No deals found for this client.
              </p>
            )}

            {deals.map((deal) => (
              <Link
                key={deal.id}
                to={`/pipeline/${deal.id}`}
                className="block rounded-xl border bg-slate-50 p-4 hover:bg-slate-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{deal.title}</p>
                    <p className="mt-1 text-sm capitalize text-slate-600">
                      Stage: {formatStage(deal.stage)}
                    </p>
                  </div>

                  <p className="text-sm font-semibold">
                    {formatMoney(deal.value, deal.currency)}
                  </p>
                </div>

                <div className="mt-2 text-sm text-slate-600">
                  <p>Owner ID: {deal.owner_id ?? "Unassigned"}</p>
                  <p>Expected Close: {formatDate(deal.expected_close_date)}</p>
                  <p>Updated: {formatDate(deal.updated_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Recent Activity</h2>

        <p className="mt-1 text-sm text-slate-600">
          Combined CRM activity from conversations and deals.
        </p>

        <div className="mt-4 space-y-3">
          {activity.length === 0 && (
            <p className="text-sm text-slate-500">No recent activity found.</p>
          )}

          {activity.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.description}
                  </p>
                </div>

                <span className="rounded-full border bg-white px-3 py-1 text-xs font-medium capitalize">
                  {item.type}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {formatDate(item.timestamp)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
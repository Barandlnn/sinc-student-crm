import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";

type Deal = {
  id: string;
  client_id: string | null;
  owner_id: string | null;
  title: string;
  stage: string;
  value: number | null;
  currency?: string | null;
  expected_close_date?: string | null;
  created_at: string;
  updated_at: string;
};

function formatStage(stage: string) {
  return stage.replaceAll("_", " ");
}

function formatMoney(value: number | null | undefined, currency?: string | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${currency ?? "USD"} ${Number(value).toLocaleString()}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

export function DealDetailPage() {
  const { id } = useParams();

  const {
    data: deal,
    isLoading,
    isError,
    error,
  } = useQuery<Deal>({
    queryKey: ["deal", id],
    queryFn: () => apiRequest<Deal>(`/deals/${id}`),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <p>Loading deal...</p>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border bg-white p-5 text-red-600">
        Deal could not be loaded: {(error as Error).message}
      </div>
    );
  }

  if (!deal) {
    return <p>No deal found.</p>;
  }

  const fields = [
    {
      label: "Stage",
      value: formatStage(deal.stage),
    },
    {
      label: "Value",
      value: formatMoney(deal.value, deal.currency),
    },
    {
      label: "Owner ID",
      value: deal.owner_id ?? "Unassigned",
    },
    {
      label: "Client ID",
      value: deal.client_id ?? "-",
    },
    {
      label: "Expected Close Date",
      value: formatDate(deal.expected_close_date),
    },
    {
      label: "Created At",
      value: formatDate(deal.created_at),
    },
    {
      label: "Updated At",
      value: formatDate(deal.updated_at),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/pipeline"
          className="text-sm font-medium text-slate-600 underline"
        >
          ← Back to Pipeline
        </Link>

        <h1 className="mt-4 text-3xl font-bold">{deal.title}</h1>

        <p className="mt-1 text-slate-600">
          Deal detail loaded from the Worker API.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Current Stage</p>
          <p className="mt-2 text-2xl font-bold capitalize">
            {formatStage(deal.stage)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Deal Value</p>
          <p className="mt-2 text-2xl font-bold">
            {formatMoney(deal.value, deal.currency)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Owner</p>
          <p className="mt-2 break-all text-lg font-bold">
            {deal.owner_id ?? "Unassigned"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Deal Information</h2>

        <div className="mt-4 divide-y">
          {fields.map((field) => (
            <div
              key={field.label}
              className="grid gap-2 py-3 text-sm md:grid-cols-3"
            >
              <p className="font-medium text-slate-500">{field.label}</p>
              <p className="break-all md:col-span-2">{field.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed bg-white p-5">
        <h2 className="text-lg font-semibold">Next Actions</h2>

        <p className="mt-2 text-sm text-slate-600">
          Stage update, deal notes, and owner reassignment will be implemented
          next.
        </p>
      </div>
    </div>
  );
}
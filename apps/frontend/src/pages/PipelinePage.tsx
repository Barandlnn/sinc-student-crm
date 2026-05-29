import { useMemo, useState } from "react";
import { Link } from "react-router";
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

const STAGES = [
  {
    key: "new_lead",
    label: "New Lead",
  },
  {
    key: "contacted",
    label: "Contacted",
  },
  {
    key: "consultation_booked",
    label: "Consultation Booked",
  },
  {
    key: "proposal_sent",
    label: "Proposal Sent",
  },
  {
    key: "won",
    label: "Won",
  },
  {
    key: "lost",
    label: "Lost",
  },
];

function formatStage(stage: string) {
  return stage.replaceAll("_", " ");
}

function formatMoney(value: number | null | undefined, currency?: string | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${currency ?? "USD"} ${Number(value).toLocaleString()}`;
}

export function PipelinePage() {
  const [search, setSearch] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<Deal[]>({
    queryKey: ["deals"],
    queryFn: () => apiRequest<Deal[]>("/deals"),
  });

  const deals = data ?? [];

  const filteredDeals = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return deals;
    }

    return deals.filter((deal) => {
      return (
        deal.title.toLowerCase().includes(keyword) ||
        deal.stage.toLowerCase().includes(keyword) ||
        String(deal.value ?? "").includes(keyword)
      );
    });
  }, [deals, search]);

  const totalPipelineValue = filteredDeals.reduce((total, deal) => {
    return total + Number(deal.value ?? 0);
  }, 0);

  const activeDeals = filteredDeals.filter((deal) => {
    return deal.stage !== "won" && deal.stage !== "lost";
  });

  if (isLoading) {
    return <p>Loading pipeline...</p>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border bg-white p-5 text-red-600">
        Pipeline could not be loaded: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <p className="text-slate-600">
            Deal pipeline loaded from the Worker API.
          </p>
        </div>

        <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white">
          New Deal
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Total Deals</p>
          <p className="mt-2 text-3xl font-bold">{filteredDeals.length}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Active Deals</p>
          <p className="mt-2 text-3xl font-bold">{activeDeals.length}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Pipeline Value</p>
          <p className="mt-2 text-3xl font-bold">
            USD {totalPipelineValue.toLocaleString()}
          </p>
        </div>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search deals..."
        className="w-full max-w-md rounded-xl border px-4 py-3 outline-none"
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {STAGES.map((stage) => {
          const stageDeals = filteredDeals.filter((deal) => {
            return deal.stage === stage.key;
          });

          return (
            <div key={stage.key} className="rounded-2xl border bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">{stage.label}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                  {stageDeals.length}
                </span>
              </div>

              <div className="space-y-3">
                {stageDeals.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                    No deals in this stage.
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <Link
                      key={deal.id}
                      to={`/pipeline/${deal.id}`}
                      className="block rounded-xl border p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{deal.title}</p>
                          <p className="mt-1 text-sm capitalize text-slate-500">
                            {formatStage(deal.stage)}
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                          {formatMoney(deal.value, deal.currency)}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-slate-500">
                        Owner ID: {deal.owner_id ?? "Unassigned"}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
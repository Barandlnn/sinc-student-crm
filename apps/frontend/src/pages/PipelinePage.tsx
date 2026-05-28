import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";

const stages = [
  "new_lead",
  "contacted",
  "consultation_booked",
  "documents_requested",
  "application_started",
  "submitted",
  "won",
  "lost",
];

type Deal = {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  ownerId: string | null;
  ownerName: string | null;
  stage: string;
  valueAmount?: number;
  valueCurrency?: string;
  expectedIntake?: string;
};

type DealsResponse = {
  data: Deal[];
};

export function PipelinePage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["deals"],
    queryFn: () => apiRequest<DealsResponse>("/deals"),
  });

  if (isLoading) {
    return <p>Loading pipeline...</p>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border bg-white p-5 text-red-600">
        Pipeline could not be loaded: {error.message}
      </div>
    );
  }

  const deals = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <p className="text-slate-600">
            Deal pipeline loaded from the Worker API.
          </p>
        </div>

        <div className="flex gap-2">
          <select className="rounded-lg border bg-white px-3 py-2">
            <option>All owners</option>
            <option>Aigerim</option>
            <option>Dias</option>
            <option>Mira</option>
          </select>

          <input className="rounded-lg border px-3 py-2" placeholder="Search" />
        </div>
      </div>

      <div className="grid gap-4 overflow-x-auto xl:grid-cols-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((deal) => deal.stage === stage);

          return (
            <div
              key={stage}
              className="min-h-96 rounded-2xl border bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold capitalize">
                  {stage.replaceAll("_", " ")}
                </h2>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {stageDeals.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {stageDeals.map((deal) => (
                  <div key={deal.id} className="rounded-xl border p-3">
                    <p className="font-medium">{deal.clientName}</p>
                    <p className="text-sm text-slate-600">{deal.title}</p>

                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <p>Owner: {deal.ownerName ?? "Unassigned"}</p>
                      <p>
                        Value: {deal.valueCurrency ?? "USD"}{" "}
                        {deal.valueAmount ?? 0}
                      </p>
                      <p>Intake: {deal.expectedIntake ?? "-"}</p>
                    </div>

                    <button className="mt-3 w-full rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">
                      View deal
                    </button>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                    No deals in this stage.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
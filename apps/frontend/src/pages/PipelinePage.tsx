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

const deals = [
  {
    id: "1",
    client: "Aruzhan",
    title: "Canada Business",
    owner: "Aigerim",
    stage: "new_lead",
  },
  {
    id: "2",
    client: "Nursultan",
    title: "UK CS",
    owner: "Dias",
    stage: "contacted",
  },
  {
    id: "3",
    client: "Dana",
    title: "USA MBA",
    owner: "Mira",
    stage: "consultation_booked",
  },
];

export function PipelinePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <p className="text-slate-600">Deal pipeline board.</p>
        </div>

        <div className="flex gap-2">
          <select className="rounded-lg border bg-white px-3 py-2">
            <option>All owners</option>
          </select>
          <input className="rounded-lg border px-3 py-2" placeholder="Search" />
        </div>
      </div>

      <div className="grid gap-4 overflow-x-auto lg:grid-cols-4">
        {stages.map((stage) => (
          <div key={stage} className="min-h-96 rounded-2xl border bg-white p-4">
            <h2 className="font-semibold capitalize">
              {stage.replaceAll("_", " ")}
            </h2>

            <div className="mt-4 space-y-3">
              {deals
                .filter((deal) => deal.stage === stage)
                .map((deal) => (
                  <div key={deal.id} className="rounded-xl border p-3">
                    <p className="font-medium">{deal.client}</p>
                    <p className="text-sm text-slate-600">{deal.title}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Owner: {deal.owner}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
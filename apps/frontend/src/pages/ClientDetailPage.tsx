export function ClientDetailPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aruzhan Karim</h1>
          <p className="mt-2 text-slate-600">
            Email: aruzhan@example.com · Phone: +77000000000 · Target: Canada
          </p>
        </div>

        <div className="flex gap-2">
          <button className="rounded-lg border px-4 py-2">New Deal</button>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">
            New Chat
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Conversations</h2>
          <div className="mt-4 space-y-2">
            <p>Admission help — Open</p>
            <p>Visa question — Closed</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Deals</h2>
          <div className="mt-4 space-y-2">
            <p>Canada business program — Contacted</p>
            <p>MBA pathway — New Lead</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="font-semibold">Activity</h2>
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p>Deal moved from new_lead to contacted</p>
          <p>Aigerim replied in Admission help</p>
          <p>Deal note added</p>
        </div>
      </div>
    </div>
  );
}
export function DealDetailPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Canada business program</h1>
          <p className="mt-2 text-slate-600">
            Client: Aruzhan Karim · Owner: Aigerim · Value: USD 1,200
          </p>
        </div>

        <select className="rounded-lg border bg-white px-3 py-2">
          <option>Contacted</option>
          <option>Consultation Booked</option>
          <option>Documents Requested</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Notes</h2>
          <div className="mt-4 space-y-2 text-sm">
            <p>Client wants Canada or UK.</p>
            <p>Needs scholarship options.</p>
          </div>

          <div className="mt-4 flex gap-2">
            <input className="flex-1 rounded-lg border px-3 py-2" />
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">
              Add
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Stage History</h2>
          <div className="mt-4 space-y-2 text-sm">
            <p>New Lead → Contacted</p>
            <p>Contacted → Consultation Booked</p>
          </div>
        </div>
      </div>
    </div>
  );
}
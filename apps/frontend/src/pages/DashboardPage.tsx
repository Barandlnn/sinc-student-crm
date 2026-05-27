const stats = [
  { label: "Open Chats", value: 18 },
  { label: "Unassigned", value: 5 },
  { label: "Active Deals", value: 42 },
  { label: "Won Deals", value: 9 },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-600">
          Real database counts will be connected later.
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
          <h2 className="font-semibold">Deals by Stage</h2>
          <div className="mt-4 space-y-2 text-sm">
            <p>New Lead: 10</p>
            <p>Contacted: 8</p>
            <p>Consultation Booked: 6</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Deals by Owner</h2>
          <div className="mt-4 space-y-2 text-sm">
            <p>Aigerim: 14</p>
            <p>Dias: 11</p>
            <p>Mira: 7</p>
          </div>
        </div>
      </div>
    </div>
  );
}
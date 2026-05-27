const clients = [
  {
    id: "1",
    name: "Aruzhan Karim",
    email: "aruzhan@example.com",
    targetCountry: "Canada",
    activeDeal: "Business Canada",
  },
  {
    id: "2",
    name: "Nursultan A.",
    email: "nur@example.com",
    targetCountry: "UK",
    activeDeal: "Computer Science",
  },
];

export function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-slate-600">Client CRM list.</p>
        </div>

        <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">
          New Client
        </button>
      </div>

      <input
        className="w-full max-w-md rounded-lg border bg-white px-3 py-2"
        placeholder="Search clients..."
      />

      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Target Country</th>
              <th className="px-4 py-3">Active Deal</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{client.name}</td>
                <td className="px-4 py-3">{client.email}</td>
                <td className="px-4 py-3">{client.targetCountry}</td>
                <td className="px-4 py-3">{client.activeDeal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
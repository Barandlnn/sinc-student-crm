import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";

type Client = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  country?: string;
  targetCountry?: string;
  activeDeal?: string;
};

type ClientsResponse = {
  data: Client[];
};

export function ClientsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiRequest<ClientsResponse>("/clients"),
  });

  if (isLoading) {
    return <p>Loading clients...</p>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border bg-white p-5 text-red-600">
        Clients could not be loaded: {error.message}
      </div>
    );
  }

  const clients = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-slate-600">
            Client CRM list loaded from the Worker API.
          </p>
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
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Target Country</th>
              <th className="px-4 py-3">Active Deal</th>
            </tr>
          </thead>

          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{client.fullName}</td>
                <td className="px-4 py-3">{client.email}</td>
                <td className="px-4 py-3">{client.phone ?? "-"}</td>
                <td className="px-4 py-3">{client.country ?? "-"}</td>
                <td className="px-4 py-3">{client.targetCountry ?? "-"}</td>
                <td className="px-4 py-3">{client.activeDeal ?? "No active deal"}</td>
              </tr>
            ))}

            {clients.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={6}>
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
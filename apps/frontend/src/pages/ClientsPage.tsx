import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";

type Client = {
  id: string;
  profile_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  target_country: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export function ClientsPage() {
  const [search, setSearch] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => apiRequest<Client[]>("/clients"),
  });

  const clients = data ?? [];

  const filteredClients = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return clients;
    }

    return clients.filter((client) => {
      return (
        client.full_name.toLowerCase().includes(keyword) ||
        client.email.toLowerCase().includes(keyword) ||
        String(client.phone ?? "").toLowerCase().includes(keyword) ||
        String(client.country ?? "").toLowerCase().includes(keyword) ||
        String(client.target_country ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [clients, search]);

  if (isLoading) {
    return <p>Loading clients...</p>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border bg-white p-5 text-red-600">
        Clients could not be loaded: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-slate-600">
            Client CRM list loaded from the Worker API.
          </p>
        </div>

        <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white">
          New Client
        </button>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search clients..."
        className="w-full max-w-md rounded-xl border px-4 py-3 outline-none"
      />

      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-4 font-semibold">Name</th>
              <th className="px-4 py-4 font-semibold">Email</th>
              <th className="px-4 py-4 font-semibold">Phone</th>
              <th className="px-4 py-4 font-semibold">Country</th>
              <th className="px-4 py-4 font-semibold">Target Country</th>
              <th className="px-4 py-4 font-semibold">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-slate-500" colSpan={6}>
                  No clients found.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="border-b last:border-b-0">
                  <td className="px-4 py-4 font-medium">
                    {client.full_name}
                  </td>
                  <td className="px-4 py-4">{client.email}</td>
                  <td className="px-4 py-4">{client.phone ?? "-"}</td>
                  <td className="px-4 py-4">{client.country ?? "-"}</td>
                  <td className="px-4 py-4">
                    {client.target_country ?? "-"}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      to={`/clients/${client.id}`}
                      className="font-medium text-slate-950 underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
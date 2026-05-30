import { Link, useParams } from "react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: "manager" | "sales" | "client";
};

type MeResponse =
  | {
      profile: Profile;
    }
  | Profile;

type StaffProfile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
};

type StaffResponse =
  | {
      staff: StaffProfile[];
    }
  | StaffProfile[];

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

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function getProfileFromMeResponse(data: MeResponse | undefined) {
  if (!data) {
    return null;
  }

  if ("profile" in data) {
    return data.profile;
  }

  return data;
}

export function DealDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const {
    data: meData,
  } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: () => apiRequest<MeResponse>("/me"),
  });

  const currentProfile = getProfileFromMeResponse(meData);
  const isManager = currentProfile?.role === "manager";

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

  const staffQuery = useQuery<StaffProfile[]>({
    queryKey: ["staff"],
    enabled: isManager,
    queryFn: async () => {
      const data = await apiRequest<StaffResponse>("/staff");

      if (Array.isArray(data)) {
        return data;
      }

      return data.staff;
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async (stage: string) => {
      return apiRequest<Deal>(`/deals/${id}/stage`, {
        method: "PATCH",
        body: JSON.stringify({
          stage,
        }),
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deal", id],
      });

      queryClient.invalidateQueries({
        queryKey: ["deals"],
      });

      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
  });

  const reassignOwnerMutation = useMutation({
    mutationFn: async (ownerId: string) => {
      return apiRequest(`/deals/${id}/assign`, {
        method: "PATCH",
        body: JSON.stringify({
          owner_id: ownerId,
        }),
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deal", id],
      });

      queryClient.invalidateQueries({
        queryKey: ["deals"],
      });

      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
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
        <h2 className="text-lg font-semibold">Update Stage</h2>

        <p className="mt-1 text-sm text-slate-600">
          Move this deal to a different pipeline stage.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {STAGES.map((stage) => {
            const isActive = deal.stage === stage.key;

            return (
              <button
                key={stage.key}
                onClick={() => updateStageMutation.mutate(stage.key)}
                disabled={isActive || updateStageMutation.isPending}
                className={`rounded-xl border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive ? "bg-slate-950 text-white" : "bg-white"
                }`}
              >
                {stage.label}
              </button>
            );
          })}
        </div>

        {updateStageMutation.isPending && (
          <p className="mt-3 text-sm text-slate-500">Updating stage...</p>
        )}

        {updateStageMutation.isError && (
          <p className="mt-3 text-sm text-red-600">
            Stage could not be updated:{" "}
            {(updateStageMutation.error as Error).message}
          </p>
        )}

        {updateStageMutation.isSuccess && (
          <p className="mt-3 text-sm text-green-600">
            Stage updated successfully.
          </p>
        )}
      </div>

      {isManager && (
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Reassign Owner</h2>

          <p className="mt-1 text-sm text-slate-600">
            Manager can assign this deal to another sales or manager user.
          </p>

          <div className="mt-4 max-w-md">
            <label className="text-sm font-medium text-slate-600">
              New Owner
            </label>

            <select
            value={deal.owner_id ?? ""}
            onChange={(event) => {
              const ownerId = event.target.value;

              if (!ownerId) {
                return;
              }

              reassignOwnerMutation.mutate(ownerId);
            }}
            disabled={staffQuery.isLoading || reassignOwnerMutation.isPending}
            className="mt-2 w-full rounded-xl border px-4 py-2 text-sm"
          >
            <option value="" disabled>
              Select owner
            </option>

            {staffQuery.data?.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.full_name ?? staff.email} - {staff.role}
              </option>
            ))}
          </select>
          </div>

          {staffQuery.isLoading && (
            <p className="mt-3 text-sm text-slate-500">Loading staff...</p>
          )}

          {staffQuery.isError && (
            <p className="mt-3 text-sm text-red-600">
              Staff list could not be loaded: {(staffQuery.error as Error).message}
            </p>
          )}

          {reassignOwnerMutation.isPending && (
            <p className="mt-3 text-sm text-slate-500">Updating owner...</p>
          )}

          {reassignOwnerMutation.isError && (
            <p className="mt-3 text-sm text-red-600">
              Owner could not be updated:{" "}
              {(reassignOwnerMutation.error as Error).message}
            </p>
          )}

          {reassignOwnerMutation.isSuccess && (
            <p className="mt-3 text-sm text-green-600">
              Owner updated successfully.
            </p>
          )}
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Deal Information</h2>

        <div className="mt-4 divide-y">
          {fields.map((field) => (
            <div
              key={field.label}
              className="grid gap-2 py-3 text-sm md:grid-cols-3"
            >
              <p className="font-medium text-slate-500">{field.label}</p>
              <p className="break-all capitalize md:col-span-2">
                {field.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed bg-white p-5">
        <h2 className="text-lg font-semibold">Next Actions</h2>

        <p className="mt-2 text-sm text-slate-600">
          Deal notes and owner name display can be implemented next.
        </p>
      </div>
    </div>
  );
}
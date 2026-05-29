import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";

type ConversationThread = {
  id: string;
  client_id: string;
  assigned_to: string | null;
  subject: string;
  status: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

type FilterType = "unassigned" | "mine" | "all";

export function ConversationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<ConversationThread[]>({
    queryKey: ["conversations"],
    queryFn: () => apiRequest<ConversationThread[]>("/conversations"),
  });

  const conversations = data ?? [];

  const filteredConversations = useMemo(() => {
    if (activeFilter === "unassigned") {
      return conversations.filter((conversation) => !conversation.assigned_to);
    }

    if (activeFilter === "mine") {
      return conversations.filter((conversation) => conversation.assigned_to);
    }

    return conversations;
  }, [conversations, activeFilter]);

  const selectedConversation =
    conversations.find(
      (conversation) => conversation.id === selectedConversationId
    ) ?? null;

  if (isLoading) {
    return <p>Loading conversations...</p>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border bg-white p-5 text-red-600">
        Conversations could not be loaded: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-slate-600">
          Conversation queue loaded from the Worker API.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter("unassigned")}
            className={`rounded-xl border px-4 py-2 text-sm ${
              activeFilter === "unassigned"
                ? "bg-slate-950 text-white"
                : "bg-white"
            }`}
          >
            Unassigned
          </button>

          <button
            onClick={() => setActiveFilter("mine")}
            className={`rounded-xl border px-4 py-2 text-sm ${
              activeFilter === "mine" ? "bg-slate-950 text-white" : "bg-white"
            }`}
          >
            Mine
          </button>

          <button
            onClick={() => setActiveFilter("all")}
            className={`rounded-xl border px-4 py-2 text-sm ${
              activeFilter === "all" ? "bg-slate-950 text-white" : "bg-white"
            }`}
          >
            All
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {filteredConversations.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversationId(conversation.id)}
                className={`w-full rounded-xl border p-4 text-left ${
                  selectedConversationId === conversation.id
                    ? "border-slate-950 bg-slate-50"
                    : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{conversation.subject}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Client ID: {conversation.client_id}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize">
                    {conversation.status}
                  </span>
                </div>

                <div className="mt-3 text-sm text-slate-600">
                  {conversation.assigned_to ? (
                    <span>Assigned</span>
                  ) : (
                    <span>Unassigned</span>
                  )}

                  {conversation.last_message_at && (
                    <span className="ml-3">
                      Last message:{" "}
                      {new Date(conversation.last_message_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        {selectedConversation ? (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">
              {selectedConversation.subject}
            </h2>

            <p className="text-sm text-slate-600">
              Status:{" "}
              <span className="font-medium capitalize">
                {selectedConversation.status}
              </span>
            </p>

            <p className="text-sm text-slate-600">
              Assigned to:{" "}
              <span className="font-medium">
                {selectedConversation.assigned_to ?? "Unassigned"}
              </span>
            </p>

            <div className="mt-4 rounded-xl border border-dashed p-4 text-sm text-slate-500">
              Message detail and reply actions will be implemented next.
            </div>
          </div>
        ) : (
          <div className="flex min-h-60 items-center justify-center text-sm text-slate-500">
            Select a conversation.
          </div>
        )}
      </div>
    </div>
  );
}
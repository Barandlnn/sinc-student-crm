import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";

type Conversation = {
  id: string;
  clientId: string;
  subject: string;
  status: string;
  assignedTo: string | null;
};

type ConversationsResponse = {
  data: Conversation[];
};

const mockMessages = [
  { id: "1", from: "Client", body: "I need help with Canada." },
  { id: "2", from: "Sales", body: "What intake do you want?" },
  { id: "3", from: "Client", body: "Fall 2026." },
];

export function ConversationsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiRequest<ConversationsResponse>("/conversations"),
  });

  if (isLoading) {
    return <p>Loading conversations...</p>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border bg-white p-5 text-red-600">
        Conversations could not be loaded: {error.message}
      </div>
    );
  }

  const conversations = data?.data ?? [];
  const selectedConversation = conversations[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-slate-600">
          Conversation queue loaded from the Worker API.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border bg-white p-4">
          <div className="mb-4 flex gap-2">
            <button className="rounded-lg border px-3 py-2 text-sm">
              Unassigned
            </button>
            <button className="rounded-lg border px-3 py-2 text-sm">
              Mine
            </button>
            <button className="rounded-lg border px-3 py-2 text-sm">
              All
            </button>
          </div>

          <div className="space-y-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className="w-full rounded-xl border p-3 text-left hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{conversation.subject}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">
                    {conversation.status}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Owner: {conversation.assignedTo ?? "Unassigned"}
                </p>
              </button>
            ))}

            {conversations.length === 0 && (
              <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                No conversations found.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          {selectedConversation ? (
            <>
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedConversation.subject}
                  </h2>
                  <p className="text-sm capitalize text-slate-500">
                    {selectedConversation.status}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button className="rounded-lg border px-3 py-2 text-sm">
                    Assign to me
                  </button>
                  <button className="rounded-lg border px-3 py-2 text-sm">
                    Reassign
                  </button>
                </div>
              </div>

              <div className="my-4 min-h-80 space-y-3">
                {mockMessages.map((message) => (
                  <div key={message.id} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-500">
                      {message.from}
                    </p>
                    <p>{message.body}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border px-3 py-2"
                  placeholder="Reply..."
                />
                <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-80 items-center justify-center text-slate-500">
              Select a conversation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
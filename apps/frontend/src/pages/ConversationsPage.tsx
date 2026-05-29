import { useMemo, useState, type FormEvent } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth";

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

type ConversationMessage = {
  id: string;
  thread_id: string;
  sender_id: string | null;
  sender_type: "client" | "staff";
  body: string;
  created_at: string;
};

type FilterType = "unassigned" | "mine" | "all";

export function ConversationsPage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [assignSuccessMessage, setAssignSuccessMessage] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<ConversationThread[]>({
    queryKey: ["conversations"],
    queryFn: () => apiRequest<ConversationThread[]>("/conversations"),
  });

  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    isError: isMessagesError,
    error: messagesError,
  } = useQuery<ConversationMessage[]>({
    queryKey: ["conversation-messages", selectedConversationId],
    queryFn: () =>
      apiRequest<ConversationMessage[]>(
        `/conversations/${selectedConversationId}/messages`
      ),
    enabled: Boolean(selectedConversationId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversationId) {
        throw new Error("No conversation selected.");
      }

      return apiRequest<ConversationMessage>(
        `/conversations/${selectedConversationId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            body: replyText,
          }),
        }
      );
    },

    onSuccess: () => {
      setReplyText("");
      setSuccessMessage("Message sent successfully.");

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);

      queryClient.invalidateQueries({
        queryKey: ["conversation-messages", selectedConversationId],
      });

      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },

    onError: () => {
      setSuccessMessage("");
    },
  });

  const assignToMeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversationId) {
        throw new Error("No conversation selected.");
      }

      return apiRequest<ConversationThread>(
        `/conversations/${selectedConversationId}/assign-to-me`,
        {
          method: "PATCH",
        }
      );
    },

    onSuccess: () => {
      setAssignSuccessMessage("Conversation assigned to you.");

      window.setTimeout(() => {
        setAssignSuccessMessage("");
      }, 3000);

      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },

    onError: () => {
      setAssignSuccessMessage("");
    },
  });

  const conversations = data ?? [];
  const messages = messagesData ?? [];

  const filteredConversations = useMemo(() => {
    if (activeFilter === "unassigned") {
      return conversations.filter((conversation) => !conversation.assigned_to);
    }

    if (activeFilter === "mine") {
      return conversations.filter((conversation) => {
        return conversation.assigned_to === profile?.id;
      });
    }

    return conversations;
  }, [conversations, activeFilter, profile?.id]);

  const selectedConversation =
    conversations.find(
      (conversation) => conversation.id === selectedConversationId
    ) ?? null;

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!replyText.trim()) {
      return;
    }

    sendMessageMutation.mutate();
  }

  const canAssignConversation =
    profile?.role !== "client" && selectedConversation && !selectedConversation.assigned_to;

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
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">
                {selectedConversation.subject}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
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

              {canAssignConversation && (
                <button
                  onClick={() => assignToMeMutation.mutate()}
                  disabled={assignToMeMutation.isPending}
                  className="mt-3 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assignToMeMutation.isPending
                    ? "Assigning..."
                    : "Assign to me"}
                </button>
              )}

              {assignToMeMutation.isError && (
                <p className="mt-2 text-sm text-red-600">
                  Assignment failed:{" "}
                  {(assignToMeMutation.error as Error).message}
                </p>
              )}

              {assignSuccessMessage && (
                <p className="mt-2 text-sm text-green-600">
                  {assignSuccessMessage}
                </p>
              )}
            </div>

            <div className="rounded-xl border bg-slate-50 p-4">
              <h3 className="font-semibold">Messages</h3>

              {isMessagesLoading && (
                <p className="mt-3 text-sm text-slate-500">
                  Loading messages...
                </p>
              )}

              {isMessagesError && (
                <p className="mt-3 text-sm text-red-600">
                  Messages could not be loaded:{" "}
                  {(messagesError as Error).message}
                </p>
              )}

              {!isMessagesLoading &&
                !isMessagesError &&
                messages.length === 0 && (
                  <p className="mt-3 text-sm text-slate-500">
                    No messages found.
                  </p>
                )}

              <div className="mt-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-xl border bg-white p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-600">
                        {message.sender_type}
                      </span>
                    </div>

                    <p className="text-sm">{message.body}</p>

                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleSendMessage}
              className="rounded-xl border border-dashed p-4"
            >
              <label className="text-sm font-medium">Reply</label>

              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Write a message..."
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none"
              />

              {sendMessageMutation.isError && (
                <p className="mt-2 text-sm text-red-600">
                  Message could not be sent:{" "}
                  {(sendMessageMutation.error as Error).message}
                </p>
              )}

              {successMessage && (
                <p className="mt-2 text-sm text-green-600">
                  {successMessage}
                </p>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendMessageMutation.isPending}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendMessageMutation.isPending
                    ? "Sending..."
                    : "Send Message"}
                </button>
              </div>
            </form>
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
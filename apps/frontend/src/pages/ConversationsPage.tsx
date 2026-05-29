import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiRequest } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";

type Role = "manager" | "sales" | "client";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: Role;
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
  role: "manager" | "sales" | string;
};

type StaffResponse =
  | StaffProfile[]
  | {
      staff: StaffProfile[];
    };

type ClientInfo = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
};

type ConversationThread = {
  id: string;
  client_id: string | null;
  title?: string | null;
  subject?: string | null;
  status?: string | null;
  assigned_to?: string | null;
  assigned_to_profile_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_message_at?: string | null;

  clients?: ClientInfo | null;
  client?: ClientInfo | null;

  assigned_profile?: StaffProfile | null;
  assignee?: StaffProfile | null;
  profiles?: StaffProfile | null;
};

type ConversationMessage = {
  id: string;
  thread_id?: string | null;
  conversation_id?: string | null;
  conversation_thread_id?: string | null;
  sender_id: string | null;
  sender_type: "client" | "staff" | string;
  body: string;
  created_at: string;

  sender_profile?: Profile | null;
  profile?: Profile | null;
};

type ConversationsResponse =
  | ConversationThread[]
  | {
      conversations: ConversationThread[];
    };

type MessagesResponse =
  | ConversationMessage[]
  | {
      messages: ConversationMessage[];
    };

function getProfileFromMeResponse(data: MeResponse | undefined) {
  if (!data) {
    return null;
  }

  if ("profile" in data) {
    return data.profile;
  }

  return data;
}

function getConversationsFromResponse(data: ConversationsResponse | undefined) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return data.conversations;
}

function getMessagesFromResponse(data: MessagesResponse | undefined) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return data.messages;
}

function getStaffFromResponse(data: StaffResponse | undefined) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return data.staff;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function getConversationTitle(conversation: ConversationThread) {
  return conversation.title ?? conversation.subject ?? "Untitled Conversation";
}

function getClientName(conversation: ConversationThread) {
  const client = conversation.clients ?? conversation.client;

  return (
    client?.full_name ??
    client?.name ??
    client?.email ??
    conversation.client_id ??
    "Unknown client"
  );
}

function getAssignedUserId(conversation: ConversationThread) {
  return conversation.assigned_to ?? conversation.assigned_to_profile_id ?? null;
}

function getAssignedName(
  conversation: ConversationThread,
  staff: StaffProfile[]
) {
  const assignedProfile =
    conversation.assigned_profile ??
    conversation.assignee ??
    conversation.profiles ??
    null;

  if (assignedProfile) {
    return assignedProfile.full_name ?? assignedProfile.email;
  }

  const assignedUserId = getAssignedUserId(conversation);

  if (!assignedUserId) {
    return "Unassigned";
  }

  const matchedStaff = staff.find((person) => person.id === assignedUserId);

  return matchedStaff?.full_name ?? matchedStaff?.email ?? assignedUserId;
}

function getSenderLabel(message: ConversationMessage, profile: Profile | null) {
  if (profile && message.sender_id === profile.id) {
    return "You";
  }

  const senderProfile = message.sender_profile ?? message.profile;

  if (senderProfile) {
    return senderProfile.full_name ?? senderProfile.email;
  }

  if (message.sender_type === "client") {
    return "Client";
  }

  if (message.sender_type === "staff") {
    return "Staff";
  }

  return message.sender_type;
}

export function ConversationsPage() {
  const queryClient = useQueryClient();

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  const [replyText, setReplyText] = useState("");
  const [newConversationTitle, setNewConversationTitle] = useState("");
  const [newConversationMessage, setNewConversationMessage] = useState("");

  const [assignSuccessMessage, setAssignSuccessMessage] = useState("");
  const [reassignSuccessMessage, setReassignSuccessMessage] = useState("");
  const [createSuccessMessage, setCreateSuccessMessage] = useState("");

  const { data: meData } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: () => apiRequest<MeResponse>("/me"),
  });

  const profile = getProfileFromMeResponse(meData);
  const isClient = profile?.role === "client";
  const isSalesOrManager = profile?.role === "sales" || profile?.role === "manager";
  const isManager = profile?.role === "manager";

  const {
    data: conversationsResponse,
    isLoading,
    isError,
    error,
  } = useQuery<ConversationsResponse>({
    queryKey: ["conversations"],
    queryFn: () => apiRequest<ConversationsResponse>("/conversations"),
  });

  const conversations = getConversationsFromResponse(conversationsResponse);

  const selectedConversation = useMemo(() => {
    return (
      conversations.find(
        (conversation) => conversation.id === selectedConversationId
      ) ?? null
    );
  }, [conversations, selectedConversationId]);

  const {
    data: messagesResponse,
    isLoading: isMessagesLoading,
    isError: isMessagesError,
    error: messagesError,
  } = useQuery<MessagesResponse>({
    queryKey: ["conversation-messages", selectedConversationId],
    queryFn: () =>
      apiRequest<MessagesResponse>(
        `/conversations/${selectedConversationId}/messages`
      ),
    enabled: Boolean(selectedConversationId),
  });

  const messages = getMessagesFromResponse(messagesResponse);

  const {
    data: staffResponse,
    isLoading: isStaffLoading,
    isError: isStaffError,
    error: staffError,
  } = useQuery<StaffResponse>({
    queryKey: ["staff"],
    queryFn: () => apiRequest<StaffResponse>("/staff"),
    enabled: isSalesOrManager,
  });

  const staff = getStaffFromResponse(staffResponse);

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    const channel = supabase
      .channel("conversation-threads-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_threads",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["conversations"],
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const channel = supabase
      .channel(`conversation-messages-${selectedConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
        },
        (payload) => {
          const newMessage = payload.new as ConversationMessage;

          const incomingConversationId =
            newMessage.thread_id ??
            newMessage.conversation_id ??
            newMessage.conversation_thread_id;

          if (incomingConversationId !== selectedConversationId) {
            return;
          }

          queryClient.setQueryData<MessagesResponse>(
            ["conversation-messages", selectedConversationId],
            (oldData) => {
              const oldMessages = getMessagesFromResponse(oldData);

              const messageAlreadyExists = oldMessages.some(
                (message) => message.id === newMessage.id
              );

              if (messageAlreadyExists) {
                return oldData ?? [];
              }

              return [...oldMessages, newMessage];
            }
          );

          queryClient.invalidateQueries({
            queryKey: ["conversations"],
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedConversationId, queryClient]);

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const title = newConversationTitle.trim();
      const message = newConversationMessage.trim();

      return apiRequest<
        ConversationThread | { conversation: ConversationThread }
      >("/conversations", {
        method: "POST",
        body: JSON.stringify({
          title,
          subject: title,
          body: message,
          message,
          first_message: message,
        }),
      });
    },

    onSuccess: (response) => {
      const conversation =
        "conversation" in response ? response.conversation : response;

      setNewConversationTitle("");
      setNewConversationMessage("");
      setCreateSuccessMessage("Conversation created successfully.");

      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });

      if (conversation?.id) {
        setSelectedConversationId(conversation.id);
      }
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const body = replyText.trim();

      return apiRequest<ConversationMessage>(
        `/conversations/${selectedConversationId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            body,
            message: body,
          }),
        }
      );
    },

    onSuccess: () => {
      setReplyText("");

      queryClient.invalidateQueries({
        queryKey: ["conversation-messages", selectedConversationId],
      });

      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });

  const assignToMeMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest(`/conversations/${conversationId}/assign-to-me`, {
        method: "PATCH",
      });
    },

    onSuccess: () => {
      setAssignSuccessMessage("Conversation assigned to you successfully.");

      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });

  const reassignConversationMutation = useMutation({
    mutationFn: async ({
      conversationId,
      staffId,
    }: {
      conversationId: string;
      staffId: string;
    }) => {
      return apiRequest(`/conversations/${conversationId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({
          assigned_to: staffId,
        }),
      });
    },

    onSuccess: () => {
      setReassignSuccessMessage("Conversation reassigned successfully.");

      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });

  function handleCreateConversation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreateSuccessMessage("");

    if (!newConversationTitle.trim() || !newConversationMessage.trim()) {
      return;
    }

    createConversationMutation.mutate();
  }

  function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedConversationId || !replyText.trim()) {
      return;
    }

    sendMessageMutation.mutate();
  }

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

        <p className="mt-1 text-slate-600">
          Chat conversations loaded from the Worker API.
        </p>
      </div>

      {isClient && (
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Start a New Chat</h2>

          <p className="mt-1 text-sm text-slate-600">
            Clients can start a new conversation with the sales team.
          </p>

          <form
            onSubmit={handleCreateConversation}
            className="mt-4 grid gap-3"
          >
            <input
              value={newConversationTitle}
              onChange={(event) =>
                setNewConversationTitle(event.target.value)
              }
              placeholder="Subject, e.g. Visa question"
              className="rounded-xl border px-4 py-2 text-sm"
            />

            <textarea
              value={newConversationMessage}
              onChange={(event) =>
                setNewConversationMessage(event.target.value)
              }
              placeholder="Write your first message..."
              rows={4}
              className="rounded-xl border px-4 py-2 text-sm"
            />

            <button
              type="submit"
              disabled={
                createConversationMutation.isPending ||
                !newConversationTitle.trim() ||
                !newConversationMessage.trim()
              }
              className="w-fit rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Chat
            </button>
          </form>

          {createConversationMutation.isPending && (
            <p className="mt-3 text-sm text-slate-500">
              Creating conversation...
            </p>
          )}

          {createConversationMutation.isError && (
            <p className="mt-3 text-sm text-red-600">
              Conversation could not be created:{" "}
              {(createConversationMutation.error as Error).message}
            </p>
          )}

          {createSuccessMessage && (
            <p className="mt-3 text-sm text-green-600">
              {createSuccessMessage}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Threads</h2>
              <p className="mt-1 text-sm text-slate-600">
                {conversations.length} conversation(s)
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {conversations.length === 0 && (
              <p className="text-sm text-slate-500">
                No conversations found.
              </p>
            )}

            {conversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => {
                    setSelectedConversationId(conversation.id);
                    setAssignSuccessMessage("");
                    setReassignSuccessMessage("");
                  }}
                  className={`block w-full rounded-xl border p-4 text-left hover:bg-slate-50 ${
                    isSelected ? "border-slate-950 bg-slate-50" : "bg-white"
                  }`}
                >
                  <p className="font-medium">
                    {getConversationTitle(conversation)}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Client: {getClientName(conversation)}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Assigned to: {getAssignedName(conversation, staff)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Last message: {formatDate(conversation.last_message_at)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          {!selectedConversation && (
            <p className="text-sm text-slate-500">
              Select a conversation to view messages.
            </p>
          )}

          {selectedConversation && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {getConversationTitle(selectedConversation)}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    Client: {getClientName(selectedConversation)}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Assigned to: {getAssignedName(selectedConversation, staff)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Created: {formatDate(selectedConversation.created_at)}
                  </p>
                </div>

                {isSalesOrManager && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        assignToMeMutation.mutate(selectedConversation.id)
                      }
                      disabled={assignToMeMutation.isPending}
                      className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Assign to me
                    </button>
                  </div>
                )}
              </div>

              {assignSuccessMessage && (
                <p className="text-sm text-green-600">
                  {assignSuccessMessage}
                </p>
              )}

              {assignToMeMutation.isError && (
                <p className="text-sm text-red-600">
                  Assignment failed: {(assignToMeMutation.error as Error).message}
                </p>
              )}

              {isManager && (
                <div className="rounded-xl border bg-slate-50 p-4">
                  <h3 className="font-semibold">Manager Reassignment</h3>

                  <p className="mt-1 text-sm text-slate-600">
                    Reassign this conversation to another staff member.
                  </p>

                  <div className="mt-3 max-w-md">
                    <label className="text-sm font-medium text-slate-600">
                      Assign to staff
                    </label>

                    <select
                      value={getAssignedUserId(selectedConversation) ?? ""}
                      onChange={(event) => {
                        const staffId = event.target.value;

                        if (!staffId) {
                          return;
                        }

                        setReassignSuccessMessage("");

                        reassignConversationMutation.mutate({
                          conversationId: selectedConversation.id,
                          staffId,
                        });
                      }}
                      disabled={
                        isStaffLoading || reassignConversationMutation.isPending
                      }
                      className="mt-2 w-full rounded-xl border bg-white px-4 py-2 text-sm"
                    >
                      <option value="">Select staff</option>

                      {staff.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.full_name ?? person.email} - {person.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isStaffLoading && (
                    <p className="mt-3 text-sm text-slate-500">
                      Loading staff...
                    </p>
                  )}

                  {isStaffError && (
                    <p className="mt-3 text-sm text-red-600">
                      Staff list could not be loaded:{" "}
                      {(staffError as Error).message}
                    </p>
                  )}

                  {reassignConversationMutation.isPending && (
                    <p className="mt-3 text-sm text-slate-500">
                      Reassigning conversation...
                    </p>
                  )}

                  {reassignConversationMutation.isError && (
                    <p className="mt-3 text-sm text-red-600">
                      Reassignment failed:{" "}
                      {(reassignConversationMutation.error as Error).message}
                    </p>
                  )}

                  {reassignSuccessMessage && (
                    <p className="mt-3 text-sm text-green-600">
                      {reassignSuccessMessage}
                    </p>
                  )}
                </div>
              )}

              <div>
                <h3 className="font-semibold">Messages</h3>

                <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-xl border bg-slate-50 p-4">
                  {isMessagesLoading && (
                    <p className="text-sm text-slate-500">
                      Loading messages...
                    </p>
                  )}

                  {isMessagesError && (
                    <p className="text-sm text-red-600">
                      Messages could not be loaded:{" "}
                      {(messagesError as Error).message}
                    </p>
                  )}

                  {!isMessagesLoading && messages.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No messages found.
                    </p>
                  )}

                  {messages.map((message) => {
                    const isOwnMessage =
                      profile && message.sender_id === profile.id;

                    return (
                      <div
                        key={message.id}
                        className={`rounded-xl border bg-white p-4 ${
                          isOwnMessage ? "ml-auto max-w-[80%]" : "max-w-[80%]"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {getSenderLabel(message, profile)}
                          </p>

                          <p className="text-xs text-slate-500">
                            {formatDate(message.created_at)}
                          </p>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm">
                          {message.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-3">
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Write a reply..."
                  rows={4}
                  className="w-full rounded-xl border px-4 py-3 text-sm"
                />

                <button
                  type="submit"
                  disabled={
                    sendMessageMutation.isPending ||
                    !replyText.trim() ||
                    !selectedConversationId
                  }
                  className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send Message
                </button>
              </form>

              {sendMessageMutation.isPending && (
                <p className="text-sm text-slate-500">Sending message...</p>
              )}

              {sendMessageMutation.isError && (
                <p className="text-sm text-red-600">
                  Message could not be sent:{" "}
                  {(sendMessageMutation.error as Error).message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
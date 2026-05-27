const conversations = [
  { id: "1", subject: "Admission help", owner: "Unassigned" },
  { id: "2", subject: "Visa question", owner: "Aigerim" },
  { id: "3", subject: "Tuition fees", owner: "Dias" },
];

const messages = [
  { id: "1", from: "Client", body: "I need help with Canada." },
  { id: "2", from: "Sales", body: "What intake do you want?" },
  { id: "3", from: "Client", body: "Fall 2026." },
];

export function ConversationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-slate-600">Realtime chat workspace.</p>
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
                <p className="font-medium">{conversation.subject}</p>
                <p className="text-sm text-slate-500">{conversation.owner}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-semibold">Admission help</h2>
              <p className="text-sm text-slate-500">Open</p>
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
            {messages.map((message) => (
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
        </div>
      </div>
    </div>
  );
}
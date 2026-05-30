import { Hono, type MiddlewareHandler } from "hono";
import { cors } from "hono/cors";

import { createSupabaseAdmin, type Env } from "./lib/supabaseAdmin";

type Role = "manager" | "sales" | "client";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: Role;
};

type AppVariables = {
  profile: Profile;
  accessToken: string;
};

const app = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://sinc-student-crm.pages.dev",
      ];

      // Local development ve production domain
      if (allowedOrigins.includes(origin)) {
        return origin;
      }

      // Cloudflare Pages hash tabanlı deployment adresleri
      // Örnek: https://a304e8f4.sinc-student-crm.pages.dev
      if (
        /^https:\/\/[a-z0-9-]+\.sinc-student-crm\.pages\.dev$/.test(origin)
      ) {
        return origin;
      }

      return "";
    },
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

const authMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: AppVariables;
}> = async (c, next) => {
  if (c.req.method === "OPTIONS" || c.req.path === "/api/health") {
    return next();
  }

  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const supabase = createSupabaseAdmin(c.env);

  const { data: userData, error: userError } = await supabase.auth.getUser(
    token
  );

  if (userError || !userData.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    return c.json({ error: profileError.message }, 500);
  }

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  c.set("profile", {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    role: profile.role as Role,
  });

  c.set("accessToken", token);

  return next();
};

function requireRoles(...allowedRoles: Role[]) {
  const middleware: MiddlewareHandler<{
    Bindings: Env;
    Variables: AppVariables;
  }> = async (c, next) => {
    const profile = c.get("profile");

    if (!allowedRoles.includes(profile.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    return next();
  };

  return middleware;
}

function parseNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return null;
  }

  return numberValue;
}

function toActivityTimestamp(value: unknown) {
  if (!value || typeof value !== "string") {
    return new Date(0).toISOString();
  }

  return value;
}

app.use("/api/*", authMiddleware);

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    service: "sinc-student-crm-worker",
  });
});

app.get("/api/me", requireRoles("manager", "sales", "client"), async (c) => {
  const profile = c.get("profile");

  return c.json({
    profile,
  });
});

app.get("/api/staff", requireRoles("manager", "sales"), async (c) => {
  const supabase = createSupabaseAdmin(c.env);

  const { data: staff, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .in("role", ["manager", "sales"])
    .order("full_name", { ascending: true });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(staff ?? []);
});

app.get(
  "/api/dashboard",
  requireRoles("manager", "sales"),
  async (c) => {
    const supabase = createSupabaseAdmin(c.env);

    const { data: conversations, error: conversationsError } = await supabase
      .from("conversation_threads")
      .select("*")
      .order("last_message_at", { ascending: false });

    if (conversationsError) {
      return c.json({ error: conversationsError.message }, 500);
    }

    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("*")
      .order("updated_at", { ascending: false });

    if (dealsError) {
      return c.json({ error: dealsError.message }, 500);
    }

    const conversationRows = (conversations ?? []) as any[];
    const dealRows = (deals ?? []) as any[];

    const openChats = conversationRows.length;

    const unassignedConversations = conversationRows.filter(
      (conversation) => !conversation.assigned_to
    ).length;

    const activeDeals = dealRows.filter(
      (deal) => deal.stage !== "won" && deal.stage !== "lost"
    ).length;

    const wonDeals = dealRows.filter((deal) => deal.stage === "won").length;

    const dealsByStage = dealRows.reduce<Record<string, number>>(
      (acc, deal) => {
        const stage = deal.stage ?? "unknown";
        acc[stage] = (acc[stage] ?? 0) + 1;
        return acc;
      },
      {}
    );

    const ownerIds = [
      ...new Set(dealRows.map((deal) => deal.owner_id).filter(Boolean)),
    ] as string[];

    let staffById = new Map<string, any>();

    if (ownerIds.length > 0) {
      const { data: staff, error: staffError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .in("id", ownerIds);

      if (staffError) {
        return c.json({ error: staffError.message }, 500);
      }

      staffById = new Map(
        ((staff ?? []) as any[]).map((person) => [person.id, person])
      );
    }

    const dealsByOwner = dealRows.reduce<Record<string, number>>(
      (acc, deal) => {
        const owner = deal.owner_id
          ? staffById.get(deal.owner_id)
          : null;

        const ownerName =
          owner?.full_name ?? owner?.email ?? deal.owner_id ?? "Unassigned";

        acc[ownerName] = (acc[ownerName] ?? 0) + 1;
        return acc;
      },
      {}
    );

    const recentConversationActivity = conversationRows.map((conversation) => ({
      id: `conversation-${conversation.id}`,
      type: "conversation",
      title: conversation.title ?? conversation.subject ?? "Conversation",
      description: conversation.assigned_to
        ? "Conversation assigned"
        : "Conversation unassigned",
      timestamp: conversation.last_message_at ?? conversation.created_at,
    }));

    const recentDealActivity = dealRows.map((deal) => ({
      id: `deal-${deal.id}`,
      type: "deal",
      title: deal.title,
      description: `Deal stage: ${deal.stage}`,
      timestamp: deal.updated_at ?? deal.created_at,
    }));

    const recentActivity = [
      ...recentConversationActivity,
      ...recentDealActivity,
    ]
      .filter((item) => Boolean(item.timestamp))
      .sort(
        (a, b) =>
          new Date(toActivityTimestamp(b.timestamp)).getTime() -
          new Date(toActivityTimestamp(a.timestamp)).getTime()
      )
      .slice(0, 8);

    return c.json({
      openChats,
      open_chats: openChats,

      unassigned: unassignedConversations,
      unassignedConversations,
      unassigned_conversations: unassignedConversations,

      activeDeals,
      active_deals: activeDeals,

      wonDeals,
      won_deals: wonDeals,

      dealsByStage,
      deals_by_stage: dealsByStage,

      dealsByOwner,
      deals_by_owner: dealsByOwner,

      recentActivity,
      recent_activity: recentActivity,

      stats: {
        openChats,
        unassignedConversations,
        activeDeals,
        wonDeals,
      },
    });
  }
);

app.get("/api/clients", requireRoles("manager", "sales"), async (c) => {
  const supabase = createSupabaseAdmin(c.env);

  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(clients ?? []);
});

app.post("/api/clients", requireRoles("manager", "sales"), async (c) => {
  const supabase = createSupabaseAdmin(c.env);

  const body = await c.req.json<{
    full_name?: string;
    email?: string;
    phone?: string;
    country?: string;
    target_country?: string;
    status?: string;
    source?: string;
    notes?: string;
  }>();

  if (!body.full_name || !body.email) {
    return c.json({ error: "full_name and email are required" }, 400);
  }

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      full_name: body.full_name,
      email: body.email,
      phone: body.phone ?? null,
      country: body.country ?? null,
      target_country: body.target_country ?? null,
      status: body.status ?? null,
      source: body.source ?? null,
      notes: body.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(client, 201);
});

app.get(
  "/api/clients/:id",
  requireRoles("manager", "sales"),
  async (c) => {
    const clientId = c.req.param("id");
    const supabase = createSupabaseAdmin(c.env);

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .maybeSingle();

    if (clientError) {
      return c.json({ error: clientError.message }, 500);
    }

    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    const { data: conversations, error: conversationsError } = await supabase
      .from("conversation_threads")
      .select("*")
      .eq("client_id", clientId)
      .order("last_message_at", { ascending: false });

    if (conversationsError) {
      return c.json({ error: conversationsError.message }, 500);
    }

    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("*")
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false });

    if (dealsError) {
      return c.json({ error: dealsError.message }, 500);
    }

    const conversationRows = (conversations ?? []) as any[];
    const dealRows = (deals ?? []) as any[];

    const conversationActivity = conversationRows.map((conversation) => ({
      id: `conversation-${conversation.id}`,
      type: "conversation",
      title: conversation.title ?? conversation.subject ?? "Conversation",
      description: conversation.assigned_to
        ? "Conversation assigned"
        : "Conversation unassigned",
      timestamp: conversation.last_message_at ?? conversation.created_at,
    }));

    const dealActivity = dealRows.map((deal) => ({
      id: `deal-${deal.id}`,
      type: "deal",
      title: deal.title,
      description: `Deal stage: ${deal.stage}`,
      timestamp: deal.updated_at ?? deal.created_at,
    }));

    const activity = [...conversationActivity, ...dealActivity]
      .filter((item) => Boolean(item.timestamp))
      .sort(
        (a, b) =>
          new Date(toActivityTimestamp(b.timestamp)).getTime() -
          new Date(toActivityTimestamp(a.timestamp)).getTime()
      )
      .slice(0, 10);

    return c.json({
      client,
      conversations: conversationRows,
      deals: dealRows,
      activity,
    });
  }
);

app.get(
  "/api/conversations",
  requireRoles("manager", "sales", "client"),
  async (c) => {
    const profile = c.get("profile");
    const supabase = createSupabaseAdmin(c.env);

    let query = supabase
      .from("conversation_threads")
      .select("*")
      .order("last_message_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (profile.role === "client") {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("email", profile.email)
        .maybeSingle();

      if (clientError) {
        return c.json({ error: clientError.message }, 500);
      }

      if (!client) {
        return c.json([]);
      }

      query = query.eq("client_id", client.id);
    }

    const { data: conversations, error: conversationsError } = await query;

    if (conversationsError) {
      return c.json({ error: conversationsError.message }, 500);
    }

    const conversationRows = (conversations ?? []) as any[];

    const clientIds = [
      ...new Set(
        conversationRows
          .map((conversation) => conversation.client_id)
          .filter(Boolean)
      ),
    ] as string[];

    const assignedUserIds = [
      ...new Set(
        conversationRows
          .map((conversation) => conversation.assigned_to)
          .filter(Boolean)
      ),
    ] as string[];

    let clientsById = new Map<string, any>();
    let staffById = new Map<string, any>();

    if (clientIds.length > 0) {
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id, full_name, email")
        .in("id", clientIds);

      if (clientsError) {
        return c.json({ error: clientsError.message }, 500);
      }

      clientsById = new Map(
        ((clients ?? []) as any[]).map((client) => [client.id, client])
      );
    }

    if (assignedUserIds.length > 0) {
      const { data: staff, error: staffError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .in("id", assignedUserIds);

      if (staffError) {
        return c.json({ error: staffError.message }, 500);
      }

      staffById = new Map(
        ((staff ?? []) as any[]).map((person) => [person.id, person])
      );
    }

    const enrichedConversations = conversationRows.map((conversation) => ({
      ...conversation,
      client: conversation.client_id
        ? clientsById.get(conversation.client_id) ?? null
        : null,
      assigned_profile: conversation.assigned_to
        ? staffById.get(conversation.assigned_to) ?? null
        : null,
    }));

    return c.json(enrichedConversations);
  }
);

app.post(
  "/api/conversations",
  requireRoles("client"),
  async (c) => {
    const profile = c.get("profile");
    const supabase = createSupabaseAdmin(c.env);

    const body = await c.req.json<{
      title?: string;
      subject?: string;
      body?: string;
      message?: string;
      first_message?: string;
    }>();

    const title = body.title ?? body.subject ?? "New Conversation";
    const message = body.body ?? body.message ?? body.first_message;

    if (!message || !message.trim()) {
      return c.json({ error: "Message is required" }, 400);
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("email", profile.email)
      .maybeSingle();

    if (clientError) {
      return c.json({ error: clientError.message }, 500);
    }

    if (!client) {
      return c.json({ error: "Client profile not found" }, 404);
    }

    const now = new Date().toISOString();

    const { data: conversation, error: conversationError } = await supabase
      .from("conversation_threads")
      .insert({
        client_id: client.id,
        title,
        status: "open",
        last_message_at: now,
      })
      .select("*")
      .single();

    if (conversationError) {
      return c.json({ error: conversationError.message }, 500);
    }

    const { error: messageError } = await supabase
      .from("conversation_messages")
      .insert({
        thread_id: conversation.id,
        sender_id: profile.id,
        sender_type: "client",
        body: message.trim(),
        created_at: now,
      });

    if (messageError) {
      return c.json({ error: messageError.message }, 500);
    }

    return c.json(conversation, 201);
  }
);

app.get(
  "/api/conversations/:id/messages",
  requireRoles("manager", "sales", "client"),
  async (c) => {
    const threadId = c.req.param("id");
    const profile = c.get("profile");
    const supabase = createSupabaseAdmin(c.env);

    const { data: thread, error: threadError } = await supabase
      .from("conversation_threads")
      .select("*")
      .eq("id", threadId)
      .maybeSingle();

    if (threadError) {
      return c.json({ error: threadError.message }, 500);
    }

    if (!thread) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    if (profile.role === "client") {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("email", profile.email)
        .maybeSingle();

      if (clientError) {
        return c.json({ error: clientError.message }, 500);
      }

      if (!client || thread.client_id !== client.id) {
        return c.json({ error: "Forbidden" }, 403);
      }
    }

    const { data: messages, error: messagesError } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      return c.json({ error: messagesError.message }, 500);
    }

    const messageRows = (messages ?? []) as any[];

    const senderIds = [
      ...new Set(messageRows.map((message) => message.sender_id).filter(Boolean)),
    ] as string[];

    let profilesById = new Map<string, any>();

    if (senderIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .in("id", senderIds);

      if (profilesError) {
        return c.json({ error: profilesError.message }, 500);
      }

      profilesById = new Map(
        ((profiles ?? []) as any[]).map((person) => [person.id, person])
      );
    }

    const enrichedMessages = messageRows.map((message) => ({
      ...message,
      sender_profile: message.sender_id
        ? profilesById.get(message.sender_id) ?? null
        : null,
    }));

    return c.json(enrichedMessages);
  }
);

app.post(
  "/api/conversations/:id/messages",
  requireRoles("manager", "sales", "client"),
  async (c) => {
    const threadId = c.req.param("id");
    const profile = c.get("profile");
    const supabase = createSupabaseAdmin(c.env);

    const body = await c.req.json<{
      body?: string;
      message?: string;
    }>();

    const messageBody = body.body ?? body.message;

    if (!messageBody || !messageBody.trim()) {
      return c.json({ error: "Message body is required" }, 400);
    }

    const { data: thread, error: threadError } = await supabase
      .from("conversation_threads")
      .select("*")
      .eq("id", threadId)
      .maybeSingle();

    if (threadError) {
      return c.json({ error: threadError.message }, 500);
    }

    if (!thread) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    if (profile.role === "client") {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("email", profile.email)
        .maybeSingle();

      if (clientError) {
        return c.json({ error: clientError.message }, 500);
      }

      if (!client || thread.client_id !== client.id) {
        return c.json({ error: "Forbidden" }, 403);
      }
    }

    const now = new Date().toISOString();

    const { data: message, error: messageError } = await supabase
      .from("conversation_messages")
      .insert({
        thread_id: threadId,
        sender_id: profile.id,
        sender_type: profile.role === "client" ? "client" : "staff",
        body: messageBody.trim(),
        created_at: now,
      })
      .select("*")
      .single();

    if (messageError) {
      return c.json({ error: messageError.message }, 500);
    }

    const { error: updateError } = await supabase
      .from("conversation_threads")
      .update({
        last_message_at: now,
        updated_at: now,
      })
      .eq("id", threadId);

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }

    return c.json(message, 201);
  }
);

app.patch(
  "/api/conversations/:id/assign-to-me",
  requireRoles("manager", "sales"),
  async (c) => {
    const threadId = c.req.param("id");
    const profile = c.get("profile");
    const supabase = createSupabaseAdmin(c.env);

    const now = new Date().toISOString();

    const { data: conversation, error } = await supabase
      .from("conversation_threads")
      .update({
        assigned_to: profile.id,
        updated_at: now,
      })
      .eq("id", threadId)
      .select("*")
      .maybeSingle();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    if (!conversation) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.json(conversation);
  }
);

app.patch(
  "/api/conversations/:id/assign",
  requireRoles("manager"),
  async (c) => {
    const threadId = c.req.param("id");
    const supabase = createSupabaseAdmin(c.env);

    const body = await c.req.json<{
      assigned_to?: string;
      staff_id?: string;
    }>();

    const staffId = body.assigned_to ?? body.staff_id;

    if (!staffId) {
      return c.json({ error: "assigned_to is required" }, 400);
    }

    const { data: staffUser, error: staffError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", staffId)
      .in("role", ["manager", "sales"])
      .maybeSingle();

    if (staffError) {
      return c.json({ error: staffError.message }, 500);
    }

    if (!staffUser) {
      return c.json({ error: "Selected staff user is invalid" }, 400);
    }

    const now = new Date().toISOString();

    const { data: conversation, error: updateError } = await supabase
      .from("conversation_threads")
      .update({
        assigned_to: staffId,
        updated_at: now,
      })
      .eq("id", threadId)
      .select("*")
      .maybeSingle();

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }

    if (!conversation) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.json({
      conversation,
      assigned_to: staffUser,
    });
  }
);

app.get("/api/deals", requireRoles("manager", "sales"), async (c) => {
  const supabase = createSupabaseAdmin(c.env);

  const { data: deals, error } = await supabase
    .from("deals")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  const dealRows = (deals ?? []) as any[];

  const clientIds = [
    ...new Set(dealRows.map((deal) => deal.client_id).filter(Boolean)),
  ] as string[];

  const ownerIds = [
    ...new Set(dealRows.map((deal) => deal.owner_id).filter(Boolean)),
  ] as string[];

  let clientsById = new Map<string, any>();
  let ownersById = new Map<string, any>();

  if (clientIds.length > 0) {
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, full_name, email")
      .in("id", clientIds);

    if (clientsError) {
      return c.json({ error: clientsError.message }, 500);
    }

    clientsById = new Map(
      ((clients ?? []) as any[]).map((client) => [client.id, client])
    );
  }

  if (ownerIds.length > 0) {
    const { data: owners, error: ownersError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("id", ownerIds);

    if (ownersError) {
      return c.json({ error: ownersError.message }, 500);
    }

    ownersById = new Map(
      ((owners ?? []) as any[]).map((owner) => [owner.id, owner])
    );
  }

  const enrichedDeals = dealRows.map((deal) => ({
    ...deal,
    client: deal.client_id ? clientsById.get(deal.client_id) ?? null : null,
    owner_profile: deal.owner_id ? ownersById.get(deal.owner_id) ?? null : null,
  }));

  return c.json(enrichedDeals);
});

app.post("/api/deals", requireRoles("manager", "sales"), async (c) => {
  const profile = c.get("profile");
  const supabase = createSupabaseAdmin(c.env);

  const body = await c.req.json<{
    client_id?: string;
    title?: string;
    stage?: string;
    value?: number | string | null;
    currency?: string;
    expected_close_date?: string | null;
  }>();

  if (!body.client_id || !body.title) {
    return c.json({ error: "client_id and title are required" }, 400);
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", body.client_id)
    .maybeSingle();

  if (clientError) {
    return c.json({ error: clientError.message }, 500);
  }

  if (!client) {
    return c.json({ error: "Client not found" }, 404);
  }

  const now = new Date().toISOString();

  const dealInsert: Record<string, unknown> = {
    client_id: body.client_id,
    owner_id: profile.id,
    title: body.title,
    stage: body.stage ?? "new_lead",
    value: parseNumberOrNull(body.value),
    currency: body.currency ?? "USD",
    created_at: now,
    updated_at: now,
  };

  if (body.expected_close_date) {
    dealInsert.expected_close_date = body.expected_close_date;
  }

  const { data: deal, error } = await supabase
    .from("deals")
    .insert(dealInsert)
    .select("*")
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(deal, 201);
});

app.get("/api/deals/:id", requireRoles("manager", "sales"), async (c) => {
  const dealId = c.req.param("id");
  const supabase = createSupabaseAdmin(c.env);

  const { data: deal, error } = await supabase
    .from("deals")
    .select("*")
    .eq("id", dealId)
    .maybeSingle();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  if (!deal) {
    return c.json({ error: "Deal not found" }, 404);
  }

  let client = null;
  let ownerProfile = null;

  if (deal.client_id) {
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("id, full_name, email")
      .eq("id", deal.client_id)
      .maybeSingle();

    if (clientError) {
      return c.json({ error: clientError.message }, 500);
    }

    client = clientData;
  }

  if (deal.owner_id) {
    const { data: ownerData, error: ownerError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", deal.owner_id)
      .maybeSingle();

    if (ownerError) {
      return c.json({ error: ownerError.message }, 500);
    }

    ownerProfile = ownerData;
  }

  return c.json({
    ...deal,
    client,
    owner_profile: ownerProfile,
  });
});

app.patch(
  "/api/deals/:id/stage",
  requireRoles("manager", "sales"),
  async (c) => {
    const dealId = c.req.param("id");
    const profile = c.get("profile");
    const supabase = createSupabaseAdmin(c.env);

    const body = await c.req.json<{
      stage?: string;
    }>();

    if (!body.stage) {
      return c.json({ error: "stage is required" }, 400);
    }

    const { data: existingDeal, error: existingDealError } = await supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .maybeSingle();

    if (existingDealError) {
      return c.json({ error: existingDealError.message }, 500);
    }

    if (!existingDeal) {
      return c.json({ error: "Deal not found" }, 404);
    }

    const now = new Date().toISOString();

    const { data: deal, error } = await supabase
      .from("deals")
      .update({
        stage: body.stage,
        updated_at: now,
      })
      .eq("id", dealId)
      .select("*")
      .maybeSingle();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    if (!deal) {
      return c.json({ error: "Deal not found" }, 404);
    }

    await supabase.from("deal_stage_history").insert({
      deal_id: dealId,
      from_stage: existingDeal.stage,
      to_stage: body.stage,
      changed_by: profile.id,
      created_at: now,
    });

    return c.json(deal);
  }
);

app.patch(
  "/api/deals/:id/assign",
  requireRoles("manager"),
  async (c) => {
    const dealId = c.req.param("id");
    const supabase = createSupabaseAdmin(c.env);

    const body = await c.req.json<{
      owner_id?: string;
    }>();

    if (!body.owner_id) {
      return c.json({ error: "owner_id is required" }, 400);
    }

    const { data: staffUser, error: staffError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", body.owner_id)
      .in("role", ["manager", "sales"])
      .maybeSingle();

    if (staffError) {
      return c.json({ error: staffError.message }, 500);
    }

    if (!staffUser) {
      return c.json({ error: "Selected owner is not a valid staff user" }, 400);
    }

    const now = new Date().toISOString();

    const { data: deal, error } = await supabase
      .from("deals")
      .update({
        owner_id: body.owner_id,
        updated_at: now,
      })
      .eq("id", dealId)
      .select("*")
      .maybeSingle();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    if (!deal) {
      return c.json({ error: "Deal not found" }, 404);
    }

    return c.json({
      deal,
      owner: staffUser,
    });
  }
);

app.onError((error, c) => {
  const message = error instanceof Error ? error.message : "Unknown error";

  return c.json(
    {
      error: "Internal Server Error",
      message,
    },
    500
  );
});

export default app;
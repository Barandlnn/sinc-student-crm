import { Hono } from "hono";
import { cors } from "hono/cors";
import { createSupabaseAdmin, type Env } from "./lib/supabaseAdmin";

const app = new Hono<{ Bindings: Env }>();

type ClientRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  target_country: string | null;
  created_at: string;
};

type DealRow = {
  id: string;
  client_id: string;
  owner_id: string | null;
  title: string;
  stage: string;
  value_amount: number | null;
  value_currency: string | null;
  expected_intake: string | null;
  created_at: string;
};

type ClientNameRow = {
  id: string;
  full_name: string;
};

type ProfileNameRow = {
  id: string;
  full_name: string;
};

type ConversationRow = {
  id: string;
  client_id: string;
  assigned_to: string | null;
  subject: string;
  status: string;
  last_message_at: string;
  created_at: string;
};

type DashboardConversationRow = {
  status: string;
  assigned_to: string | null;
};

type DashboardDealRow = {
  stage: string;
  owner_id: string | null;
};

type RecentStageHistoryRow = {
  from_stage: string | null;
  to_stage: string;
  created_at: string;
};


app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// Health check
app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    service: "sinc-student-crm-api",
  });
});

// Current user mock endpoint
// Current user endpoint from Supabase Auth token
app.get("/api/me", async (c) => {
  const supabase = createSupabaseAdmin(c.env);

  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json({ error: "Missing authorization token" }, 401);
  }

  if (!authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Invalid authorization format" }, 401);
  }

  const token = authHeader.slice("Bearer ".length);

  const { data, error: userError } = await supabase.auth.getUser(token);

  if (userError || !data.user) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  const user = data.user;

  const { data: profileById } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  let profile = profileById;

  if (!profile && user.email) {
    const { data: profileByEmail } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("email", user.email)
      .maybeSingle();

    profile = profileByEmail;
  }

  if (!profile) {
    return c.json(
      {
        error: "Profile not found",
        userId: user.id,
        userEmail: user.email,
      },
      404
    );
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
  });
});

// Clients endpoint from Supabase
app.get("/api/clients", async (c) => {
  const supabase = createSupabaseAdmin(c.env);

  const { data, error } = await supabase
    .from("clients")
    .select(
      `
        id,
        full_name,
        email,
        phone,
        country,
        target_country,
        created_at
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return c.json(
      {
        error: error.message,
      },
      500,
    );
  }

  const clients = (data ?? []).map((client) => ({
    id: client.id,
    fullName: client.full_name,
    email: client.email,
    phone: client.phone,
    country: client.country,
    targetCountry: client.target_country,
    activeDeal: null,
  }));

  return c.json({
    data: clients,
  });
});

// Conversations mock endpoint
// Conversations endpoint from Supabase
app.get("/api/conversations", async (c) => {
  const supabase = createSupabaseAdmin(c.env);

  const { data: conversationsData, error: conversationsError } = await supabase
    .from("conversation_threads")
    .select(
      `
        id,
        client_id,
        assigned_to,
        subject,
        status,
        last_message_at,
        created_at
      `,
    )
    .order("last_message_at", { ascending: false });

  if (conversationsError) {
    return c.json({ error: conversationsError.message }, 500);
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name");

  if (profilesError) {
    return c.json({ error: profilesError.message }, 500);
  }

  const profileNameById = new Map(
    ((profilesData ?? []) as ProfileNameRow[]).map((profile) => [
      profile.id,
      profile.full_name,
    ]),
  );

  const conversationRows = (conversationsData ?? []) as ConversationRow[];

  const conversations = conversationRows.map((conversation) => ({
    id: conversation.id,
    clientId: conversation.client_id,
    subject: conversation.subject,
    status: conversation.status,
    assignedTo: conversation.assigned_to
      ? profileNameById.get(conversation.assigned_to) ?? "Unknown Owner"
      : null,
  }));

  return c.json({
    data: conversations,
  });
});
// Deals mock endpoint
// Deals endpoint from Supabase
app.get("/api/deals", async (c) => {
  const supabase = createSupabaseAdmin(c.env);

  const { data: dealsData, error: dealsError } = await supabase
    .from("deals")
    .select(
      `
        id,
        client_id,
        owner_id,
        title,
        stage,
        value_amount,
        value_currency,
        expected_intake,
        created_at
      `,
    )
    .order("created_at", { ascending: false });

  if (dealsError) {
    return c.json({ error: dealsError.message }, 500);
  }

  const dealsRows = (dealsData ?? []) as DealRow[];

  const { data: clientsData, error: clientsError } = await supabase
    .from("clients")
    .select("id, full_name");

  if (clientsError) {
    return c.json({ error: clientsError.message }, 500);
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name");

  if (profilesError) {
    return c.json({ error: profilesError.message }, 500);
  }

  const clientNameById = new Map(
    ((clientsData ?? []) as ClientNameRow[]).map((client) => [
      client.id,
      client.full_name,
    ]),
  );

  const profileNameById = new Map(
    ((profilesData ?? []) as ProfileNameRow[]).map((profile) => [
      profile.id,
      profile.full_name,
    ]),
  );

  const deals = dealsRows.map((deal) => ({
    id: deal.id,
    clientId: deal.client_id,
    clientName: clientNameById.get(deal.client_id) ?? "Unknown Client",
    title: deal.title,
    ownerId: deal.owner_id,
    ownerName: deal.owner_id
      ? profileNameById.get(deal.owner_id) ?? "Unknown Owner"
      : null,
    stage: deal.stage,
    valueAmount: deal.value_amount,
    valueCurrency: deal.value_currency,
    expectedIntake: deal.expected_intake,
  }));

  return c.json({
    data: deals,
  });
});

// Dashboard mock endpoint
// Dashboard endpoint from Supabase
app.get("/api/dashboard", async (c) => {
  const supabase = createSupabaseAdmin(c.env);

  const { data: conversationsData, error: conversationsError } = await supabase
    .from("conversation_threads")
    .select("status, assigned_to");

  if (conversationsError) {
    return c.json({ error: conversationsError.message }, 500);
  }

  const { data: dealsData, error: dealsError } = await supabase
    .from("deals")
    .select("stage, owner_id");

  if (dealsError) {
    return c.json({ error: dealsError.message }, 500);
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name");

  if (profilesError) {
    return c.json({ error: profilesError.message }, 500);
  }

  const { data: stageHistoryData, error: stageHistoryError } = await supabase
    .from("deal_stage_history")
    .select("from_stage, to_stage, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (stageHistoryError) {
    return c.json({ error: stageHistoryError.message }, 500);
  }

  const conversations = (conversationsData ?? []) as DashboardConversationRow[];
  const deals = (dealsData ?? []) as DashboardDealRow[];
  const profiles = (profilesData ?? []) as ProfileNameRow[];
  const stageHistory = (stageHistoryData ?? []) as RecentStageHistoryRow[];

  const conversationsByStatus = {
    open: conversations.filter((conversation) => conversation.status === "open")
      .length,
    pending: conversations.filter(
      (conversation) => conversation.status === "pending",
    ).length,
    closed: conversations.filter(
      (conversation) => conversation.status === "closed",
    ).length,
  };

  const unassignedConversations = conversations.filter(
    (conversation) => conversation.assigned_to === null,
  ).length;

  const dealStages = [
    "new_lead",
    "contacted",
    "consultation_booked",
    "documents_requested",
    "application_started",
    "submitted",
    "won",
    "lost",
  ];

  const dealsByStage = Object.fromEntries(
    dealStages.map((stage) => [
      stage,
      deals.filter((deal) => deal.stage === stage).length,
    ]),
  );

  const profileNameById = new Map(
    profiles.map((profile) => [profile.id, profile.full_name]),
  );

  const ownerCounts = new Map<string, number>();

  for (const deal of deals) {
    const ownerName = deal.owner_id
      ? profileNameById.get(deal.owner_id) ?? "Unknown Owner"
      : "Unassigned";

    ownerCounts.set(ownerName, (ownerCounts.get(ownerName) ?? 0) + 1);
  }

  const dealsByOwner = Array.from(ownerCounts.entries()).map(
    ([ownerName, count]) => ({
      ownerName,
      count,
    }),
  );

  const recentActivity = stageHistory.map((history) => {
    if (history.from_stage) {
      return `Deal moved from ${history.from_stage} to ${history.to_stage}`;
    }

    return `Deal created in ${history.to_stage}`;
  });

  return c.json({
    conversationsByStatus,
    unassignedConversations,
    dealsByStage,
    dealsByOwner,
    recentActivity,
  });
});

// Fallback
app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      path: c.req.path,
    },
    404,
  );
});

export default app;
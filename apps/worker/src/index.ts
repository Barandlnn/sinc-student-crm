import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";

import { createSupabaseAdmin, type Env } from "./lib/supabaseAdmin";

type AppRole = "manager" | "sales" | "client";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
};

type AppVariables = {
  user: {
    id: string;
    email: string | null;
  };
  profile: Profile;
};

const app = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

app.use(
  "/api/*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.text("Student CRM Worker API is running.");
});

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    service: "student-crm-worker",
  });
});

const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AppVariables;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        error: "Unauthorized",
        message: "Missing Authorization bearer token.",
      },
      401
    );
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const supabase = createSupabaseAdmin(c.env);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return c.json(
      {
        error: "Unauthorized",
        message: "Invalid or expired token.",
      },
      401
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return c.json(
      {
        error: "Profile not found",
        message: profileError?.message ?? "No matching profile record.",
      },
      404
    );
  }

  c.set("user", {
    id: user.id,
    email: user.email ?? null,
  });

  c.set("profile", profile as Profile);

  await next();
});

function requireRoles(...allowedRoles: AppRole[]) {
  return createMiddleware<{
    Bindings: Env;
    Variables: AppVariables;
  }>(async (c, next) => {
    const profile = c.get("profile");

    if (!profile) {
      return c.json(
        {
          error: "Unauthorized",
          message: "Profile is missing from request context.",
        },
        401
      );
    }

    if (!allowedRoles.includes(profile.role)) {
      return c.json(
        {
          error: "Forbidden",
          message: `This endpoint requires one of these roles: ${allowedRoles.join(
            ", "
          )}`,
        },
        403
      );
    }

    await next();
  });
}

app.use("/api/*", authMiddleware);

app.get("/api/me", async (c) => {
  const user = c.get("user");
  const profile = c.get("profile");

  return c.json({
    user,
    profile,
  });
});

app.get("/api/staff", requireRoles("manager", "sales"), async (c) => {
  const supabase = createSupabaseAdmin(c.env);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .in("role", ["manager", "sales"])
    .order("full_name", { ascending: true });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data ?? []);
});

app.get("/api/dashboard", requireRoles("manager", "sales"), async (c) => {
  const supabase = createSupabaseAdmin(c.env);

  const [conversationsResult, dealsResult, profilesResult] = await Promise.all([
    supabase.from("conversation_threads").select("*"),
    supabase.from("deals").select("*"),
    supabase.from("profiles").select("id, email, full_name, role"),
  ]);

  if (conversationsResult.error) {
    return c.json({ error: conversationsResult.error.message }, 500);
  }

  if (dealsResult.error) {
    return c.json({ error: dealsResult.error.message }, 500);
  }

  if (profilesResult.error) {
    return c.json({ error: profilesResult.error.message }, 500);
  }

  const conversations = (conversationsResult.data ?? []) as any[];
  const deals = (dealsResult.data ?? []) as any[];
  const profiles = (profilesResult.data ?? []) as any[];

  const conversationsByStatus = {
    open: 0,
    pending: 0,
    closed: 0,
  };

  for (const conversation of conversations) {
    const status = String(conversation.status ?? "open").toLowerCase();

    if (status === "closed") {
      conversationsByStatus.closed += 1;
    } else if (status === "pending") {
      conversationsByStatus.pending += 1;
    } else {
      conversationsByStatus.open += 1;
    }
  }

  const unassignedConversations = conversations.filter((conversation) => {
    const assignedUser =
      conversation.assigned_to ??
      conversation.assigned_to_id ??
      conversation.assignee_id ??
      null;

    return !assignedUser;
  }).length;

  const dealsByStage: Record<string, number> = {};

  for (const deal of deals) {
    const stage = String(deal.stage ?? "unknown").toLowerCase();
    dealsByStage[stage] = (dealsByStage[stage] ?? 0) + 1;
  }

  const profileNameById = new Map<string, string>();

  for (const profile of profiles) {
    profileNameById.set(
      profile.id,
      profile.full_name ?? profile.email ?? "Unknown Owner"
    );
  }

  const dealsByOwnerMap = new Map<string, number>();

  for (const deal of deals) {
    const ownerId =
      deal.owner_id ??
      deal.assigned_to ??
      deal.assigned_to_id ??
      deal.sales_id ??
      null;

    const ownerName = ownerId
      ? profileNameById.get(ownerId) ?? "Unknown Owner"
      : "Unassigned";

    dealsByOwnerMap.set(ownerName, (dealsByOwnerMap.get(ownerName) ?? 0) + 1);
  }

  const dealsByOwner = Array.from(dealsByOwnerMap.entries()).map(
    ([ownerName, count]) => ({
      ownerName,
      count,
    })
  );

  const recentActivity = [
    `${conversations.length} conversation thread(s) loaded from Supabase.`,
    `${deals.length} deal(s) loaded from Supabase.`,
    `${profiles.length} profile record(s) available.`,
  ];

  return c.json({
    conversationsByStatus,
    unassignedConversations,
    dealsByStage,
    dealsByOwner,
    recentActivity,
  });
});

app.get("/api/clients", requireRoles("manager", "sales"), async (c) => {
  const supabase = createSupabaseAdmin(c.env);

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data ?? []);
});

app.get("/api/clients/:id", requireRoles("manager", "sales"), async (c) => {
  const id = c.req.param("id");
  const supabase = createSupabaseAdmin(c.env);

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

app.get(
  "/api/conversations",
  requireRoles("manager", "sales", "client"),
  async (c) => {
    const profile = c.get("profile");
    const supabase = createSupabaseAdmin(c.env);

    let query = supabase
      .from("conversation_threads")
      .select("*")
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

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    const conversations = (data ?? []) as any[];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email");

    if (profilesError) {
      return c.json({ error: profilesError.message }, 500);
    }

    const profileNameById = new Map<string, string>();

    for (const item of profiles ?? []) {
      profileNameById.set(
        item.id,
        item.full_name ?? item.email ?? "Unknown User"
      );
    }

    const enrichedConversations = conversations.map((conversation) => {
      const assignedTo = conversation.assigned_to as string | null;

      return {
        ...conversation,
        assigned_to_name: assignedTo
          ? profileNameById.get(assignedTo) ?? assignedTo
          : null,
      };
    });

    return c.json(enrichedConversations);
  }
);

app.post("/api/conversations", requireRoles("client"), async (c) => {
  const profile = c.get("profile");
  const supabase = createSupabaseAdmin(c.env);

  const body = await c.req.json<{
    subject?: string;
    message?: string;
  }>();

  const subject = body.subject?.trim();
  const messageBody = body.message?.trim();

  if (!subject || !messageBody) {
    return c.json(
      {
        error: "Validation Error",
        message: "Subject and message are required.",
      },
      400
    );
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
    return c.json(
      {
        error: "Client profile not found",
        message: "No client record matches the logged-in user email.",
      },
      404
    );
  }

  const now = new Date().toISOString();

  const { data: thread, error: threadError } = await supabase
    .from("conversation_threads")
    .insert({
      client_id: client.id,
      assigned_to: null,
      subject,
      status: "open",
      last_message_at: now,
    })
    .select("*")
    .single();

  if (threadError) {
    return c.json({ error: threadError.message }, 500);
  }

  const { error: messageError } = await supabase
    .from("conversation_messages")
    .insert({
      thread_id: thread.id,
      sender_id: profile.id,
      sender_type: "client",
      body: messageBody,
    });

  if (messageError) {
    return c.json(
      {
        error: messageError.message,
        message:
          "Conversation was created, but the first message could not be saved.",
      },
      500
    );
  }

  return c.json(
    {
      ...thread,
      assigned_to_name: null,
    },
    201
  );
});

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
      .single();

    if (threadError || !thread) {
      return c.json(
        {
          error: threadError?.message ?? "Conversation not found.",
        },
        404
      );
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
        return c.json(
          {
            error: "Forbidden",
            message: "You can only access your own conversations.",
          },
          403
        );
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

    return c.json(messages ?? []);
  }
);

app.post(
  "/api/conversations/:id/messages",
  requireRoles("manager", "sales", "client"),
  async (c) => {
    const threadId = c.req.param("id");
    const profile = c.get("profile");
    const supabase = createSupabaseAdmin(c.env);

    const body = await c.req.json<{ body?: string }>();
    const messageBody = body.body?.trim();

    if (!messageBody) {
      return c.json(
        {
          error: "Validation Error",
          message: "Message body is required.",
        },
        400
      );
    }

    const { data: thread, error: threadError } = await supabase
      .from("conversation_threads")
      .select("*")
      .eq("id", threadId)
      .single();

    if (threadError || !thread) {
      return c.json(
        {
          error: threadError?.message ?? "Conversation not found.",
        },
        404
      );
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
        return c.json(
          {
            error: "Forbidden",
            message: "You can only send messages to your own conversations.",
          },
          403
        );
      }
    }

    const now = new Date().toISOString();
    const senderType = profile.role === "client" ? "client" : "staff";

    const { data: message, error: messageError } = await supabase
      .from("conversation_messages")
      .insert({
        thread_id: threadId,
        sender_id: profile.id,
        sender_type: senderType,
        body: messageBody,
      })
      .select("*")
      .single();

    if (messageError) {
      return c.json({ error: messageError.message }, 500);
    }

    const { error: updateThreadError } = await supabase
      .from("conversation_threads")
      .update({
        last_message_at: now,
        updated_at: now,
      })
      .eq("id", threadId);

    if (updateThreadError) {
      return c.json({ error: updateThreadError.message }, 500);
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

    const { data: thread, error: threadError } = await supabase
      .from("conversation_threads")
      .select("*")
      .eq("id", threadId)
      .single();

    if (threadError || !thread) {
      return c.json(
        {
          error: threadError?.message ?? "Conversation not found.",
        },
        404
      );
    }

    const now = new Date().toISOString();

    const { data: updatedThread, error: updateError } = await supabase
      .from("conversation_threads")
      .update({
        assigned_to: profile.id,
        updated_at: now,
      })
      .eq("id", threadId)
      .select("*")
      .single();

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }

    return c.json({
      ...updatedThread,
      assigned_to_name: profile.full_name ?? profile.email ?? "Unknown User",
    });
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
    }>();

    const assignedTo = body.assigned_to?.trim();

    if (!assignedTo) {
      return c.json(
        {
          error: "Validation Error",
          message: "assigned_to is required.",
        },
        400
      );
    }

    const { data: assignee, error: assigneeError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", assignedTo)
      .in("role", ["manager", "sales"])
      .single();

    if (assigneeError || !assignee) {
      return c.json(
        {
          error: assigneeError?.message ?? "Assignee not found.",
        },
        404
      );
    }

    const now = new Date().toISOString();

    const { data: updatedThread, error: updateError } = await supabase
      .from("conversation_threads")
      .update({
        assigned_to: assignee.id,
        updated_at: now,
      })
      .eq("id", threadId)
      .select("*")
      .single();

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }

    return c.json({
      ...updatedThread,
      assigned_to_name: assignee.full_name ?? assignee.email ?? "Unknown User",
    });
  }
);

app.get("/api/deals", requireRoles("manager", "sales"), async (c) => {
  const supabase = createSupabaseAdmin(c.env);

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data ?? []);
});

app.post("/api/deals", requireRoles("manager", "sales"), async (c) => {
  const profile = c.get("profile");
  const supabase = createSupabaseAdmin(c.env);

  const body = await c.req.json<{
    client_id?: string;
    title?: string;
    stage?: string;
  }>();

  const clientId = body.client_id?.trim();
  const title = body.title?.trim();
  const stage = body.stage?.trim() || "new_lead";

  const allowedStages = [
    "new_lead",
    "contacted",
    "consultation_booked",
    "proposal_sent",
    "won",
    "lost",
  ];

  if (!clientId || !title) {
    return c.json(
      {
        error: "Validation Error",
        message: "Client and deal title are required.",
      },
      400
    );
  }

  if (!allowedStages.includes(stage)) {
    return c.json(
      {
        error: "Validation Error",
        message: "Invalid deal stage.",
      },
      400
    );
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    return c.json(
      {
        error: clientError?.message ?? "Client not found.",
      },
      404
    );
  }

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .insert({
      client_id: clientId,
      owner_id: profile.id,
      title,
      stage,
    })
    .select("*")
    .single();

  if (dealError) {
    return c.json({ error: dealError.message }, 500);
  }

  return c.json(deal, 201);
});

app.get("/api/deals/:id", requireRoles("manager", "sales"), async (c) => {
  const id = c.req.param("id");
  const supabase = createSupabaseAdmin(c.env);

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

app.patch(
  "/api/deals/:id/stage",
  requireRoles("manager", "sales"),
  async (c) => {
    const id = c.req.param("id");
    const profile = c.get("profile");
    const supabase = createSupabaseAdmin(c.env);

    const body = await c.req.json<{ stage?: string }>();
    const nextStage = body.stage?.trim();

    const allowedStages = [
      "new_lead",
      "contacted",
      "consultation_booked",
      "proposal_sent",
      "won",
      "lost",
    ];

    if (!nextStage || !allowedStages.includes(nextStage)) {
      return c.json(
        {
          error: "Validation Error",
          message: "Invalid deal stage.",
        },
        400
      );
    }

    const { data: currentDeal, error: currentDealError } = await supabase
      .from("deals")
      .select("*")
      .eq("id", id)
      .single();

    if (currentDealError || !currentDeal) {
      return c.json(
        {
          error: currentDealError?.message ?? "Deal not found.",
        },
        404
      );
    }

    const previousStage = currentDeal.stage;
    const now = new Date().toISOString();

    const { data: updatedDeal, error: updateError } = await supabase
      .from("deals")
      .update({
        stage: nextStage,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }

    const { error: historyError } = await supabase
      .from("deal_stage_history")
      .insert({
        deal_id: id,
        from_stage: previousStage,
        to_stage: nextStage,
        changed_by: profile.id,
      });

    if (historyError) {
      return c.json(
        {
          error: historyError.message,
          message:
            "Deal stage was updated, but stage history could not be saved.",
          deal: updatedDeal,
        },
        500
      );
    }

    return c.json(updatedDeal);
  }
);

app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      path: c.req.path,
    },
    404
  );
});

app.onError((err, c) => {
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message,
    },
    500
  );
});

export default app;
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// Health check
// Bu endpoint backend çalışıyor mu diye hızlı test içindir.
app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    service: "sinc-student-crm-api",
  });
});

// Current user mock endpoint
// Daha sonra Supabase Auth token'dan gerçek user/profile döndüreceğiz.
app.get("/api/me", (c) => {
  return c.json({
    id: "mock-manager-id",
    fullName: "Demo Manager",
    role: "manager",
  });
});

// Clients mock endpoint
app.get("/api/clients", (c) => {
  return c.json({
    data: [
      {
        id: "client-1",
        fullName: "Aruzhan Karim",
        email: "aruzhan@example.com",
        phone: "+77000000000",
        country: "Kazakhstan",
        targetCountry: "Canada",
        activeDeal: "Canada business program",
      },
      {
        id: "client-2",
        fullName: "Nursultan A.",
        email: "nur@example.com",
        phone: "+77000000001",
        country: "Kazakhstan",
        targetCountry: "UK",
        activeDeal: "Computer Science",
      },
    ],
  });
});

// Conversations mock endpoint
app.get("/api/conversations", (c) => {
  return c.json({
    data: [
      {
        id: "thread-1",
        clientId: "client-1",
        subject: "Admission help",
        status: "open",
        assignedTo: null,
      },
      {
        id: "thread-2",
        clientId: "client-2",
        subject: "Visa question",
        status: "open",
        assignedTo: "sales-1",
      },
    ],
  });
});

// Deals mock endpoint
app.get("/api/deals", (c) => {
  return c.json({
    data: [
      {
        id: "deal-1",
        clientId: "client-1",
        clientName: "Aruzhan Karim",
        title: "Canada business program",
        ownerId: "sales-1",
        ownerName: "Aigerim",
        stage: "new_lead",
        valueAmount: 1200,
        valueCurrency: "USD",
        expectedIntake: "Fall 2026",
      },
      {
        id: "deal-2",
        clientId: "client-2",
        clientName: "Nursultan A.",
        title: "UK Computer Science",
        ownerId: "sales-2",
        ownerName: "Dias",
        stage: "contacted",
        valueAmount: 1500,
        valueCurrency: "USD",
        expectedIntake: "Spring 2027",
      },
    ],
  });
});

// Dashboard mock endpoint
app.get("/api/dashboard", (c) => {
  return c.json({
    conversationsByStatus: {
      open: 18,
      pending: 4,
      closed: 12,
    },
    unassignedConversations: 5,
    dealsByStage: {
      new_lead: 10,
      contacted: 8,
      consultation_booked: 6,
      documents_requested: 4,
      application_started: 3,
      submitted: 2,
      won: 9,
      lost: 1,
    },
    dealsByOwner: [
      { ownerName: "Aigerim", count: 14 },
      { ownerName: "Dias", count: 11 },
      { ownerName: "Mira", count: 7 },
      { ownerName: "Unassigned", count: 10 },
    ],
    recentActivity: [
      "Deal moved from new_lead to contacted",
      "Aigerim replied in Admission help",
      "Deal note added",
    ],
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
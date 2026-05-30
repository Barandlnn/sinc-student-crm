# Student CRM + Chat + Deal Pipeline

A full-stack CRM application developed as a technical test project. The system allows managers, sales staff, and clients to interact through role-based dashboards, client management, realtime conversations, and a deal pipeline.

## Live Deployment

* Frontend URL: `https://sinc-student-crm.pages.dev`
* Worker API URL: `https://sinc-student-crm-worker.baran-dev-2026.workers.dev`
* Public Repository: `https://github.com/Barandlnn/sinc-student-crm`

> The frontend and Worker API have been deployed to Cloudflare.


---

## Features

### Authentication and Authorization

- Supabase Auth email/password login
- Protected frontend routes
- Backend bearer-token verification
- Role-based authorization for:
  - `manager`
  - `sales`
  - `client`

### Dashboard

Managers and sales users can view:

- Open conversations
- Unassigned conversations
- Active deals
- Won deals
- Deals grouped by pipeline stage
- Deals grouped by owner
- Recent CRM activity

### Client Management

Managers and sales users can:

- View the client list
- Search clients
- Open a client detail page
- Review client profile data
- Review conversations
- Review deals
- Review recent activity

### Realtime Conversations

- Clients can start a new conversation
- Clients can view only their own conversations
- Managers and sales users can view conversations
- Managers and sales users can reply to clients
- Sales users can assign a conversation to themselves
- Managers can reassign conversations to staff members
- New chat messages appear in realtime through Supabase Realtime

### Deal Pipeline

- Managers and sales users can view deals grouped by pipeline stage
- Sales users can create a new client deal
- Deal detail pages show:
  - Client
  - Owner
  - Current stage
  - Deal value
  - Created date
  - Updated date
- Deal stages can be updated
- Managers can reassign deal ownership

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Supabase JavaScript Client
- Tailwind CSS
- Lucide React

### Backend

- Cloudflare Workers
- Hono
- TypeScript
- Supabase JavaScript Client

### Database and Authentication

- Supabase PostgreSQL
- Supabase Auth
- Supabase Realtime

---

## Project Structure

```text
sinc-student-crm/
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── layouts/
│   │   │   ├── lib/
│   │   │   ├── pages/
│   │   │   └── router.tsx
│   │   ├── .env.local
│   │   └── package.json
│   │
│   └── worker/
│       ├── src/
│       │   ├── lib/
│       │   └── index.ts
│       ├── .dev.vars
│       ├── wrangler.jsonc
│       └── package.json
│
└── README.md
```

---

## Database Schema

The Supabase database contains the following main tables:

| Table | Purpose |
|---|---|
| `profiles` | Stores authenticated user profile data and roles |
| `clients` | Stores CRM client records |
| `conversation_threads` | Stores conversation metadata |
| `conversation_messages` | Stores chat messages |
| `deals` | Stores deal pipeline records |
| `deal_stage_history` | Stores deal stage changes |
| `deal_notes` | Stores notes related to deals |

Realtime updates are enabled for:

- `conversation_messages`
- `conversation_threads`

---

## Role Permissions

| Feature | Manager | Sales | Client |
|---|---:|---:|---:|
| Login | ✅ | ✅ | ✅ |
| View dashboard | ✅ | ✅ | ❌ |
| View clients | ✅ | ✅ | ❌ |
| View own conversations | ✅ | ✅ | ✅ |
| View all staff conversations | ✅ | ✅ | ❌ |
| Start a conversation | ❌ | ❌ | ✅ |
| Reply to conversations | ✅ | ✅ | ✅ |
| Assign conversation to self | ✅ | ✅ | ❌ |
| Reassign conversations | ✅ | ❌ | ❌ |
| View pipeline | ✅ | ✅ | ❌ |
| Create deals | ✅ | ✅ | ❌ |
| Update deal stage | ✅ | ✅ | ❌ |
| Reassign deal owner | ✅ | ❌ | ❌ |

---

## API Routes

The Cloudflare Worker exposes the following main routes:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/me` | Returns the authenticated user profile |
| `GET` | `/api/staff` | Returns manager and sales staff |
| `GET` | `/api/dashboard` | Returns dashboard metrics |
| `GET` | `/api/clients` | Returns CRM clients |
| `GET` | `/api/clients/:id` | Returns a client detail record |
| `GET` | `/api/conversations` | Returns conversations based on the user's role |
| `POST` | `/api/conversations` | Creates a new client conversation |
| `GET` | `/api/conversations/:id/messages` | Returns messages for a conversation |
| `POST` | `/api/conversations/:id/messages` | Sends a conversation message |
| `PATCH` | `/api/conversations/:id/assign-to-me` | Assigns a conversation to the current staff user |
| `PATCH` | `/api/conversations/:id/assign` | Reassigns a conversation |
| `GET` | `/api/deals` | Returns pipeline deals |
| `POST` | `/api/deals` | Creates a deal |
| `GET` | `/api/deals/:id` | Returns deal details |
| `PATCH` | `/api/deals/:id/stage` | Updates a deal stage |
| `PATCH` | `/api/deals/:id/assign` | Reassigns deal ownership |

Protected endpoints require:

```http
Authorization: Bearer <supabase_access_token>
```

---

## Demo Users

The following accounts can be used to test the role-based flows:

| Role | Email | Password |
|---|---|---|
| Manager | `manager@sinc.test` | `Password123!` |
| Sales | `sales1@sinc.test` | `Password123!` |
| Sales | `sales2@sinc.test` | `Password123!` |
| Client | `client1@sinc.test` | `Password123!` |

---

## Local Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sinc-student-crm
```

### 2. Configure the Frontend

Open the frontend directory:

```bash
cd apps/frontend
npm install
```

Create:

```text
apps/frontend/.env.local
```

Add:

```env
VITE_API_BASE_URL=http://127.0.0.1:8787/api
VITE_SUPABASE_URL=<your_supabase_project_url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your_supabase_publishable_key>
```

> The local Worker port may be `8787` or `8788`. Use the port displayed by Wrangler when the Worker starts.

Run the frontend:

```bash
npm run dev
```

### 3. Configure the Worker

Open another terminal:

```bash
cd apps/worker
npm install
```

Create:

```text
apps/worker/.dev.vars
```

Add:

```env
SUPABASE_URL=<your_supabase_project_url>
SUPABASE_SECRET_KEY=<your_supabase_service_role_key>
```

Run the Worker:

```bash
npm run dev
```

### 4. Open the Application

Open the frontend URL displayed by Vite, usually:

```text
http://localhost:5173
```

---

## Security Notes

- Supabase service-role credentials are stored only in the Worker environment.
- The frontend uses only the Supabase publishable key.
- `.env.local` and `.dev.vars` must not be committed to Git.
- Protected Worker routes verify Supabase access tokens.
- Backend role checks prevent unauthorized API access even if frontend routing is bypassed.

---

## Architecture Overview

```text
React Frontend
      |
      | HTTP requests with Supabase access token
      v
Cloudflare Worker API
      |
      | Server-side authentication and role checks
      v
Supabase PostgreSQL
      |
      ├── Auth
      └── Realtime chat subscriptions
```

The frontend communicates with the Hono API hosted on Cloudflare Workers. The Worker verifies the user's Supabase access token, loads the associated profile, applies role-based authorization rules, and queries Supabase using server-side credentials.

---

## Main User Flows

### Client Flow

1. Log in as `client1@sinc.test`
2. Open the Conversations page
3. Start a new chat
4. Send a message
5. Receive realtime staff replies

### Sales Flow

1. Log in as `sales1@sinc.test`
2. Review dashboard metrics
3. Open conversations
4. Assign an unassigned conversation
5. Reply to a client
6. Open the pipeline
7. Create a new client deal
8. Update the deal stage

### Manager Flow

1. Log in as `manager@sinc.test`
2. Review dashboard metrics
3. Open clients and client details
4. Reassign conversations
5. Open deal details
6. Reassign deal owners
7. Update pipeline stages

---

## Current Status

The core MVP flows are complete:

- Authentication
- Role-based access control
- Dashboard metrics
- Client list and detail view
- Realtime messaging
- Conversation assignment
- Deal creation
- Deal stage updates
- Deal ownership reassignment
- Pipeline board

---

## Author

Developed by Baran as a full-stack developer technical test project.
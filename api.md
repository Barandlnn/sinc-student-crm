# API

Base URL:

```txt
/api
```

All protected requests should include:

```txt
Authorization: Bearer <supabase_access_token>
```

## Current User

```txt
GET /me
```

Returns the current profile and role.

## Clients

```txt
GET /clients
```

Query params:

- `q`
- `ownerId`

```txt
POST /clients
```

Body:

```json
{
  "fullName": "Aruzhan Karim",
  "email": "aruzhan@example.com",
  "phone": "+77000000000",
  "country": "Kazakhstan",
  "targetCountry": "Canada"
}
```

```txt
GET /clients/:clientId
```

Returns client details, conversations, deals, and recent activity.

## Conversations

```txt
GET /conversations
POST /conversations
GET /conversations/:threadId
PATCH /conversations/:threadId/status
PATCH /conversations/:threadId/assign
POST /conversations/:threadId/messages
```

Create conversation body:

```json
{
  "clientId": "client_uuid",
  "subject": "Admission help",
  "message": "I want to study business in Canada."
}
```

Assign body:

```json
{
  "assignedTo": "sales_user_uuid"
}
```

## Deals

```txt
GET /deals
```

Query params:

- `stage`
- `ownerId`
- `clientId`
- `q`

```txt
POST /deals
```

Body:

```json
{
  "clientId": "client_uuid",
  "title": "Canada business program",
  "ownerId": "sales_user_uuid",
  "expectedIntake": "Fall 2026",
  "valueAmount": 1200,
  "valueCurrency": "USD"
}
```

```txt
GET /deals/:dealId
```

Returns deal details, client summary, notes, and stage history.

```txt
PATCH /deals/:dealId/stage
```

Body:

```json
{
  "stage": "consultation_booked"
}
```

If stage is `lost`, include:

```json
{
  "stage": "lost",
  "lostReason": "Client chose another agency"
}
```

```txt
PATCH /deals/:dealId/owner
```

Body:

```json
{
  "ownerId": "sales_user_uuid"
}
```

```txt
POST /deals/:dealId/notes
```

Body:

```json
{
  "body": "Client wants Canada or UK options."
}
```

## Dashboard

```txt
GET /dashboard
```

Returns:

- conversations by status
- unassigned conversation count
- deals by stage
- deals by owner
- recent activity

## Realtime Channels

Subscribe to:

```txt
conversation_messages:thread_id=eq.<threadId>
conversation_threads
deals
deal_stage_history
deal_notes:deal_id=eq.<dealId>
```


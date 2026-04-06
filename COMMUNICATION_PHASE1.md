# Communication System - Phase 1 (Backend Foundation)

## Implemented

- Property-linked conversation APIs
- Persisted chat messages
- Typing state API + events
- Presence heartbeat + online/offline events
- SSE real-time stream endpoint
- Participant-based conversation access controls

## New Backend Routes

Base: `/api/communications` (auth required: `ADMIN`, `SALES`, `VIEWER`)

- `GET /stream`  
  SSE stream for real-time events (`message.created`, `typing.updated`, `presence.updated`, etc.)

- `POST /presence/heartbeat`  
  Updates user online heartbeat.

- `GET /presence?emails=a@x.com,b@y.com`  
  Returns presence rows (all if emails omitted).

- `POST /conversations`  
  Creates property-linked conversation.
  - Required: `propertyId`
  - Optional: `clientName`, `clientEmail`, `clientPhone`, `subject`

- `GET /conversations?propertyId=<uuid>`  
  Lists conversations visible to current user.

- `GET /conversations/:id`  
  Returns conversation details + participants + active typing users.

- `POST /conversations/:id/participants` (`ADMIN`, `SALES`)  
  Adds/updates participant (`userEmail`, optional `role`).

- `GET /conversations/:id/messages?limit=100`  
  Returns message history (oldest -> newest).

- `POST /conversations/:id/messages`  
  Creates message.
  - Provide at least one: `messageText` or `attachmentUrl`
  - Optional: `messageType`, `attachmentName`, `attachmentMime`

- `POST /conversations/:id/typing`  
  Updates typing state.
  - Body: `{ "isTyping": true | false }`

## Access Control Rules

- `ADMIN` can access all conversations.
- `SALES`/`VIEWER` can access only:
  - conversations they created, or
  - conversations where they are participant.

## New Tables (auto-created on server start)

- `communication_conversations`
- `communication_participants`
- `communication_messages`
- `communication_typing`
- `communication_presence`

## Realtime Event Names

- `connected`
- `ping`
- `conversation.created`
- `conversation.participants.updated`
- `message.created`
- `typing.updated`
- `presence.updated`


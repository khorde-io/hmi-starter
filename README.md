# Khorde demo HMI

A minimal example of building your own HMI against a Khorde Hub: an OIDC
login (authorization-code + PKCE, no backend, no client secret) and a
dashboard that runs a few GraphQL queries and one live subscription against
the Hub's API.

It's deliberately small — one login screen, one dashboard, no router, no
state library. The point is showing the integration points, not building a
real operator console.

## Setup

1. Have a Hub running locally — see the [quickstart](https://khorde.io/docs/quickstart)
   if you don't yet.
2. In the control plane (`http://localhost:8085/ui/apps`), **Apps → New app**:
   - Redirect URI: `http://localhost:5173/`
   - Advanced options → add the **same** URI under **Post-logout redirect URIs**
     (sign-out fails without it) and enable **Dev mode** (redirect URI isn't
     https)
   - Copy the client ID it gives you.
3. `cp .env.example .env.local` and paste the client ID into `VITE_CLIENT_ID`.
4. `npm install && npm run dev`, open `http://localhost:5173/`.

## What it shows

- **`src/auth.ts`** — the OIDC login itself: [`oidc-client-ts`](https://github.com/authts/oidc-client-ts),
  authorization-code + PKCE. The scopes are what put the SCADA project (and
  role grants) on the access token; without them the API rejects it.
- **`src/graphql.ts`** — calling the API with that token: a plain `fetch`
  with an `Authorization: Bearer` header for queries, and
  [`graphql-ws`](https://github.com/enisdenjo/graphql-ws) for the live
  subscription (the Hub expects the token as `{ token }` in
  `connectionParams`, not an `Authorization` header). Queries and
  subscriptions hit the exact same URL — subscriptions just upgrade it to a
  WebSocket.
- **`src/Dashboard.tsx`** — three canned queries (`registeredMeasurements`,
  `agentHeartbeats`, `activeAlm`) and one subscription
  (`agentHeartbeatSubscribe`), run against whatever agent name you type in.

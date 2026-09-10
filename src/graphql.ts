import { createClient, type Client } from "graphql-ws";

// The Hub serves GraphQL — queries, mutations, and subscriptions alike — at
// its own root, same origin as the control plane UI, :8085. Subscriptions
// just upgrade that same URL to a WebSocket.
const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:8085/";
const GRAPHQL_WS_URL = GRAPHQL_URL.replace(/^http/, "ws");

export async function runQuery<T = unknown>(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body)}`);
  if (body.errors?.length) throw new Error(body.errors.map((e: { message: string }) => e.message).join("\n"));
  return body.data as T;
}

export function subscribe<T = unknown>(
  token: string,
  query: string,
  variables: Record<string, unknown> | undefined,
  onData: (data: T) => void,
  onError: (err: unknown) => void,
): () => void {
  const client: Client = createClient({
    url: GRAPHQL_WS_URL,
    connectionParams: () => ({ token }),
  });

  const unsubscribe = client.subscribe(
    { query, variables },
    {
      next: (result) => {
        if (result.errors?.length) {
          onError(new Error(result.errors.map((e) => e.message).join("\n")));
          return;
        }
        onData(result.data as T);
      },
      error: onError,
      complete: () => {},
    },
  );

  return () => {
    unsubscribe();
    client.dispose();
  };
}

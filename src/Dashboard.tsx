import { useEffect, useRef, useState } from "react";
import type { User } from "oidc-client-ts";
import { logout } from "./auth";
import { runQuery, subscribe } from "./graphql";

const QUERIES = {
  registeredMeasurements: `
    query RegisteredMeasurements($agents: [String!]) {
      registeredMeasurements(agents: $agents) {
        agent
        equipment
        name
        type
      }
    }
  `,
  agentHeartbeats: `
    query AgentHeartbeats($agents: [String!]!) {
      agentHeartbeats(agents: $agents) {
        agent
        status
        lastSeenAt
      }
    }
  `,
  activeAlm: `
    query ActiveAlarms {
      activeAlm {
        name
        area
        state
        severity
        value
        timestamp
      }
    }
  `,
} as const;

const HEARTBEAT_SUBSCRIPTION = `
  subscription AgentHeartbeat($agents: [String!]!) {
    agentHeartbeatSubscribe(agents: $agents) {
      agent
      status
      lastSeenAt
    }
  }
`;

type QueryKey = keyof typeof QUERIES;

export default function Dashboard({ user }: { user: User }) {
  const [agentName, setAgentName] = useState("quickstart-rest-agent");
  const [output, setOutput] = useState("Pick a query to run it.");
  const [pending, setPending] = useState<QueryKey | null>(null);

  const [subActive, setSubActive] = useState(false);
  const [subOutput, setSubOutput] = useState("Not subscribed.");
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => () => unsubscribeRef.current?.(), []);

  async function handleRun(key: QueryKey) {
    setPending(key);
    setOutput("Running…");
    try {
      const data = await runQuery(user.access_token, QUERIES[key], { agents: [agentName] });
      setOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPending(null);
    }
  }

  function toggleSubscription() {
    if (subActive) {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      setSubActive(false);
      setSubOutput("Not subscribed.");
      return;
    }

    setSubOutput("Connecting…");
    unsubscribeRef.current = subscribe(
      user.access_token,
      HEARTBEAT_SUBSCRIPTION,
      { agents: [agentName] },
      (data) => setSubOutput(JSON.stringify(data, null, 2)),
      (err) => setSubOutput(`Error: ${err instanceof Error ? err.message : String(err)}`),
    );
    setSubActive(true);
  }

  return (
    <div className="screen">
      <header className="topbar">
        <div>
          <div className="eyebrow">Demo HMI</div>
          <strong>
            {(user.profile.username as string | undefined) ??
              user.profile.preferred_username ??
              user.profile.name ??
              user.profile.sub}
          </strong>
        </div>
        <button type="button" className="secondary" onClick={() => logout()}>
          Sign out
        </button>
      </header>

      <div className="card">
        <label htmlFor="agent">Agent name</label>
        <input
          id="agent"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="quickstart-rest-agent"
        />

        <div className="button-row">
          <button type="button" disabled={pending !== null} onClick={() => handleRun("registeredMeasurements")}>
            {pending === "registeredMeasurements" ? "Running…" : "Registered measurements"}
          </button>
          <button type="button" disabled={pending !== null} onClick={() => handleRun("agentHeartbeats")}>
            {pending === "agentHeartbeats" ? "Running…" : "Agent heartbeat"}
          </button>
          <button type="button" disabled={pending !== null} onClick={() => handleRun("activeAlm")}>
            {pending === "activeAlm" ? "Running…" : "Active alarms"}
          </button>
        </div>

        <pre className="output">{output}</pre>
      </div>

      <div className="card">
        <div className="button-row" style={{ marginTop: 0 }}>
          <button type="button" onClick={toggleSubscription}>
            {subActive ? "Stop subscription" : "Start heartbeat subscription"}
          </button>
        </div>
        <pre className="output">{subOutput}</pre>
      </div>
    </div>
  );
}

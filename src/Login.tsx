import { login } from "./auth";

export default function Login() {
  const hasClientId = Boolean(import.meta.env.VITE_CLIENT_ID);

  return (
    <div className="screen">
      <div className="card">
        <div className="eyebrow">Demo HMI</div>
        <h1>Sign in to Khorde</h1>
        <p className="muted">
          This is a standalone app — it authenticates against your Hub with its own OIDC
          application, the authorization-code flow with PKCE, and talks to the same GraphQL API
          as the control plane.
        </p>
        {!hasClientId && (
          <p className="warning">
            <code>VITE_CLIENT_ID</code> is not set. Create an app under <strong>Apps → New app</strong>{" "}
            in the control plane and put its client ID in <code>.env.local</code> — see the README.
          </p>
        )}
        <button type="button" onClick={() => login()} disabled={!hasClientId}>
          Sign in with Khorde ID
        </button>
      </div>
    </div>
  );
}

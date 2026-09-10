import { useEffect, useState } from "react";
import type { User } from "oidc-client-ts";
import { completeLoginIfRedirected, getCurrentUser } from "./auth";
import Login from "./Login";
import Dashboard from "./Dashboard";
import "./App.css";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const fromCallback = await completeLoginIfRedirected();
        setUser(fromCallback ?? (await getCurrentUser()));
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) return null;
  return user ? <Dashboard user={user} /> : <Login />;
}

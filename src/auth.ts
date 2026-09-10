import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";

// Values come from your Hub's control plane: Apps → New app.
// AUTHORITY is the IdP the Hub itself uses (zitadel.url in the Hub's config).
// CLIENT_ID is the "Client ID" shown when the app is created — a public
// client (PKCE), no secret involved.
const AUTHORITY = import.meta.env.VITE_AUTHORITY ?? "http://auth.localhost:9310";
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID ?? "";
const REDIRECT_URI = `${window.location.origin}/`;

// These two scopes are what put the SCADA project (and its role grants) on
// the access token — without them the Hub's GraphQL API rejects the token.
const SCOPES = [
  "openid",
  "profile",
  "email",
  `urn:zitadel:iam:org:project:id:${import.meta.env.VITE_PROJECT_ID ?? "khorde_scada"}:aud`,
  "urn:zitadel:iam:org:projects:roles",
];

export const userManager = new UserManager({
  authority: AUTHORITY,
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  post_logout_redirect_uri: REDIRECT_URI,
  response_type: "code",
  scope: SCOPES.join(" "),
  userStore: new WebStorageStateStore({ store: window.localStorage }),
});

export async function completeLoginIfRedirected(): Promise<User | null> {
  const isCallback =
    window.location.search.includes("code=") || window.location.search.includes("state=");
  if (!isCallback) return null;

  const user = await userManager.signinRedirectCallback();
  window.history.replaceState({}, document.title, window.location.pathname);
  return user;
}

export async function getCurrentUser(): Promise<User | null> {
  const user = await userManager.getUser();
  return user && !user.expired ? user : null;
}

export function login(): Promise<void> {
  return userManager.signinRedirect();
}

export function logout(): Promise<void> {
  return userManager.signoutRedirect();
}

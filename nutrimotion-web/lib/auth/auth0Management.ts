/**
 * Auth0 Management API helpers (M2M client credentials).
 * Used for account deletion and admin invites.
 */

function auth0Domain(): string {
  const raw = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL || '';
  return raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function getAuth0Domain(): string {
  return auth0Domain();
}

export function getAuth0DbConnection(): string {
  return process.env.AUTH0_DB_CONNECTION || 'Username-Password-Authentication';
}

export function getAppBaseUrl(): string {
  const raw = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || 'https://www.nutrimotionjamaica.com';
  return raw.replace(/\/$/, '');
}

export function managementConfigured(): boolean {
  return Boolean(
    process.env.AUTH0_MANAGEMENT_CLIENT_ID &&
      process.env.AUTH0_MANAGEMENT_CLIENT_SECRET &&
      auth0Domain()
  );
}

export async function getManagementToken(): Promise<string | null> {
  const clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID;
  const clientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET;
  const domain = auth0Domain();
  if (!clientId || !clientSecret || !domain) return null;

  const tokenRes = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  });
  if (!tokenRes.ok) {
    console.warn('[auth0-mgmt] Token request failed:', tokenRes.status);
    return null;
  }
  const { access_token } = await tokenRes.json();
  return typeof access_token === 'string' ? access_token : null;
}

export async function deleteAuth0User(auth0Sub: string): Promise<boolean> {
  const domain = auth0Domain();
  const token = await getManagementToken();
  if (!token || !domain) return false;

  try {
    const delRes = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(auth0Sub)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!delRes.ok && delRes.status !== 404) {
      console.warn('[auth0-mgmt] User delete failed:', delRes.status);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[auth0-mgmt] User delete error:', (error as Error)?.message);
    return false;
  }
}

export async function findAuth0UsersByEmail(
  token: string,
  email: string
): Promise<Array<{ user_id: string; email?: string; name?: string }>> {
  const domain = auth0Domain();
  const res = await fetch(
    `https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    throw new Error(`Could not look up Auth0 users (${res.status}).`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createAuth0User(input: {
  token: string;
  email: string;
  name: string;
  password: string;
}): Promise<{ user_id: string }> {
  const domain = auth0Domain();
  const connection = getAuth0DbConnection();
  const res = await fetch(`https://${domain}/api/v2/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      name: input.name,
      password: input.password,
      connection,
      email_verified: false,
      verify_email: false,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.message === 'string'
        ? body.message
        : typeof body?.error === 'string'
          ? body.error
          : `Auth0 create user failed (${res.status})`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const created = await res.json();
  if (!created?.user_id) throw new Error('Auth0 did not return a user id.');
  return { user_id: created.user_id as string };
}

/** Asks Auth0 to email the person a link to set their password. */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const domain = auth0Domain();
  const clientId = process.env.AUTH0_CLIENT_ID;
  if (!domain || !clientId) {
    throw new Error('Auth0 is not configured to send invite emails.');
  }

  const res = await fetch(`https://${domain}/dbconnections/change_password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      email,
      connection: getAuth0DbConnection(),
    }),
  });

  // Auth0 returns plain text "We've just sent you an email to reset your password."
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Could not send invite email (${res.status}).`);
  }
}

export function randomTempPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const base = Buffer.from(bytes).toString('base64url');
  // Satisfy typical Auth0 password rules (upper, lower, digit, special).
  return `${base}Aa1!`;
}

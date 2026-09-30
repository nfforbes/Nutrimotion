/**
 * Auth Session Helpers - Auth0 v4
 * Supports both cookie-based sessions (web) and JWT Bearer tokens (mobile).
 */

import { UserRole, Permission } from '@/types/auth';
import { getPermissionsForRoles } from '@/lib/permissions/matrix';
import { User } from '@/lib/db/models';
import connectDB from '@/lib/db/connection';
import { auth0 } from './config';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { headers } from 'next/headers';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL || '';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || process.env.AUTH0_CLIENT_ID || '';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJWKS() {
  if (!jwks && AUTH0_DOMAIN) {
    const domain = AUTH0_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');
    jwks = createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`));
  }
  return jwks!;
}

export async function getSession() {
  const session = await auth0.getSession();
  return session;
}

function defaultClientSession(user: { sub: string; email: string; name: string; picture?: string }) {
  return {
    user,
    roles: [UserRole.CLIENT],
    permissions: getPermissionsForRoles([UserRole.CLIENT]),
    dbUserId: '',
  };
}

/** Access tokens often omit profile claims. The website gets them from the Auth0 session cookie. */
async function profileForBearerToken(token: string, payload: any, sub: string) {
  let email: string = payload.email || '';
  let name: string = payload.name || payload.nickname || '';
  let picture: string | undefined = payload.picture;

  if (!email || !name) {
    try {
      const domain = AUTH0_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const response = await fetch(`https://${domain}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const info = await response.json();
        email = email || info.email || '';
        name = name || info.name || info.nickname || email || 'User';
        picture = picture || info.picture;
      }
    } catch (error) {
      console.warn('[auth] Could not read Auth0 profile:', (error as Error)?.message);
    }
  }

  return { sub, email, name: name || email || 'User', picture };
}

/**
 * Verify a JWT Bearer token from a mobile client and return a session-like object.
 * A valid token is enough to sign in. Database failures fall back to the default
 * client session, matching cookie login on the website.
 */
export async function getSessionFromBearerToken(token: string) {
  let payload: any;
  try {
    const domain = AUTH0_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');
    ({ payload } = await jwtVerify(token, getJWKS(), {
      issuer: `https://${domain}/`,
      audience: AUTH0_AUDIENCE || undefined,
    }));
  } catch (error) {
    const err = error as { code?: string; name?: string; message?: string };
    console.warn('[auth] Bearer token rejected:', err.code || err.name, err.message);
    return null;
  }

  const sub = payload.sub as string | undefined;
  if (!sub) return null;

  const profile = await profileForBearerToken(token, payload, sub);

  try {
    const userWithRoles = await getUserWithRoles(sub);

    if (userWithRoles) {
      return {
        user: {
          sub,
          email: userWithRoles.email,
          name: userWithRoles.name,
          picture: profile.picture,
        },
        roles: userWithRoles.roles,
        permissions: userWithRoles.permissions,
        dbUserId: userWithRoles.id,
      };
    }

    await connectDB();

    if (!profile.email) {
      return defaultClientSession(profile);
    }

    const newUser = await User.create({
      auth0Sub: sub,
      email: profile.email,
      name: profile.name,
      roles: [UserRole.CLIENT],
    });

    return {
      user: profile,
      roles: [UserRole.CLIENT],
      permissions: getPermissionsForRoles([UserRole.CLIENT]),
      dbUserId: newUser._id.toString(),
    };
  } catch (error) {
    const err = error as { code?: string; message?: string };
    console.warn('[auth] Database unavailable for mobile session:', err.code, err.message);
    return defaultClientSession(profile);
  }
}

/**
 * Extract Bearer token from the current request's Authorization header.
 */
export async function getBearerToken(): Promise<string | null> {
  try {
    const hdrs = await headers();
    const auth = hdrs.get('authorization') || '';
    if (auth.startsWith('Bearer ')) {
      return auth.slice(7);
    }
    return null;
  } catch (error) {
    console.warn('[auth] Could not read Authorization header:', (error as Error)?.message);
    return null;
  }
}

export async function getUserWithRoles(auth0Sub: string) {
  try {
    await connectDB();
    const user = await User.findOne({ auth0Sub });
  
    if (!user) {
      return null;
    }
  
    return {
      id: user._id.toString(),
      auth0Sub: user.auth0Sub,
      email: user.email,
      name: user.name,
      roles: user.roles,
      permissions: getPermissionsForRoles(user.roles),
    };
  } catch {
    // If DB is down/unavailable, fall back to default role handling upstream.
    return null;
  }
}

export async function getSessionWithPermissions() {
  const session = await auth0.getSession();

  if (!session?.user) {
    // Fallback: try JWT Bearer token (mobile clients)
    const bearerToken = await getBearerToken();
    if (bearerToken) {
      return getSessionFromBearerToken(bearerToken);
    }
    return null;
  }

  const auth0User = session.user as any;
  const auth0Sub: string = auth0User.sub;

  // Try DB-backed roles/permissions first.
  try {
    const userWithRoles = await getUserWithRoles(auth0Sub);

    if (userWithRoles) {
      return {
        user: session.user,
        roles: userWithRoles.roles,
        permissions: userWithRoles.permissions,
        dbUserId: userWithRoles.id,
      };
    }

    // First time user - create with default role.
    await connectDB();

    const email: string | undefined = auth0User.email;
    const name: string =
      auth0User.name ||
      auth0User.nickname ||
      auth0User.given_name ||
      email ||
      'User';

    if (!email) {
      // Email is required by our User model; without it we can't create a DB user.
      // Still return a session with default client permissions so navigation renders.
      return {
        user: session.user,
        roles: [UserRole.CLIENT],
        permissions: getPermissionsForRoles([UserRole.CLIENT]),
        dbUserId: '',
      };
    }

    const newUser = await User.create({
      auth0Sub,
      email,
      name,
      roles: [UserRole.CLIENT],
    });

    return {
      user: session.user,
      roles: [UserRole.CLIENT],
      permissions: getPermissionsForRoles([UserRole.CLIENT]),
      dbUserId: newUser._id.toString(),
    };
  } catch {
    // DB failure should not make the app "lose navigation" after login.
    // Fall back to default client permissions.
    return {
      user: session.user,
      roles: [UserRole.CLIENT],
      permissions: getPermissionsForRoles([UserRole.CLIENT]),
      dbUserId: '',
    };
  }
}

export function hasPermission(userPermissions: Permission[], required: Permission): boolean {
  return userPermissions.includes(required);
}

export function hasAllPermissions(
  userPermissions: Permission[],
  required: Permission[]
): boolean {
  return required.every((permission) => userPermissions.includes(permission));
}

export function hasAnyPermission(
  userPermissions: Permission[],
  required: Permission[]
): boolean {
  return required.some((permission) => userPermissions.includes(permission));
}

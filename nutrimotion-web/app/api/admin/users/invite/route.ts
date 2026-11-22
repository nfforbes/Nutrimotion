/**
 * Invite a user by email.
 * Creates (or reuses) their Auth0 login, stores them in Mongo with the chosen roles,
 * and asks Auth0 to email them a link to set their password.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission, UserRole } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { User } from '@/lib/db/models';
import {
  createAuth0User,
  deleteAuth0User,
  findAuth0UsersByEmail,
  getManagementToken,
  managementConfigured,
  randomTempPassword,
  sendPasswordResetEmail,
} from '@/lib/auth/auth0Management';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return EMAIL_RE.test(email) ? email : null;
}

function normalizeName(value: unknown, email: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  const local = email.split('@')[0] || 'User';
  return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseRoles(value: unknown): UserRole[] | null {
  if (value === undefined || value === null) return [UserRole.CLIENT];
  if (!Array.isArray(value) || value.length === 0) return null;
  const valid = Object.values(UserRole);
  const roles = value.map((r) => String(r));
  if (roles.some((r) => !valid.includes(r as UserRole))) return null;
  return [...new Set(roles)] as UserRole[];
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_USERS]);
  if (authResult instanceof NextResponse) return authResult;

  if (!managementConfigured()) {
    return NextResponse.json(
      {
        error:
          'Invites are not set up yet. Add AUTH0_MANAGEMENT_CLIENT_ID and AUTH0_MANAGEMENT_CLIENT_SECRET to the website settings.',
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    if (!email) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const roles = parseRoles(body?.roles);
    if (!roles) {
      return NextResponse.json(
        { error: 'Choose at least one valid role (client, driver, or administrator).' },
        { status: 400 }
      );
    }

    const name = normalizeName(body?.name, email);

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: 'That email is already registered. Edit their roles from the user list instead.' },
        { status: 409 }
      );
    }

    const token = await getManagementToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Could not connect to Auth0. Check the Management API credentials.' },
        { status: 503 }
      );
    }

    let auth0Sub: string;
    let createdAuth0 = false;
    const existingAuth0 = await findAuth0UsersByEmail(token, email);

    if (existingAuth0.length > 0) {
      auth0Sub = existingAuth0[0].user_id;
    } else {
      try {
        const created = await createAuth0User({
          token,
          email,
          name,
          password: randomTempPassword(),
        });
        auth0Sub = created.user_id;
        createdAuth0 = true;
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 409) {
          const again = await findAuth0UsersByEmail(token, email);
          if (again[0]?.user_id) {
            auth0Sub = again[0].user_id;
          } else {
            return NextResponse.json(
              { error: 'That email already has an Auth0 login, but it could not be linked.' },
              { status: 409 }
            );
          }
        } else {
          return NextResponse.json(
            { error: (error as Error).message || 'Could not create the Auth0 login.' },
            { status: 502 }
          );
        }
      }
    }

    const bySub = await User.findOne({ auth0Sub });
    if (bySub) {
      return NextResponse.json(
        { error: 'That login is already linked to another Nutrimotion account.' },
        { status: 409 }
      );
    }

    let user;
    try {
      user = await User.create({
        auth0Sub,
        email,
        name,
        roles,
      });
    } catch (error) {
      if (createdAuth0) {
        await deleteAuth0User(auth0Sub);
      }
      const code = (error as { code?: number }).code;
      if (code === 11000) {
        return NextResponse.json(
          { error: 'That email is already registered.' },
          { status: 409 }
        );
      }
      throw error;
    }

    try {
      await sendPasswordResetEmail(email);
    } catch (error) {
      // User exists; they can use Forgot password. Still report partial success.
      console.warn('[invite] Password email failed:', (error as Error)?.message);
      return NextResponse.json(
        {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          roles: user.roles,
          createdAt: user.createdAt,
          emailSent: false,
          warning:
            'The account was created, but Auth0 could not send the invite email. Ask them to use Forgot password on the sign-in page.',
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        roles: user.roles,
        createdAt: user.createdAt,
        emailSent: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[invite] Failed:', error);
    return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 });
  }
}

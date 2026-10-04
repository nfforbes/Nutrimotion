/**
 * Admin contact settings — WhatsApp number customers message.
 * GET → { whatsapp }   PATCH { whatsapp } → { whatsapp }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import { getContactWhatsApp, normalizeWhatsApp, setContactWhatsApp } from '@/lib/contact/whatsapp';

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_USERS]);
  if (authResult instanceof NextResponse) return authResult;
  return NextResponse.json({ whatsapp: await getContactWhatsApp() });
}

export async function PATCH(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_USERS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const digits = normalizeWhatsApp(body?.whatsapp);
    if (!digits) {
      return NextResponse.json(
        { error: 'Enter the full number with country code (10–15 digits), e.g. 18764282339.' },
        { status: 400 }
      );
    }
    await setContactWhatsApp(digits);
    return NextResponse.json({ whatsapp: digits });
  } catch {
    return NextResponse.json({ error: 'Failed to save the WhatsApp number' }, { status: 500 });
  }
}

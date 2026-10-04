/**
 * Public contact settings — the WhatsApp number customers message.
 */

import { NextResponse } from 'next/server';
import { getContactWhatsApp } from '@/lib/contact/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET() {
  const whatsapp = await getContactWhatsApp();
  return NextResponse.json({ whatsapp });
}

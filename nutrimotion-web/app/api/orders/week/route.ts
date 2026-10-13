/**
 * The week clients can currently order for.
 */

import { NextResponse } from 'next/server';
import { clientOrderingWeek } from '@/lib/orders/orderWeek';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(clientOrderingWeek());
}

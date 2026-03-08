/**
 * Discount Code Validation API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import { DiscountCode } from '@/lib/db/models';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    const body = await request.json();
    
    const { code, subtotal } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }
    
    const discountCode = await DiscountCode.findOne({
      code: code.toUpperCase(),
      active: true,
    });
    
    if (!discountCode) {
      return NextResponse.json(
        { error: 'Invalid discount code' },
        { status: 400 }
      );
    }
    
    if (!(discountCode as any).isValid()) {
      return NextResponse.json(
        { error: 'Discount code has expired or reached usage limit' },
        { status: 400 }
      );
    }
    
    const discountAmount = (discountCode as any).calculateDiscount(subtotal || 0);
    
    return NextResponse.json({
      valid: true,
      code: discountCode.code,
      discount: discountAmount,
      description: discountCode.description,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    );
  }
}

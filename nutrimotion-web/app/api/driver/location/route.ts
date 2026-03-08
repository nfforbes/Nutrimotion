/**
 * Driver Location API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { DeliveryTracking, User } from '@/lib/db/models';

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.UPDATE_LOCATION]);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    const { session } = authResult;
    const body = await request.json();
    
    const { lat, lng, assignmentId, speed, heading } = body;
    
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }
    
    const driver = await User.findOne({ auth0Sub: session.user.sub });
    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }
    
    const tracking = await DeliveryTracking.create({
      assignmentId,
      driverId: driver._id,
      coordinates: { lat, lng },
      timestamp: new Date(),
      speed,
      heading,
    });
    
    return NextResponse.json({
      driverId: driver._id.toString(),
      coordinates: { lat, lng },
      timestamp: tracking.timestamp,
      activeDeliveryId: assignmentId,
    });
  } catch (error) {
    console.error('Update location error:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

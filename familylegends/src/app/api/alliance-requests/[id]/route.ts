import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { timingSafeEqual } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

function isAuthenticated(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get('__session') || 
                        request.cookies.get('firebase-session') ||
                        request.cookies.get('next-auth.session-token') ||
                        request.cookies.get('__Secure-next-auth.session-token');
  
  if (sessionCookie) return true;

  const authHeader = request.headers.get('authorization');
  const apiSecret = process.env.API_SECRET;
  if (authHeader && apiSecret) {
    const providedSecret = authHeader.replace(/^Bearer\s+/i, '');
    try {
      const providedBuf = Buffer.from(String(providedSecret));
      const secretBuf = Buffer.from(String(apiSecret));
      return providedBuf.length === secretBuf.length && timingSafeEqual(providedBuf, secretBuf);
    } catch {
      return false;
    }
  }

  return false;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  // التحقق من المصادقة وصلاحيات المشرف
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token && !isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (token) {
    const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
    if (ADMIN_IDS.length === 0 || !ADMIN_IDS.includes(token.sub as string)) {
      return NextResponse.json({ error: 'Forbidden — Admin access required' }, { status: 403 });
    }
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const identifier = token?.sub || ip;
  const { allowed, resetInMs } = await checkRateLimit(`alliance-review:${identifier}`, { maxRequests: 30, windowMs: 60000 });
  if (!allowed) return rateLimitResponse(resetInMs);

  try {
    const { id } = await context.params;
    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    // Fetch the alliance request
    const requestRef = db.collection('alliance-requests').doc(id);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Alliance request not found' },
        { status: 404 }
      );
    }

    const requestData = requestSnap.data()!;

    if (requestData.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: `Request is already ${requestData.status}`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, rejectedReason, adminName } = body;

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: "Action must be 'approve' or 'reject'",
        },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Copy alliance request data to partners collection
      const partnersRef = db.collection('partners');
      const partnerDoc: Record<string, any> = {
        name: requestData.serverName,
        logoUrl: requestData.serverLogoUrl || '',
        inviteUrl: requestData.inviteUrl,
        description: requestData.description,
        timestamp: new Date(),
      };

      // Map optional fields
      if (requestData.ownerName) partnerDoc.ownerName = requestData.ownerName;
      if (requestData.streamUrl) partnerDoc.streamUrl = requestData.streamUrl;

      // Set owner URL from owner contact if available
      if (requestData.ownerContact) {
        const contact = requestData.ownerContact;
        if (
          contact.startsWith('https://discord.com/users/') ||
          contact.startsWith('https://twitter.com/') ||
          contact.startsWith('https://x.com/')
        ) {
          partnerDoc.ownerUrl = contact;
        }
      }

      await partnersRef.add(partnerDoc);

      // Update the alliance request status
      await requestRef.update({
        status: 'approved',
        reviewedBy: adminName || 'Unknown Admin',
        reviewedAt: new Date(),
      });

      return NextResponse.json({ success: true, action: 'approve' });
    }

    // action === 'reject'
    const updateData: Record<string, any> = {
      status: 'rejected',
      reviewedBy: adminName || 'Unknown Admin',
      reviewedAt: new Date(),
    };

    if (rejectedReason) {
      updateData.rejectedReason = rejectedReason;
    }

    await requestRef.update(updateData);

    return NextResponse.json({ success: true, action: 'reject' });
  } catch (error) {
    console.error('Error updating alliance request:', error);
    return NextResponse.json(
      { error: 'Failed to update alliance request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  // التحقق من المصادقة وصلاحيات المشرف
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token && !isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (token) {
    const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
    if (ADMIN_IDS.length === 0 || !ADMIN_IDS.includes(token.sub as string)) {
      return NextResponse.json({ error: 'Forbidden — Admin access required' }, { status: 403 });
    }
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const identifier = token?.sub || ip;
  const { allowed, resetInMs } = await checkRateLimit(`alliance-delete:${identifier}`, { maxRequests: 20, windowMs: 60000 });
  if (!allowed) return rateLimitResponse(resetInMs);

  try {
    const { id } = await context.params;
    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    // Fetch the alliance request to verify it exists and is pending
    const requestRef = db.collection('alliance-requests').doc(id);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Alliance request not found' },
        { status: 404 }
      );
    }

    const requestData = requestSnap.data()!;

    if (requestData.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Only pending requests can be deleted',
        },
        { status: 400 }
      );
    }

    await requestRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alliance request:', error);
    return NextResponse.json(
      { error: 'Failed to delete alliance request' },
      { status: 500 }
    );
  }
}

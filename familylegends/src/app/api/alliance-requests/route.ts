import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { checkApiAuth } from '@/lib/api-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { withTiming } from '@/lib/api-timing';

async function handlePOST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const { allowed, resetInMs } = await checkRateLimit(`alliance:${ip}`, { maxRequests: 5, windowMs: 3600000 });
  if (!allowed) return rateLimitResponse(resetInMs);

  // Allow public access for submitting requests
  try {
    const body = await request.json();

    const {
      serverName,
      serverLogoUrl,
      inviteUrl,
      description,
      memberCount,
      ownerName,
      ownerDiscordId,
      ownerContact,
      streamUrl,
    } = body;

    // Validation
    const errors: string[] = [];

    if (!serverName || typeof serverName !== 'string' || !serverName.trim()) {
      errors.push('اسم السيرفر مطلوب');
    }

    if (!serverLogoUrl || typeof serverLogoUrl !== 'string' || !serverLogoUrl.trim()) {
      errors.push('رابط الشعار مطلوب');
    }

    if (!inviteUrl || typeof inviteUrl !== 'string' || !inviteUrl.trim()) {
      errors.push('رابط الدعوة مطلوب');
    } else {
      const trimmed = inviteUrl.trim();
      if (
        !trimmed.startsWith('https://discord.gg/') &&
        !trimmed.startsWith('https://discord.com/invite/')
      ) {
        errors.push('يجب أن يبدأ رابط الدعوة بـ https://discord.gg/');
      }
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      errors.push('وصف السيرفر مطلوب');
    }

    if (!memberCount || typeof memberCount !== 'number' || memberCount <= 0) {
      errors.push('عدد الأعضاء يجب أن يكون أكبر من صفر');
    }

    if (!ownerName || typeof ownerName !== 'string' || !ownerName.trim()) {
      errors.push('اسم المالك مطلوب');
    }

    if (!ownerDiscordId || typeof ownerDiscordId !== 'string' || !ownerDiscordId.trim()) {
      errors.push('معرف الديسكورد مطلوب');
    }

    if (!ownerContact || typeof ownerContact !== 'string' || !ownerContact.trim()) {
      errors.push('طريقة التواصل مطلوبة');
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    // Save to Firestore using Admin SDK
    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }
    const requestData: Record<string, unknown> = {
      serverName: serverName.trim(),
      serverLogoUrl: serverLogoUrl.trim(),
      inviteUrl: inviteUrl.trim(),
      description: description.trim(),
      memberCount,
      ownerName: ownerName.trim(),
      ownerDiscordId: ownerDiscordId.trim(),
      ownerContact: ownerContact.trim(),
      status: 'pending',
      timestamp: new Date(),
    };

    if (streamUrl && typeof streamUrl === 'string' && streamUrl.trim()) {
      requestData.streamUrl = streamUrl.trim();
    }

    const docRef = db.collection('alliance-requests').doc();
    await docRef.set(requestData);

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        message: 'تم إرسال طلب التحالف بنجاح',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Alliance request error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}

async function handleGET(request: NextRequest) {
  if (!(await checkApiAuth(request))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  try {
    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('alliance-requests');
    if (statusFilter) {
      q = q.where('status', '==', statusFilter);
    }
    
    const snapshot = await q.orderBy('timestamp', 'desc').get();
    const requests = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Alliance requests fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alliance requests' },
      { status: 500 }
    );
  }
}

export const POST = withTiming(handlePOST, 'alliance-requests/POST');
export const GET = withTiming(handleGET, 'alliance-requests/GET');

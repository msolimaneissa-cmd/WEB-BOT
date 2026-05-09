import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.startsWith('"') 
  ? JSON.parse(process.env.FIREBASE_PRIVATE_KEY) 
  : process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

export function getFirebaseAdmin() {
  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
      console.warn('[firebase-admin] Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY — Firebase Admin unavailable');
    }
    return null;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return admin;
}

export const adminDb = () => {
  const adminApp = getFirebaseAdmin();
  return adminApp ? adminApp.firestore() : null;
};
export const adminAuth = () => {
  const adminApp = getFirebaseAdmin();
  return adminApp ? adminApp.auth() : null;
};

/**
 * دمج الـ Timestamp الخاص بـ Firebase ليصبح قابلاً للتسلسل (JSON Serializable).
 */
export function serializeFirestoreData<T>(data: any): T {
  if (data === null || data === undefined) return data;
  
  // إذا كان التاريخ نفسه أو Timestamp
  if (typeof data.toDate === 'function') {
    return data.toDate().toISOString() as any;
  }
  
  if (data instanceof Date) {
    return data.toISOString() as any;
  }

  // إذا كانت مصفوفة
  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item)) as any;
  }

  // إذا كان كائناً
  if (typeof data === 'object' && data.constructor.name === 'Object') {
    const serialized: any = {};
    Object.keys(data).forEach(key => {
      serialized[key] = serializeFirestoreData(data[key]);
    });
    return serialized as T;
  }
  
  // للتعامل مع كائنات الـ Timestamp التي تم عمل spread لها مسبقاً
  if (typeof data === 'object' && data._seconds !== undefined && data._nanoseconds !== undefined) {
    return new Date(data._seconds * 1000).toISOString() as any;
  }

  // إذا كان كائناً من فئة أخرى (مثل Timestamp) ولكنه ليس Object سادة
  if (typeof data === 'object') {
    const serialized: any = {};
    // نحاول جلب الخصائص العامة فقط
    Object.keys(data).forEach(key => {
      serialized[key] = serializeFirestoreData(data[key]);
    });
    // إذا لم تكن هناك خصائص (كائن فارغ أو غير قابل للتكرار)، نرجعه كما هو أو كـ string
    if (Object.keys(serialized).length === 0) {
      return JSON.parse(JSON.stringify(data));
    }
    return serialized as T;
  }

  return data;
}

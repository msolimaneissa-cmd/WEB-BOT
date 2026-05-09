import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

function getDb() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getFirestore(app);
}

export async function GET() {
  try {
    const db = getDb();
    const requestsRef = collection(db, 'alliance-requests');
    const q = query(requestsRef, where('status', '==', 'pending'));

    const snapshot = await getDocs(q);
    const count = snapshot.size;

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching pending alliance request count:', error);
    return NextResponse.json(
      { count: 0, error: 'Failed to fetch count' },
      { status: 500 }
    );
  }
}

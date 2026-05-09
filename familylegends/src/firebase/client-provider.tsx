'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { FirebaseAuthBridge } from '@/components/firebase-auth-bridge';
import { initializeFirebase } from '@/firebase';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

function createFirebaseServices(): FirebaseServices {
  let app;
  try {
    app = initializeApp();
  } catch {
    app = initializeApp(firebaseConfig);
  }
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setServices(createFirebaseServices());
    }
  }, []);

  // During SSR or before Firebase initializes, provide a minimal provider
  // so hooks don't throw. Components will get null firestore/auth and show loading states.
  const app = services?.firebaseApp || undefined;
  const auth = services?.auth || null;
  const firestore = services?.firestore || null;

  if (services) {
    return (
      <FirebaseProvider
        firebaseApp={services.firebaseApp}
        auth={services.auth}
        firestore={services.firestore}
      >
        <FirebaseAuthBridge />
        {children}
      </FirebaseProvider>
    );
  }

  // Before client init, wrap in provider with null values
  // This prevents hooks from throwing during SSR/prerendering
  return (
    <FirebaseProvider
      firebaseApp={null as unknown as FirebaseApp}
      auth={null as unknown as Auth}
      firestore={null as unknown as Firestore}
    >
      <FirebaseAuthBridge />
      {children}
    </FirebaseProvider>
  );
}

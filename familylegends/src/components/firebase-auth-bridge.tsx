'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider';
import { getFirebaseCustomToken } from '@/actions/get-firebase-token';

/**
 * FirebaseAuthBridge: Bridges the gap between NextAuth
 * and Firebase Auth. When an admin logs in, this
 * component obtains a Firebase Custom Token with the 'admin' claim,
 * allowing them to bypass Firestore Security Rules.
 */
export function FirebaseAuthBridge() {
  const { data: session, status } = useSession();
  const { auth, user: firebaseUser } = useFirebase();
  const [isBridging, setIsBridging] = useState(false);

  useEffect(() => {
    // Only proceed if Firebase Auth is initialized and we're not already bridging
    if (!auth || status === 'loading' || isBridging) return;

    const bridgeAuth = async () => {
      // 1. User is logged in to NextAuth
      if (status === 'authenticated' && session?.user) {
        
        // Check if we already have a Firebase user with the correct UID
        // We no longer prefix with 'discord:' since we use credentials
        const expectedUid = (session.user as any).id;
        
        if (firebaseUser?.uid === expectedUid) {
          // Already bridged and authenticated with the correct user
          return;
        }

        try {
          setIsBridging(true);
          console.log('[AuthBridge] Bridging NextAuth to Firebase...');
          
          // Request a custom token from the server
          const { customToken } = await getFirebaseCustomToken();
          
          // Sign in to Firebase Auth with the custom token
          await signInWithCustomToken(auth, customToken);
          console.log('[AuthBridge] Successfully authenticated with Firebase.');
        } catch (error) {
          console.error('[AuthBridge] Failed to bridge authentication:', error);
        } finally {
          setIsBridging(false);
        }
      } 
      // 2. User is NOT logged in to NextAuth but IS logged in to Firebase
      else if (status === 'unauthenticated' && firebaseUser) {
        try {
          setIsBridging(true);
          console.log('[AuthBridge] NextAuth session expired. Signing out of Firebase...');
          await firebaseSignOut(auth);
        } catch (error) {
          console.error('[AuthBridge] Error during Firebase sign out:', error);
        } finally {
          setIsBridging(false);
        }
      }
    };

    bridgeAuth();
  }, [session, status, auth, firebaseUser, isBridging]);

  return null; // This component doesn't render anything
}

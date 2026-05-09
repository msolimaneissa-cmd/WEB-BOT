'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";

/**
 * Generates a Firebase Custom Token for an authenticated admin user.
 * This token is used on the client side to sign in to Firebase Auth
 * with the 'admin' custom claim, satisfying Firestore security rules.
 */
export async function getFirebaseCustomToken() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: No session found");
  }

  try {
    const auth = adminAuth();
    if (!auth) {
      throw new Error("Firebase Admin is not configured. Custom tokens cannot be generated.");
    }
    // Use the id directly as the Firebase UID
    const uid = session.user.id;
    
    // Create custom token with admin claim
    const customToken = await auth.createCustomToken(uid, {
      admin: true,
      name: session.user.name || "Admin User",
      email: session.user.email
    });

    return { customToken };
  } catch (error) {
    console.error("Error generating Firebase Custom Token:", error);
    throw new Error("Failed to generate authentication token");
  }
}

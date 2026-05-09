'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch((error) => {
    console.error("Anonymous sign-in error", error);
    toast({
      variant: "destructive",
      title: "خطأ في تسجيل الدخول",
      description: "لا يمكن تسجيل الدخول كمجهول. يرجى المحاولة مرة أخرى.",
    });
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password).catch((error) => {
    console.error("Sign-up error", error);
    toast({
      variant: "destructive",
      title: "خطأ في إنشاء الحساب",
      description: "لم نتمكن من إنشاء حسابك. يرجى المحاولة مرة أخرى.",
    });
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  setPersistence(authInstance, browserSessionPersistence)
    .then(() => {
      // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
      signInWithEmailAndPassword(authInstance, email, password)
      .catch((error) => {
        console.error("Sign-in error", error);
        // Handle specific errors for better UX
        let description = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          description = "البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق والمحاولة مرة أخرى.";
        }
        toast({
          variant: "destructive",
          title: "فشل تسجيل الدخول",
          description: description,
        });
      });
    })
    .catch((error) => {
      console.error("Set persistence error", error);
      toast({
        variant: "destructive",
        title: "فشل إعداد الجلسة",
        description: "حدث خطأ أثناء إعداد جلسة تسجيل الدخول.",
      });
    });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

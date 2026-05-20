'use client';

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Shield,
  ArrowRight,
  Loader2,
  Lock,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  Home,
  Sparkles,
  Fingerprint,
  Mail,
  Eye,
  EyeOff
} from "lucide-react";

const COMMUNITY_NAME = "𝐹𝒜𝑀𝐼𝐿Y 𝐿𝐸𝒢𝐸𝒩𝒟𝒮";
const LOGO_URL = "/images/logo.png";
const DISCORD_COLOR = "#5865F2";

// Error messages in Arabic
const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "حدث خطأ أثناء بدء عملية تسجيل الدخول.",
  OAuthCallback: "حدث خطأ أثناء معالجة رد Discord.",
  OAuthCreateAccount: "لم نتمكن من إنشاء حساب جديد.",
  Callback: "حدث خطأ أثناء معالجة تسجيل الدخول.",
  AccessDenied: "تم رفض الوصول. قد لا يكون لديك صلاحية المشرف.",
  Configuration: "خطأ في إعدادات الخادم. يرجى التواصل مع الإدارة.",
  Default: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
};

// Floating particle component
function FloatingParticle({ delay, duration, size, x, y }: {
  delay: number;
  duration: number;
  size: number;
  x: number;
  y: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-primary/20"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.6, 0],
        scale: [0, 1, 0.5],
        y: [-20, -80, -140],
        x: [0, 20, -10],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 2,
        ease: "easeOut",
      }}
    />
  );
}

// Security badge component
function SecurityBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20"
    >
      <Icon className="w-4 h-4 text-green-500" />
      <span className="text-xs text-green-400 font-medium">{label}</span>
    </motion.div>
  );
}

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Get error from URL params
  const urlError = searchParams.get("error");

  useEffect(() => {
    if (urlError) {
      setError(ERROR_MESSAGES[urlError] || ERROR_MESSAGES.Default);
    }
  }, [urlError]);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/admin");
    }
  }, [status, router]);

  const handleDiscordSignIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("discord", { callbackUrl: "/admin" });
    } catch (err) {
      console.error("Sign in error:", err);
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: "حدث خطأ غير متوقع.",
      });
      setError(ERROR_MESSAGES.Default);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleCredentialsSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/admin",
      });

      if (result?.error) {
        setError(result.error);
        toast({
          variant: "destructive",
          title: "فشل تسجيل الدخول",
          description: result.error,
        });
      } else if (result?.ok) {
        router.push("/admin");
      }
    } catch (err) {
      console.error("Credentials sign in error:", err);
      setError(ERROR_MESSAGES.Default);
    } finally {
      setIsLoading(false);
    }
  }, [email, password, router, toast]);

  const handleRetry = useCallback(() => {
    setError(null);
    handleDiscordSignIn();
  }, [handleDiscordSignIn]);

  // Generate particles once
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 3,
      size: 4 + Math.random() * 8,
      x: Math.random() * 100,
      y: Math.random() * 100,
    })), []
  );

  // Loading state
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary"
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Image
                src={LOGO_URL}
                alt="Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </motion.div>
          </div>
          <p className="text-muted-foreground font-medium">جاري التحقق من هويتك...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden" dir="rtl">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#5865F2]/5 rounded-full blur-[180px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-primary/3 via-transparent to-transparent" />

        <motion.div
          className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${DISCORD_COLOR}15 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </motion.div>

      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((particle) => (
            <FloatingParticle key={particle.id} {...particle} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-xl text-right relative z-10"
        >
          <motion.div
            className="mb-10 inline-block"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 1, delay: 0.2 }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{
                  boxShadow: [
                    "0 0 30px rgba(255, 215, 0, 0.3)",
                    "0 0 60px rgba(255, 215, 0, 0.5)",
                    "0 0 30px rgba(255, 215, 0, 0.3)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <Image
                src={LOGO_URL}
                alt="Family Legends Logo"
                width={140}
                height={140}
                className="relative rounded-2xl"
                priority
              />
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6 text-primary" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            className="font-headline text-4xl xl:text-5xl font-black text-foreground mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            مرحباً بك في
            <br />
            <motion.span
              className="text-transparent bg-clip-text bg-gradient-to-l from-[#FFD700] via-[#FDB931] to-[#FFD700]"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: "200% 200%" }}
            >
              مجتمع العائلة
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            مجتمع ألعاب عربي متكامل. انضم إلى آلاف اللاعبين وشاركهم المتعة والتحديات في بيئة آمنة وممتعة.
          </motion.p>

          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15 },
              },
            }}
          >
            {[
              { icon: ShieldCheck, text: "حماية متقدمة من الاختراق والتخريب" },
              { icon: Lock, text: "تشفير كامل للبيانات والاتصالات" },
              { icon: KeyRound, text: "مصادقة آمنة عبر Discord OAuth 2.0" },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, x: -30 },
                  visible: { opacity: 1, x: 0 },
                }}
                className="flex items-center gap-4 text-muted-foreground group"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-base font-medium">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md mb-20"
        >
          <motion.div
            className="lg:hidden text-center mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-block relative">
              <motion.div
                className="absolute inset-0 rounded-xl blur-lg bg-primary/30"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <Image
                src={LOGO_URL}
                alt="Logo"
                width={90}
                height={90}
                className="relative rounded-xl"
                priority
              />
            </div>
          </motion.div>

          <motion.div
            className="glass rounded-3xl p-8 sm:p-10 space-y-8 shadow-2xl shadow-primary/5"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-center space-y-4">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10"
              >
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary tracking-wide">منطقة آمنة</span>
              </motion.div>

              <motion.h2
                className="font-headline text-3xl sm:text-4xl font-black text-gradient-gold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {COMMUNITY_NAME}
              </motion.h2>

              <motion.p
                className="text-muted-foreground text-base"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                لوحة التحكم الرئيسية
              </motion.p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-destructive font-medium">خطأ في تسجيل الدخول</p>
                        <p className="text-xs text-muted-foreground mt-1">{error}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <motion.button
                        onClick={handleRetry}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive text-sm font-medium transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        إعادة المحاولة
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="bg-primary/5 border border-primary/15 rounded-xl p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground font-semibold">وصول المشرفين فقط</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    يجب أن تكون مشرفاً في الخادم لتتمكن من الوصول. جميع المحاولات يتم تسجيلها.
                  </p>
                </div>
              </div>
            </motion.div>

            <form onSubmit={handleCredentialsSignIn} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground mr-1">البريد الإلكتروني</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@familylegends.com"
                    className="w-full bg-background/50 border border-primary/10 rounded-xl py-4 pr-12 pl-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground mr-1">كلمة المرور</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-background/50 border border-primary/10 rounded-xl py-4 pr-12 pl-12 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={!isLoading ? { scale: 1.01, boxShadow: "0 0 20px rgba(212, 175, 55, 0.2)" } : {}}
                whileTap={!isLoading ? { scale: 0.99 } : {}}
                className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold py-4 rounded-xl shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    <span>تسجيل الدخول للنظام</span>
                  </>
                )}
              </motion.button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center px-2">
                <div className="w-full border-t border-primary/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium">أو عبر</span>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleDiscordSignIn}
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.02, backgroundColor: `${DISCORD_COLOR}dd` } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              className="w-full rounded-xl text-white font-medium py-3.5 px-6 transition-all disabled:opacity-50 flex items-center justify-center gap-3 border border-white/5"
              style={{
                backgroundColor: `${DISCORD_COLOR}bb`,
              }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg viewBox="0 0 127.14 96.36" fill="currentColor" className="w-5 h-5">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.06,72.06,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.39,80.21a105.73,105.73,0,0,0,32.17,16.15,77.7,77.7,0,0,0,6.89-11.11,68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.72-27.22-4.55-50.87-19.04-72.13ZM42.45,65.69c-6.22,0-11.38-5.71-11.38-12.73S36,40.23,42.45,40.23s11.44,5.71,11.44,12.73S49,65.69,42.45,65.69Zm42.24,0c-6.22,0-11.38-5.71-11.38-12.73s5.12-12.73,11.38-12.73c6.29,0,11.44,5.71,11.44,12.73S91,65.69,84.69,65.69Z" />
                </svg>
              )}
              <span>{isLoading ? "جاري التوجيه إلى ديسكورد..." : "تسجيل الدخول بواسطة Discord"}</span>
            </motion.button>

            <motion.div
              className="grid grid-cols-2 gap-2 pt-1 pb-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1, delayChildren: 0.6 },
                },
              }}
            >
              {[
                { icon: Lock, label: "تشفير HTTPS" },
                { icon: KeyRound, label: "OAuth 2.0" },
                { icon: Shield, label: "بدون كلمات مرور" },
                { icon: ShieldCheck, label: "حماية CSRF" },
              ].map((badge, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <SecurityBadge icon={badge.icon} label={badge.label} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Back to home link */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium group"
            >
              <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>العودة إلى الصفحة الرئيسية</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rotate-180" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

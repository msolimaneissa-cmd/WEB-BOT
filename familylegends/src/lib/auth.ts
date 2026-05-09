import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";

// Type augmentation for NextAuth
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin?: boolean;
    }
    isAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    isAdmin?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Firebase",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email", placeholder: "admin@familylegends.com" },
        password: { label: "كلمة المرور", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            returnSecureToken: true,
          }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          // Improve error messages based on Firebase error codes
          const errorCode = data.error?.message;
          console.error("Firebase Auth Error:", errorCode);
          
          if (errorCode === "EMAIL_NOT_FOUND" || errorCode === "INVALID_PASSWORD" || errorCode === "INVALID_LOGIN_CREDENTIALS") {
            throw new Error("بيانات تسجيل الدخول غير صحيحة - يُرجى التأكد من البريد وكلمة المرور");
          } else if (errorCode === "USER_DISABLED") {
            throw new Error("هذا الحساب معطل حالياً.");
          } else if (errorCode === "TOO_MANY_ATTEMPTS_TRY_LATER") {
            throw new Error("محاولات كثيرة خاطئة. يرجى المحاولة لاحقاً.");
          }
          
          throw new Error(data.error?.message || "حدث خطأ أثناء تسجيل الدخول");
        }

        return {
          id: data.localId,
          email: data.email,
          name: data.email.split('@')[0], 
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }

      // Perform admin check on login or token refresh
      if (token.sub) {
        const adminIds = (process.env.ADMIN_DISCORD_IDS || "").split(",").filter(Boolean);
        const accessRoleId = process.env.DASHBOARD_ACCESS_ROLE_ID;

        if (adminIds.includes(token.sub)) {
          token.isAdmin = true;
        } else if (accessRoleId) {
          try {
            const guildId = process.env.GUILD_ID || process.env.NEXT_PUBLIC_GUILD_ID;
            const BOT_URL = process.env.BOT_INTERNAL_URL || "http://localhost:8080";
            const BOT_SECRET = (process.env as any)["BOT_CONTROL_SECRET"];
            
            if (guildId && BOT_URL && BOT_SECRET) {
              const res = await fetch(`${BOT_URL}/control`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-bot-secret": BOT_SECRET,
                },
                body: JSON.stringify({
                  type: 'CHECK_ROLE',
                  guildId,
                  data: {
                    userId: token.sub,
                    roleId: accessRoleId
                  }
                })
              });
              
              if (res.ok) {
                const data = await res.json();
                if (data.success && data.hasRole) {
                  token.isAdmin = true;
                }
              }
            }
          } catch (error) {
            console.error('JWT Admin Check Error:', error);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.isAdmin = token.isAdmin;
      }
      session.isAdmin = token.isAdmin;
      return session;
    },
  },
};
